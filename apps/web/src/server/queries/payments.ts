import { db } from "@/db/client";
import { payments, paymentReceivables, orders, customers } from "@/db/schema";
import { and, asc, desc, eq, gte, isNull, lt } from "drizzle-orm";

export async function getPaymentsByOrder(orderId: string) {
  return db
    .select()
    .from(payments)
    .where(and(eq(payments.orderId, orderId), isNull(payments.deletedAt)))
    .orderBy(asc(payments.paidAt));
}

export async function getReceivablesByOrder(orderId: string) {
  const rows = await db
    .select({ receivable: paymentReceivables, payment: payments })
    .from(paymentReceivables)
    .innerJoin(payments, eq(paymentReceivables.paymentId, payments.id))
    .where(and(eq(payments.orderId, orderId), isNull(payments.deletedAt)))
    .orderBy(asc(paymentReceivables.expectedAt));

  return rows.map((r) => ({ ...r.receivable, payment: r.payment }));
}

// ponytail: horizonte de 90 dias — sem ele, uma venda 12x deixa a lista de
// "a liquidar" com parcelas distantes que não são urgência de fato.
const PENDING_HORIZON_DAYS = 90;

export async function getPendingSettlements() {
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + PENDING_HORIZON_DAYS);

  const rows = await db
    .select({
      receivable: paymentReceivables,
      payment: payments,
      order: { id: orders.id },
      customer: { id: customers.id, name: customers.name },
    })
    .from(paymentReceivables)
    .innerJoin(payments, eq(paymentReceivables.paymentId, payments.id))
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(
      and(
        isNull(paymentReceivables.settledAt),
        isNull(payments.deletedAt),
        isNull(orders.deletedAt),
        lt(paymentReceivables.expectedAt, horizon)
      )
    )
    .orderBy(asc(paymentReceivables.expectedAt));

  return rows.map((r) => ({
    ...r.receivable,
    payment: r.payment,
    order: r.order,
    customer: r.customer,
  }));
}

export async function getRecentSettlements(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      receivable: paymentReceivables,
      payment: payments,
      order: { id: orders.id },
      customer: { id: customers.id, name: customers.name },
    })
    .from(paymentReceivables)
    .innerJoin(payments, eq(paymentReceivables.paymentId, payments.id))
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(
      and(
        gte(paymentReceivables.settledAt, since),
        isNull(payments.deletedAt),
        isNull(orders.deletedAt)
      )
    )
    .orderBy(desc(paymentReceivables.settledAt));

  return rows.map((r) => ({
    ...r.receivable,
    payment: r.payment,
    order: r.order,
    customer: r.customer,
  }));
}
