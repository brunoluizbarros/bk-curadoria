"use server";

import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { s3, BUCKET, publicUrl } from "@/lib/upload";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

export type S3Object = {
  key: string;
  name: string;
  lastModified?: Date;
  size?: number;
  type: "file" | "folder";
  url?: string;
};

function getClient() {
  if (!s3) throw new Error("Storage não configurado neste ambiente.");
  return s3;
}

export async function listS3Objects(prefix = ""): Promise<{ files: S3Object[]; folders: S3Object[] }> {
  await requireAdmin();
  const client = getClient();

  const validPrefix = prefix && !prefix.endsWith("/") ? `${prefix}/` : prefix;

  const response = await client.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: validPrefix, Delimiter: "/" })
  );

  const folders: S3Object[] = (response.CommonPrefixes ?? []).map((p) => {
    const key = p.Prefix ?? "";
    const parts = key.split("/");
    return { key, name: parts[parts.length - 2], type: "folder" };
  });

  const files: S3Object[] = (response.Contents ?? [])
    .filter((c) => c.Key !== validPrefix)
    .map((c) => {
      const parts = (c.Key ?? "").split("/");
      return {
        key: c.Key ?? "",
        name: parts[parts.length - 1],
        lastModified: c.LastModified,
        size: c.Size,
        type: "file",
        url: publicUrl(c.Key ?? ""),
      };
    });

  return { files, folders };
}

export async function createFolder(path: string) {
  await requireAdmin();
  const client = getClient();
  const folderKey = path.endsWith("/") ? path : `${path}/`;
  await client.send(new PutObjectCommand({ Bucket: BUCKET, Key: folderKey, Body: "" }));
  return { success: true };
}

export async function deleteS3Object(key: string) {
  await requireAdmin();
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  return { success: true };
}

export async function deleteFolder(prefix: string) {
  await requireAdmin();
  const client = getClient();

  const listed = await client.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
  );

  const objects = listed.Contents ?? [];
  if (objects.length === 0) {
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: prefix }));
    return { success: true };
  }

  await client.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: objects.map(({ Key }) => ({ Key })) },
    })
  );

  if (listed.IsTruncated) await deleteFolder(prefix);
  return { success: true };
}

export async function uploadFileToStorage(formData: FormData) {
  await requireAdmin();
  const client = getClient();

  const file = formData.get("file") as File | null;
  const path = (formData.get("path") as string) ?? "";

  if (!file) return { success: false, error: "Nenhum arquivo enviado." };

  const buffer = Buffer.from(await file.arrayBuffer());
  const folder = path.endsWith("/") ? path.slice(0, -1) : path;
  const key = folder ? `${folder}/${file.name}` : file.name;

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    })
  );

  return { success: true, key, url: publicUrl(key) };
}
