import { db } from "@/db/client";
import { siteConfig, homeDifferentials } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function getSiteConfig(): Promise<Record<string, string>> {
  const rows = await db.select().from(siteConfig);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getHomeDifferentials() {
  return db.select().from(homeDifferentials).orderBy(asc(homeDifferentials.sortOrder));
}
