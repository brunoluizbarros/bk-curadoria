import { db } from "@/db/client";
import { curadoriaContent, curadoriaCrivos, curadoriaRelacao } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function getCuradoriaContent() {
  const [content] = await db.select().from(curadoriaContent).where(eq(curadoriaContent.id, 1));
  const crivos = await db.select().from(curadoriaCrivos).orderBy(asc(curadoriaCrivos.sortOrder));
  const relacao = await db.select().from(curadoriaRelacao).orderBy(asc(curadoriaRelacao.sortOrder));
  return { content, crivos, relacao };
}
