export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "@/lib/upload";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: keyParts } = await params;
  let key = keyParts.join("/");

  // Sanitiza: descarta qualquer coisa após a extensão do arquivo
  const extMatch = key.match(/^(.+?\.(png|jpg|jpeg|gif|webp|svg|pdf|avif))/i);
  if (extMatch) key = extMatch[1];

  if (!key) return new NextResponse("Caminho inválido", { status: 400 });

  if (!s3) return new NextResponse("Storage não configurado", { status: 503 });

  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));

    if (!res.Body) return new NextResponse("Not Found", { status: 404 });

    const headers = new Headers();
    if (res.ContentType) headers.set("Content-Type", res.ContentType);
    if (res.ContentLength) headers.set("Content-Length", String(res.ContentLength));
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(res.Body.transformToWebStream(), { headers });
  } catch (err: unknown) {
    const name = err instanceof Error ? (err as { name?: string }).name : "";
    if (name === "NoSuchKey") return new NextResponse("Not Found", { status: 404 });
    console.error("[images proxy]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
