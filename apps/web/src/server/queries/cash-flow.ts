import { db } from "@/db/client";
import { paymentReceivables, payments, orders, expenses } from "@/db/schema";
import { and, eq, gte, isNotNull, isNull, lt, or } from "drizzle-orm";
import { monthBounds } from "./dre";

export interface CashFlowMonth {
  year: number;
  month: number;
  inflowRealizedCents: number;
  inflowProjectedCents: number;
  feeCents: number;
  outflowCents: number;
  balanceCents: number;
  accumulatedRealizedCents: number;
  accumulatedProjectedCents: number;
}

function yearBounds(year: number): { from: Date; to: Date } {
  return { from: monthBounds(year, 1).from, to: monthBounds(year + 1, 1).from };
}

// Uma linha de payment_receivables conta em exatamente um mês — bucket pela
// data real de liquidação quando existe, senão pela data prevista. Duas
// queries para o ano inteiro (padrão já usado pelo DRE), agregação em JS.
export async function getCashFlowYearSummary(year: number): Promise<CashFlowMonth[]> {
  const { from, to } = yearBounds(year);

  const inflowRows = await db
    .select({
      netCents: paymentReceivables.netCents,
      feeCents: paymentReceivables.feeCents,
      settledAt: paymentReceivables.settledAt,
      expectedAt: paymentReceivables.expectedAt,
    })
    .from(paymentReceivables)
    .innerJoin(payments, eq(paymentReceivables.paymentId, payments.id))
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(
      and(
        isNull(payments.deletedAt),
        isNull(orders.deletedAt),
        or(
          and(
            isNotNull(paymentReceivables.settledAt),
            gte(paymentReceivables.settledAt, from),
            lt(paymentReceivables.settledAt, to)
          ),
          and(
            isNull(paymentReceivables.settledAt),
            gte(paymentReceivables.expectedAt, from),
            lt(paymentReceivables.expectedAt, to)
          )
        )
      )
    );

  const outflowRows = await db
    .select({ amountCents: expenses.amountCents, paidAt: expenses.paidAt })
    .from(expenses)
    .where(and(gte(expenses.paidAt, from), lt(expenses.paidAt, to), isNull(expenses.deletedAt)));

  const months: CashFlowMonth[] = Array.from({ length: 12 }, (_, i) => ({
    year,
    month: i + 1,
    inflowRealizedCents: 0,
    inflowProjectedCents: 0,
    feeCents: 0,
    outflowCents: 0,
    balanceCents: 0,
    accumulatedRealizedCents: 0,
    accumulatedProjectedCents: 0,
  }));

  for (const r of inflowRows) {
    const bucketDate = r.settledAt ?? r.expectedAt;
    const m = months[bucketDate.getMonth()];
    if (r.settledAt) m.inflowRealizedCents += r.netCents;
    else m.inflowProjectedCents += r.netCents;
    m.feeCents += r.feeCents;
  }

  for (const e of outflowRows) {
    months[e.paidAt.getMonth()].outflowCents += e.amountCents;
  }

  // Dois acumulados: só realizado (dinheiro que já entrou de fato) e
  // com projeção (inclui recebíveis previstos, que podem nunca liquidar).
  // Sem isso, um recebível vencido que nunca é liquidado infla o saldo
  // "acumulado" para sempre.
  let accumulatedRealized = 0;
  let accumulatedProjected = 0;
  for (const m of months) {
    m.balanceCents = m.inflowRealizedCents + m.inflowProjectedCents - m.outflowCents;
    accumulatedRealized += m.inflowRealizedCents - m.outflowCents;
    accumulatedProjected += m.balanceCents;
    m.accumulatedRealizedCents = accumulatedRealized;
    m.accumulatedProjectedCents = accumulatedProjected;
  }

  return months;
}
