"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { categories } from "@/db/schema";
import { categorySchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

export async function createCategory(data: unknown) {
  await requireAdmin();
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  await db.insert(categories).values(parsed.data);
  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function updateCategory(id: string, data: unknown) {
  await requireAdmin();
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  await db.update(categories).set(parsed.data).where(eq(categories.id, id));
  revalidatePath("/");
  return { success: true };
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/");
  return { success: true };
}
