import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { s3, BUCKET } from "@/lib/upload";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE = 10 * 1024 * 1024;
const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { contentType, size } = await req.json();

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido" }, { status: 400 });
  }

  if (size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande (máx. 10MB)" }, { status: 400 });
  }

  const ext = contentType.split("/")[1].replace("jpeg", "jpg");
  const key = `products/${randomUUID()}.${ext}`;

  if (isDev) {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
    const uploadUrl = `${base}/api/uploads/local?key=${encodeURIComponent(key)}`;
    return NextResponse.json({ uploadUrl, key });
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });

  const uploadUrl = await getSignedUrl(s3!, command, { expiresIn: 300 });
  return NextResponse.json({ uploadUrl, key });
}
