import { db } from "@/db/client";
import { expenses, expenseCategories } from "@/db/schema";
import { and, asc, count, desc, eq, gte, isNull, lte } from "drizzle-orm";

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

export async function getAllExpenses(
  filters?: { from?: Date; to?: Date; categoryId?: string },
  pagination?: { page: number; limit: number }
) {
  const conditions = [isNull(expenses.deletedAt)];
  if (filters?.from) conditions.push(gte(expenses.paidAt, filters.from));
  if (filters?.to) conditions.push(lte(expenses.paidAt, filters.to));
  if (filters?.categoryId) conditions.push(eq(expenses.categoryId, filters.categoryId));

  const where = and(...conditions);
  const limit = pagination?.limit ?? 1000;
  const offset = pagination ? (pagination.page - 1) * pagination.limit : 0;

  const [[countRow], rows] = await Promise.all([
    db.select({ total: count() }).from(expenses).where(where),
    db
      .select({ expense: expenses, category: expenseCategories })
      .from(expenses)
      .innerJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(where)
      .orderBy(desc(expenses.paidAt))
      .limit(limit)
      .offset(offset),
  ]);

  return {
    items: rows.map((r) => ({ ...r.expense, category: r.category })),
    total: countRow.total,
  };
}
