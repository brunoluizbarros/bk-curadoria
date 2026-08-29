"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { curadoriaContent, curadoriaCrivos, curadoriaRelacao } from "@/db/schema";
import { curadoriaContentSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

export async function updateCuradoriaContent(data: unknown) {
  await requireAdmin();
  const parsed = curadoriaContentSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  await db
    .insert(curadoriaContent)
    .values({ id: 1, ...parsed.data })
    .onConflictDoUpdate({ target: curadoriaContent.id, set: { ...parsed.data, updatedAt: new Date() } });

  revalidatePath("/curadoria");
  return { success: true };
}

export async function upsertCrivo(data: { id?: string; number: string; title: string; description: string; sortOrder: number }) {
  await requireAdmin();

  if (data.id) {
    await db.update(curadoriaCrivos).set(data).where(eq(curadoriaCrivos.id, data.id));
  } else {
    await db.insert(curadoriaCrivos).values(data);
  }

  revalidatePath("/curadoria");
  return { success: true };
}

export async function deleteCrivo(id: string) {
  await requireAdmin();
  await db.delete(curadoriaCrivos).where(eq(curadoriaCrivos.id, id));
  revalidatePath("/curadoria");
  return { success: true };
}

export async function upsertRelacao(data: { id?: string; title: string; description: string; sortOrder: number }) {
  await requireAdmin();

  if (data.id) {
    await db.update(curadoriaRelacao).set(data).where(eq(curadoriaRelacao.id, data.id));
  } else {
    await db.insert(curadoriaRelacao).values(data);
  }

  revalidatePath("/curadoria");
  return { success: true };
}

export async function deleteRelacao(id: string) {
  await requireAdmin();
  await db.delete(curadoriaRelacao).where(eq(curadoriaRelacao.id, id));
  revalidatePath("/curadoria");
  return { success: true };
}
