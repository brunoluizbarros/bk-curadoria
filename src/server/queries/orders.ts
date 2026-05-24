import { db } from "@/db/client";
import { orders, orderItems, customers, addresses, products, productImages, payments } from "@/db/schema";
import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";

export type OrderStatus = "draft" | "sent" | "returned" | "paid" | "cancelled";

export function computeOrderItemTotal(
  items: { unitPriceCents: number; quantity: number; status: string }[],
  discountCents: number,
  shippingCents: number
): number {
  const keptTotal = items
    .filter((i) => i.status === "kept")
    .reduce((acc, i) => acc + i.unitPriceCents * i.quantity, 0);
  return Math.max(0, keptTotal + shippingCents - discountCents);
}

export async function getAllOrders(filters?: {
  status?: OrderStatus;
  from?: Date;
  to?: Date;
}) {
  const conditions = [];
  if (filters?.status) conditions.push(eq(orders.status, filters.status));
  if (filters?.from) conditions.push(gte(orders.soldAt, filters.from));
  if (filters?.to) conditions.push(lte(orders.soldAt, filters.to));

  const rows = await db
    .select({
      order: orders,
      customer: { id: customers.id, name: customers.name, phone: customers.phone },
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(orders.soldAt));

  const orderIds = rows.map((r) => r.order.id);

  if (!orderIds.length) return [];

  const allItems = await db
    .select({
      orderId: orderItems.orderId,
      status: orderItems.status,
      unitPriceCents: orderItems.unitPriceCents,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));

  return rows.map((r) => ({
    ...r.order,
    customer: r.customer,
    total: computeOrderItemTotal(
      allItems.filter((i) => i.orderId === r.order.id),
      r.order.discountCents,
      r.order.shippingCents
    ),
    itemCount: allItems.filter((i) => i.orderId === r.order.id).length,
  }));
}

export async function getOrderById(id: string) {
  const [row] = await db
    .select({
      order: orders,
      customer: customers,
      address: addresses,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(addresses, eq(orders.addressId, addresses.id))
    .where(eq(orders.id, id));

  if (!row) return null;

  const items = await db
    .select({
      item: orderItems,
      product: products,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id))
    .orderBy(asc(orderItems.id));

  const productIds = items.map((i) => i.product.id);
  const firstImages = productIds.length
    ? await db
        .select()
        .from(productImages)
        .where(inArray(productImages.productId, productIds))
        .orderBy(asc(productImages.sortOrder))
    : [];

  const orderPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, id))
    .orderBy(asc(payments.paidAt));

  const enrichedItems = items.map((i) => ({
    ...i.item,
    product: {
      ...i.product,
      firstImage: firstImages.find((img) => img.productId === i.product.id) ?? null,
    },
  }));

  return {
    ...row.order,
    customer: row.customer,
    address: row.address,
    items: enrichedItems,
    payments: orderPayments,
    total: computeOrderItemTotal(
      enrichedItems,
      row.order.discountCents,
      row.order.shippingCents
    ),
  };
}
