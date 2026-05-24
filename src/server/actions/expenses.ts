"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { expenses } from "@/db/schema";
import { expenseSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

export async function createExpense(data: unknown) {
  await requireAdmin();
  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const [row] = await db
    .insert(expenses)
    .values({ ...parsed.data, paidAt: new Date(parsed.data.paidAt) })
    .returning({ id: expenses.id });

  revalidatePath("/admin/despesas");
  revalidatePath("/admin/dre");
  return { id: row.id };
}

export async function updateExpense(id: string, data: unknown) {
  await requireAdmin();
  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  await db
    .update(expenses)
    .set({ ...parsed.data, paidAt: new Date(parsed.data.paidAt), updatedAt: new Date() })
    .where(eq(expenses.id, id));

  revalidatePath("/admin/despesas");
  revalidatePath("/admin/dre");
  return { success: true };
}

export async function deleteExpense(id: string) {
  await requireAdmin();
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidatePath("/admin/despesas");
  revalidatePath("/admin/dre");
  return { success: true };
}
