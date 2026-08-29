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
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  if (entry.count >= LOGIN_MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
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
