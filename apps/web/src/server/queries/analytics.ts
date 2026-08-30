import { db } from "@/db/client";
import { orders, orderItems, customers } from "@/db/schema";
import { and, eq, gte, inArray, isNull, ne } from "drizzle-orm";
import { computeOrderItemTotal } from "./orders";

export interface CustomerPurchaseRanking {
  customerId: string;
  name: string;
  phone: string;
  totalCents: number;
  orderCount: number;
  lastPurchaseAt: Date;
}

// Ranking de clientes por valor comprado e por frequência de pedidos,
// considerando pedidos não cancelados/rascunho dos últimos N meses.
export async function getCustomerPurchaseRanking(months = 12): Promise<CustomerPurchaseRanking[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const rows = await db
    .select({
      order: orders,
      customerId: customers.id,
      name: customers.name,
      phone: customers.phone,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(
      and(
        gte(orders.soldAt, since),
        isNull(orders.deletedAt),
        ne(orders.status, "draft"),
        ne(orders.status, "cancelled")
      )
    );

  if (!rows.length) return [];

  const orderIds = rows.map((r) => r.order.id);
  const items = await db
    .select({
      orderId: orderItems.orderId,
      status: orderItems.status,
      unitPriceCents: orderItems.unitPriceCents,
      discountCents: orderItems.discountCents,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(and(inArray(orderItems.orderId, orderIds), isNull(orderItems.deletedAt)));

  const byCustomer = new Map<string, CustomerPurchaseRanking>();
  for (const r of rows) {
    const total = computeOrderItemTotal(
      items.filter((i) => i.orderId === r.order.id),
      r.order.discountCents,
      r.order.shippingCents,
      r.order.creditAppliedCents
    );
    const existing = byCustomer.get(r.customerId);
    if (existing) {
      existing.totalCents += total;
      existing.orderCount += 1;
      if (r.order.soldAt > existing.lastPurchaseAt) existing.lastPurchaseAt = r.order.soldAt;
    } else {
      byCustomer.set(r.customerId, {
        customerId: r.customerId,
        name: r.name,
        phone: r.phone,
        totalCents: total,
        orderCount: 1,
        lastPurchaseAt: r.order.soldAt,
      });
    }
  }

  return Array.from(byCustomer.values());
}
