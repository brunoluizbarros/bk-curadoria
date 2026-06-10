import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_PRIVATE_URL ?? process.env.DATABASE_URL!, {
  max: 5,
  idle_timeout: 20,
  max_lifetime: 1800,
  connect_timeout: 10,
  prepare: false,   // evita prepared statements que ficam inválidos após restart do Railway
});
export const db = drizzle(client, { schema });
