import { db } from "@/db/client";
import { payments, paymentReceivables, expenses, expenseCategories, orders } from "@/db/schema";
import { and, eq, gte, isNull, lt, sum } from "drizzle-orm";

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

export function monthBounds(year: number, month: number): { from: Date; to: Date } {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  return { from, to };
}

export async function getDREByMonth(year: number, month: number): Promise<DREMonth> {
  const { from, to } = monthBounds(year, month);

  // Receita: recebíveis com settledAt no mês (regime de caixa). Fonte única
  // com o Fluxo de Caixa — payment_receivables — pedido/pagamento apagado
  // (soft delete) não deve continuar contando como receita.
  const settledReceivables = await db
    .select({
      method: payments.method,
      netCents: paymentReceivables.netCents,
    })
    .from(paymentReceivables)
    .innerJoin(payments, eq(paymentReceivables.paymentId, payments.id))
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(
      and(
        gte(paymentReceivables.settledAt, from),
        lt(paymentReceivables.settledAt, to),
        isNull(payments.deletedAt),
        isNull(orders.deletedAt)
      )
    );

  // Pendente: recebíveis com expectedAt no mês mas ainda não liquidados
  const [pendingRow] = await db
    .select({ total: sum(paymentReceivables.netCents) })
    .from(paymentReceivables)
    .innerJoin(payments, eq(paymentReceivables.paymentId, payments.id))
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(
      and(
        gte(paymentReceivables.expectedAt, from),
        lt(paymentReceivables.expectedAt, to),
        isNull(paymentReceivables.settledAt),
        isNull(payments.deletedAt),
        isNull(orders.deletedAt)
      )
    );

  const byMethod: Record<string, number> = {};
  let totalNetCents = 0;
  for (const p of settledReceivables) {
    byMethod[p.method] = (byMethod[p.method] ?? 0) + p.netCents;
    totalNetCents += p.netCents;
  }

  // Despesas: paidAt no mês (lt no limite superior evita dupla contagem no dia 1)
  const expenseRows = await db
    .select({
      amountCents: expenses.amountCents,
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
    })
    .from(expenses)
    .innerJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .where(
      and(
        gte(expenses.paidAt, from),
        lt(expenses.paidAt, to),
        isNull(expenses.deletedAt)
      )
    );

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
