import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { loginSchema } from "@/lib/validations";
import { signMobileToken, checkLoginRateLimit, clientIpFromRequest } from "@/lib/mobile-auth";

// hash bcrypt "decoy" sem senha correspondente — comparado quando o email não existe,
// pra manter o tempo de resposta igual ao de uma senha errada e não vazar quais emails
// têm conta via timing (bcrypt.compare é a parte lenta do endpoint)
const DECOY_HASH = "$2b$10$fl9Yu1F8vNeFwg3J5YZ36.0Ez464RWIH7dVPT8lPCliXMhriyf0i2";

export async function POST(req: NextRequest) {
  const ip = clientIpFromRequest(req);
  if (!checkLoginRateLimit(ip)) {
    return NextResponse.json({ error: "Muitas tentativas — tente novamente em alguns minutos" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email));
  const valid = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DECOY_HASH);
  if (!user || !valid) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  const token = await signMobileToken(user.id);
  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
