/**
 * Backup PostgreSQL → Cloudflare R2
 *
 * Uso local:
 *   DATABASE_URL="..." R2_ACCOUNT_ID="..." ... npx tsx scripts/backup-db.ts
 *
 * No Railway, configurar como Cron Job com Start Command: npm run backup:db
 * Schedule: 55 3 * * * (00:55 Recife = 03:55 UTC)
 */

import { PassThrough } from "node:stream";
import { createGzip } from "node:zlib";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import postgres from "postgres";

function requireEnv(name: string): string {
  const val = process.env[name]?.trim();
  if (!val) throw new Error(`Variável obrigatória não definida: ${name}`);
  return val;
}

function escapePostgresValue(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number" || typeof val === "bigint") return String(val);
  if (val instanceof Date) {
    return `'${val.toISOString().replace("T", " ").replace("Z", "")}'`;
  }
  if (Buffer.isBuffer(val) || val instanceof Uint8Array) {
    return `'\\x${Buffer.from(val).toString("hex")}'`;
  }
  if (typeof val === "object") {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function createDumpStream(sql: postgres.Sql): Promise<PassThrough> {
  const pass = new PassThrough();

  (async () => {
    try {
      pass.write(`-- Backup: ${new Date().toISOString()}\n`);
      pass.write(`SET session_replication_role = 'replica';\n\n`);

      const tables = await sql<{ tablename: string }[]>`
        SELECT tablename
        FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
      `;

      for (const { tablename } of tables) {
        console.log(`[Dump] ${tablename}`);

        const columns = await sql<{ column_name: string }[]>`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name   = ${tablename}
            AND table_schema = 'public'
          ORDER BY ordinal_position
        `;

        if (columns.length === 0) continue;

        const colNames = columns.map((c) => c.column_name);
        const colList  = colNames.map((c) => `"${c}"`).join(", ");

        pass.write(`-- ${tablename}\n`);

        const cursor = sql`SELECT * FROM ${sql(tablename)}`.cursor(200);

        let rowCount = 0;
        for await (const rows of cursor) {
          for (const row of rows) {
            const values = colNames
              .map((c) => escapePostgresValue((row as Record<string, unknown>)[c]))
              .join(", ");
            pass.write(
              `INSERT INTO "public"."${tablename}" (${colList}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`
            );
            rowCount++;
          }
        }

        if (rowCount > 0) pass.write("\n");
      }

      pass.write(`SET session_replication_role = 'origin';\n`);
      pass.end();
    } catch (err) {
      pass.destroy(err as Error);
    }
  })();

  return pass;
}

async function deletePreviousBackups(s3: S3Client, bucket: string, currentKey: string) {
  const list = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: "backups/" }));
  const toDelete = (list.Contents ?? [])
    .map((obj) => obj.Key!)
    .filter((key) => key && key !== currentKey);

  if (toDelete.length === 0) return;

  await s3.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: toDelete.map((Key) => ({ Key })), Quiet: true },
    })
  );

  console.log(`[Backup] ${toDelete.length} backup(s) anterior(es) removido(s).`);
}

async function main() {
  const databaseUrl =
    (process.env.DATABASE_PRIVATE_URL ?? process.env.DATABASE_URL)?.trim() ??
    (() => {
      throw new Error("DATABASE_URL não definida");
    })();

  const r2AccountId       = requireEnv("R2_ACCOUNT_ID");
  const r2AccessKeyId     = requireEnv("R2_ACCESS_KEY_ID");
  const r2SecretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");
  const r2Bucket          = requireEnv("R2_BUCKET");

  const now       = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").replace("Z", "");
  const s3Key     = `backups/bkcuradoria-${timestamp}.sql.gz`;

  const url = new URL(databaseUrl);
  console.log(`[Backup] ${url.pathname.replace("/", "")}@${url.hostname}`);
  console.log(`[Backup] Destino: r2://${r2Bucket}/${s3Key}`);

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: r2AccessKeyId, secretAccessKey: r2SecretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  const sql = postgres(databaseUrl, { ssl: "prefer", max: 1 });

  const dumpStream = await createDumpStream(sql);
  const gzip = createGzip();

  // .pipe() não propaga 'error' entre streams — sem isso, um erro aqui (ex: falha de
  // conexão) derruba o processo direto (unhandled 'error' event) e pula o withRetry.
  const streamError = new Promise<never>((_, reject) => {
    dumpStream.once("error", reject);
    gzip.once("error", reject);
  });

  dumpStream.pipe(gzip);

  let uploadedBytes = 0;

  const upload = new Upload({
    client: s3,
    params: { Bucket: r2Bucket, Key: s3Key, Body: gzip, ContentType: "application/gzip" },
  });

  upload.on("httpUploadProgress", (p) => {
    if (p.loaded) {
      uploadedBytes = p.loaded;
      process.stdout.write(`\r[Upload] ${(uploadedBytes / 1024 / 1024).toFixed(2)} MB...`);
    }
  });

  await Promise.race([upload.done(), streamError]);
  process.stdout.write("\n");

  await sql.end();

  const sizeMB = (uploadedBytes / 1024 / 1024).toFixed(2);
  console.log(`[Backup] Concluído: ${s3Key} (${sizeMB} MB)`);

  await deletePreviousBackups(s3, r2Bucket, s3Key);

  process.exit(0);
}

async function withRetry(fn: () => Promise<void>, attempts = 3): Promise<void> {
  for (let i = 1; i <= attempts; i++) {
    try {
      await fn();
      return;
    } catch (err) {
      console.error(`[Backup] Tentativa ${i}/${attempts} falhou:`, err instanceof Error ? err.message : err);
      if (i < attempts) {
        const delay = i * 10_000;
        console.log(`[Backup] Aguardando ${delay / 1000}s antes de tentar novamente...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  console.error("[Backup] Todas as tentativas falharam.");
  process.exit(1);
}

withRetry(main);
