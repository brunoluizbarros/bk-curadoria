import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "@/lib/upload";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: keyParts } = await params;
  const key = keyParts.join("/");

  if (!s3) {
    return new NextResponse("Storage não configurado", { status: 503 });
  }

  try {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const res = await s3.send(cmd);

    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) return new NextResponse("Not Found", { status: 404 });

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": res.ContentType ?? "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
