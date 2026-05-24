import { db } from "@/db/client";
import { payments, orders, customers } from "@/db/schema";
import { and, asc, desc, eq, gte, isNull } from "drizzle-orm";

export async function getPaymentsByOrder(orderId: string) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .orderBy(asc(payments.paidAt));
}

export async function getPendingSettlements() {
  const rows = await db
    .select({
      payment: payments,
      order: { id: orders.id },
      customer: { id: customers.id, name: customers.name },
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(isNull(payments.settledAt))
    .orderBy(asc(payments.paidAt));

  return rows.map((r) => ({
    ...r.payment,
    order: r.order,
    customer: r.customer,
  }));
}

export async function getRecentSettlements(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      payment: payments,
      order: { id: orders.id },
      customer: { id: customers.id, name: customers.name },
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(and(gte(payments.settledAt, since)))
    .orderBy(desc(payments.settledAt));

  return rows.map((r) => ({
    ...r.payment,
    order: r.order,
    customer: r.customer,
  }));
}
