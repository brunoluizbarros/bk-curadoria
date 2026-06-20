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

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function createExpense(data: unknown) {
  await requireAdmin();
  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { installments = 1, amountCents, paidAt, ...rest } = parsed.data;
  const baseDate = new Date(paidAt);

  if (installments <= 1) {
    const [row] = await db
      .insert(expenses)
      .values({ ...rest, amountCents, paidAt: baseDate })
      .returning({ id: expenses.id });

    revalidatePath("/admin/despesas");
    revalidatePath("/admin/dre");
    return { id: row.id };
  }

  const groupId = crypto.randomUUID();
  const perInstallmentCents = Math.floor(amountCents / installments);
  const remainder = amountCents - perInstallmentCents * installments;

  const rows = Array.from({ length: installments }, (_, i) => ({
    ...rest,
    amountCents: i === installments - 1 ? perInstallmentCents + remainder : perInstallmentCents,
    paidAt: addMonths(baseDate, i),
    installmentGroupId: groupId,
    installmentNumber: i + 1,
    totalInstallments: installments,
  }));

  const [firstRow] = await db.insert(expenses).values(rows).returning({ id: expenses.id });

  revalidatePath("/admin/despesas");
  revalidatePath("/admin/dre");
  return { id: firstRow.id };
}

export async function updateExpense(id: string, data: unknown) {
  await requireAdmin();
  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { installments: _installments, ...fields } = parsed.data;

  await db
    .update(expenses)
    .set({ ...fields, paidAt: new Date(fields.paidAt), updatedAt: new Date() })
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

export async function deleteExpenseGroup(groupId: string) {
  await requireAdmin();
  await db.delete(expenses).where(eq(expenses.installmentGroupId, groupId));
  revalidatePath("/admin/despesas");
  revalidatePath("/admin/dre");
  return { success: true };
}

export async function updateExpenseGroup(groupId: string, data: unknown) {
  await requireAdmin();
  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { installments = 1, amountCents, paidAt, ...rest } = parsed.data;
  const baseDate = new Date(paidAt);

  await db.delete(expenses).where(eq(expenses.installmentGroupId, groupId));

  const perInstallmentCents = Math.floor(amountCents / installments);
  const remainder = amountCents - perInstallmentCents * installments;

  const rows = Array.from({ length: installments }, (_, i) => ({
    ...rest,
    amountCents: i === installments - 1 ? perInstallmentCents + remainder : perInstallmentCents,
    paidAt: addMonths(baseDate, i),
    installmentGroupId: groupId,
    installmentNumber: i + 1,
    totalInstallments: installments,
  }));

  await db.insert(expenses).values(rows);

  revalidatePath("/admin/despesas");
  revalidatePath("/admin/dre");
  return { success: true };
}
