import postgres from "postgres";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error("Uso: tsx scripts/create-admin.ts <email> <senha>");
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    console.log(`Admin já existe: ${email}`);
    await client.end();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({ email, passwordHash, name: "Admin" });
  console.log(`Admin criado: ${email}`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
