import { db } from "@/db/client";
import { expenses, expenseCategories } from "@/db/schema";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";

export async function getExpenseCategories() {
  return db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.active, true))
    .orderBy(asc(expenseCategories.sortOrder), asc(expenseCategories.name));
}

export async function getAllExpenseCategories() {
  return db
    .select()
    .from(expenseCategories)
    .orderBy(asc(expenseCategories.sortOrder), asc(expenseCategories.name));
}

export async function getAllExpenses(filters?: {
  from?: Date;
  to?: Date;
  categoryId?: string;
}) {
  const conditions = [];
  if (filters?.from) conditions.push(gte(expenses.paidAt, filters.from));
  if (filters?.to) conditions.push(lte(expenses.paidAt, filters.to));
  if (filters?.categoryId) conditions.push(eq(expenses.categoryId, filters.categoryId));

  const rows = await db
    .select({ expense: expenses, category: expenseCategories })
    .from(expenses)
    .innerJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(expenses.paidAt));

  return rows.map((r) => ({ ...r.expense, category: r.category }));
}
