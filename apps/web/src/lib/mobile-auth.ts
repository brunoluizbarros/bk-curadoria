import { SignJWT, jwtVerify, errors as joseErrors } from "jose";
import { NextRequest, NextResponse } from "next/server";

const AUDIENCE = "mobile";
const EXPIRES_IN = "365d";

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não definida");
  return new TextEncoder().encode(secret);
}

export async function signMobileToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(secretKey());
}

export async function verifyMobileToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { audience: AUDIENCE });
    if (!payload.sub) return null;
    return { sub: payload.sub };
  } catch (err) {
    if (err instanceof joseErrors.JOSEError) return null;
    throw err;
  }
}

// ponytail: rate limit em memória, por instância — se algum dia rodar em mais de um
// container, precisa virar Redis (ou algo compartilhado) pra continuar valendo.
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
// teto duro no tamanho do Map: sem isso, um atacante variando a chave (ex: forjando
// X-Forwarded-For a cada request) cresce a memória do processo indefinidamente
const LOGIN_MAP_MAX_ENTRIES = 5000;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginRateLimit(key: string): boolean {
  const now = Date.now();
  if (loginAttempts.size >= LOGIN_MAP_MAX_ENTRIES && !loginAttempts.has(key)) {
    loginAttempts.clear();
  }

  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  if (entry.count >= LOGIN_MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

// Extrai o IP mais confiável de X-Forwarded-For: o ÚLTIMO salto é o que o proxy da
// Railway anexou de fato; qualquer valor à esquerda pode ter sido forjado pelo cliente.
export function clientIpFromRequest(req: { headers: { get(name: string): string | null } }): string {
  const xff = req.headers.get("x-forwarded-for");
  if (!xff) return "unknown";
  const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? "unknown";
}

type RouteHandler<T> = (req: NextRequest, ctx: T, userId: string) => Promise<Response>;

export function withMobileAuth<T>(handler: RouteHandler<T>) {
  return async (req: NextRequest, ctx: T): Promise<Response> => {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const claims = await verifyMobileToken(token);
    if (!claims) {
      return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 });
    }

    return handler(req, ctx, claims.sub);
  };
}
