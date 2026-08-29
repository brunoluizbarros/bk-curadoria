/**
 * Teste do módulo de auth mobile (sign/verify JWT). Sem framework.
 * Uso: AUTH_SECRET=... tsx scripts/check-mobile-auth.ts
 */
import { SignJWT } from "jose";
import { signMobileToken, verifyMobileToken } from "../src/lib/mobile-auth";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    console.error(`✗ ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

async function main() {
  if (!process.env.AUTH_SECRET) process.env.AUTH_SECRET = "test-secret-only-for-this-script";

  const userId = "11111111-1111-1111-1111-111111111111";

  const token = await signMobileToken(userId);
  const verified = await verifyMobileToken(token);
  assert(verified?.sub === userId, "sign→verify volta o mesmo sub");

  const wrongAudience = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setAudience("web")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET));
  assert((await verifyMobileToken(wrongAudience)) === null, "token com aud errado falha");

  const expired = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setAudience("mobile")
    .setIssuedAt()
    .setExpirationTime("-1s")
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET));
  assert((await verifyMobileToken(expired)) === null, "token expirado falha");

  const wrongSecretToken = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setAudience("mobile")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode("outro-segredo-completamente-diferente"));
  assert((await verifyMobileToken(wrongSecretToken)) === null, "token com segredo errado falha");

  if (process.exitCode === 1) {
    console.error("\nFALHOU");
  } else {
    console.log("\nOK");
  }
}

main();
