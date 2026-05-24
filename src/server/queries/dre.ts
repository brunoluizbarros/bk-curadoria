import { db } from "@/db/client";
import { payments, expenses, expenseCategories } from "@/db/schema";
import { and, eq, gte, isNull, lte, sum } from "drizzle-orm";

export interface DREMonth {
  year: number;
  month: number;
  revenue: {
    totalNetCents: number;
    byMethod: Record<string, number>;
  };
  expenses: {
    totalCents: number;
    byCategory: { name: string; totalCents: number }[];
  };
  resultCents: number;
  pendingSettlementCents: number;
}

function monthBounds(year: number, month: number): { from: Date; to: Date } {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  return { from, to };
}

export async function getDREByMonth(year: number, month: number): Promise<DREMonth> {
  const { from, to } = monthBounds(year, month);

  // Receita: payments com settledAt no mês (regime de caixa)
  const settledPayments = await db
    .select({
      method: payments.method,
      netCents: payments.netCents,
    })
    .from(payments)
    .where(and(gte(payments.settledAt, from), lte(payments.settledAt, to)));

  // Pendente: payments com paid_at no mês mas settledAt nulo
  const [pendingRow] = await db
    .select({ total: sum(payments.grossCents) })
    .from(payments)
    .where(
      and(
        gte(payments.paidAt, from),
        lte(payments.paidAt, to),
        isNull(payments.settledAt)
      )
    );

  const byMethod: Record<string, number> = {};
  let totalNetCents = 0;
  for (const p of settledPayments) {
    byMethod[p.method] = (byMethod[p.method] ?? 0) + p.netCents;
    totalNetCents += p.netCents;
  }

  // Despesas: paidAt no mês
  const expenseRows = await db
    .select({
      amountCents: expenses.amountCents,
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
    })
    .from(expenses)
    .innerJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .where(and(gte(expenses.paidAt, from), lte(expenses.paidAt, to)));

  const categoryMap: Record<string, number> = {};
  let totalExpCents = 0;
  for (const e of expenseRows) {
    categoryMap[e.categoryName] = (categoryMap[e.categoryName] ?? 0) + e.amountCents;
    totalExpCents += e.amountCents;
  }

  return {
    year,
    month,
    revenue: {
      totalNetCents,
      byMethod,
    },
    expenses: {
      totalCents: totalExpCents,
      byCategory: Object.entries(categoryMap)
        .map(([name, totalCents]) => ({ name, totalCents }))
        .sort((a, b) => b.totalCents - a.totalCents),
    },
    resultCents: totalNetCents - totalExpCents,
    pendingSettlementCents: Number(pendingRow?.total ?? 0),
  };
}

export async function getDREYearSummary(year: number) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  return Promise.all(months.map((m) => getDREByMonth(year, m)));
}
