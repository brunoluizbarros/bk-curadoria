import { db } from "@/db/client";
import { payments, expenses, expenseCategories, orders } from "@/db/schema";
import { and, eq, gte, isNull, lt } from "drizzle-orm";

export interface DREMonth {
  year: number;
  month: number;
  revenue: {
    totalGrossCents: number;
    byMethod: Record<string, number>;
  };
  cardFeesCents: number;
  expenses: {
    totalCents: number;
    byCategory: { name: string; totalCents: number }[];
  };
  resultCents: number;
}

export function monthBounds(year: number, month: number): { from: Date; to: Date } {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  return { from, to };
}

export function yearBounds(year: number): { from: Date; to: Date } {
  return { from: monthBounds(year, 1).from, to: monthBounds(year + 1, 1).from };
}

export async function getDREByMonth(year: number, month: number): Promise<DREMonth> {
  const { from, to } = monthBounds(year, month);

  // Receita: regime de competência — reconhecida quando o PEDIDO é confirmado
  // pago (orders.paidAt), pelo valor BRUTO vendido, não quando o recebível
  // liquida na conta (isso é o Fluxo de Caixa, outra fonte). Um pedido só tem
  // paidAt setado uma vez, então cada pagamento ligado a ele entra inteiro no
  // mês da venda, mesmo que a maquininha ainda vá liquidar meses depois.
  const paymentRows = await db
    .select({
      method: payments.method,
      grossCents: payments.grossCents,
      feeCents: payments.feeCents,
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(
      and(
        gte(orders.paidAt, from),
        lt(orders.paidAt, to),
        isNull(payments.deletedAt),
        isNull(orders.deletedAt)
      )
    );

  const byMethod: Record<string, number> = {};
  let totalGrossCents = 0;
  let cardFeesCents = 0;
  for (const p of paymentRows) {
    byMethod[p.method] = (byMethod[p.method] ?? 0) + p.grossCents;
    totalGrossCents += p.grossCents;
    cardFeesCents += p.feeCents;
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
      totalGrossCents,
      byMethod,
    },
    cardFeesCents,
    expenses: {
      totalCents: totalExpCents,
      byCategory: Object.entries(categoryMap)
        .map(([name, totalCents]) => ({ name, totalCents }))
        .sort((a, b) => b.totalCents - a.totalCents),
    },
    // Taxa de cartão é despesa financeira (custo da venda), não abatimento de
    // receita — receita bruta menos taxas menos despesas operacionais.
    resultCents: totalGrossCents - cardFeesCents - totalExpCents,
  };
}

export async function getDREYearSummary(year: number) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  return Promise.all(months.map((m) => getDREByMonth(year, m)));
}
