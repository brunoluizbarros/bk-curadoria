import { S3Client } from "@aws-sdk/client-s3";

const isDev = process.env.NODE_ENV === "development";

function createClient() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.STORAGE_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

export const s3: S3Client | null = isDev ? null : createClient();
export const BUCKET = process.env.STORAGE_BUCKET ?? "bkcuradoria";
export const PUBLIC_BASE = process.env.STORAGE_PUBLIC_BASE ?? "";

export function publicUrl(key: string): string {
  if (isDev) return `/uploads/${key}`;
  // Se PUBLIC_BASE estiver configurado (bucket público), usa URL direta.
  // Caso contrário, serve via rota proxy /api/images/<key>.
  if (PUBLIC_BASE) return `${PUBLIC_BASE}/${key}`;
  return `/api/images/${key}`;
}
