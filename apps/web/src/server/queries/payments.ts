import { db } from "@/db/client";
import { payments, paymentReceivables, orders, customers } from "@/db/schema";
import { and, asc, desc, eq, gte, ilike, isNotNull, isNull, lt, sql } from "drizzle-orm";

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

export type ReceivableSort = "date_asc" | "date_desc" | "name_asc" | "name_desc" | "value_asc" | "value_desc";

// Meses (YYYY-MM) com pelo menos um recebível — usado nas abas de filtro da tela de recebimentos
export async function getReceivableMonths(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ ym: sql<string>`to_char(${paymentReceivables.expectedAt}, 'YYYY-MM')` })
    .from(paymentReceivables)
    .innerJoin(payments, eq(paymentReceivables.paymentId, payments.id))
    .where(isNull(payments.deletedAt));

  const months = new Set(rows.map((r) => r.ym));
  months.add(new Date().toISOString().slice(0, 7));
  return Array.from(months).sort((a, b) => b.localeCompare(a));
}

export type ReceivableStatus = "pending" | "settled";

// Todos os recebíveis (liquidados ou não) de um mês/busca, para a tela de Recebimentos
export async function getReceivables(
  filters?: { ym?: string; search?: string; status?: ReceivableStatus },
  sort: ReceivableSort = "date_asc"
) {
  const conditions = [isNull(payments.deletedAt), isNull(orders.deletedAt)];
  if (filters?.ym) {
    const [year, month] = filters.ym.split("-").map(Number);
    conditions.push(gte(paymentReceivables.expectedAt, new Date(year, month - 1, 1)));
    conditions.push(lt(paymentReceivables.expectedAt, new Date(year, month, 1)));
  }
  if (filters?.search) conditions.push(ilike(customers.name, `%${filters.search}%`));
  if (filters?.status === "pending") conditions.push(isNull(paymentReceivables.settledAt));
  if (filters?.status === "settled") conditions.push(isNotNull(paymentReceivables.settledAt));

  const orderBy =
    sort === "date_desc"
      ? [desc(paymentReceivables.expectedAt)]
      : sort === "name_asc"
        ? [asc(customers.name)]
        : sort === "name_desc"
          ? [desc(customers.name)]
          : sort === "value_asc"
            ? [asc(paymentReceivables.netCents)]
            : sort === "value_desc"
              ? [desc(paymentReceivables.netCents)]
              : [asc(paymentReceivables.expectedAt)];

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
    .where(and(...conditions))
    .orderBy(...orderBy);

  return rows.map((r) => ({
    ...r.receivable,
    payment: r.payment,
    order: r.order,
    customer: r.customer,
  }));
}
