"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { expenseCategories } from "@/db/schema";
import { expenseCategorySchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

export async function createExpenseCategory(data: unknown) {
  await requireAdmin();
  const parsed = expenseCategorySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const [row] = await db
    .insert(expenseCategories)
    .values(parsed.data)
    .returning({ id: expenseCategories.id });

  revalidatePath("/admin/despesas/categorias");
  return { id: row.id };
}

export async function updateExpenseCategory(id: string, data: unknown) {
  await requireAdmin();
  const parsed = expenseCategorySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  await db
    .update(expenseCategories)
    .set(parsed.data)
    .where(eq(expenseCategories.id, id));

  revalidatePath("/admin/despesas/categorias");
  return { success: true };
}

export async function deleteExpenseCategory(id: string) {
  await requireAdmin();
  try {
    await db.delete(expenseCategories).where(eq(expenseCategories.id, id));
    revalidatePath("/admin/despesas/categorias");
    return { success: true };
  } catch {
    return { error: "Categoria possui despesas e não pode ser removida." };
  }
}
