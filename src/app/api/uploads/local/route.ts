import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";

// Rota de upload local — apenas em desenvolvimento
export async function PUT(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Não disponível em produção" }, { status: 403 });
  }

  const key = req.nextUrl.searchParams.get("key");
  if (!key || key.includes("..")) {
    return NextResponse.json({ error: "Key inválida" }, { status: 400 });
  }

  const buffer = Buffer.from(await req.arrayBuffer());
  const filePath = join(process.cwd(), "public", "uploads", key);

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);

  return new NextResponse(null, { status: 200 });
}
