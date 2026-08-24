import { db } from "@/db/client";
import { orders, orderItems, customers, addresses, products, productImages, payments } from "@/db/schema";
import { and, asc, count, eq, gte, ilike, inArray, isNull, lt } from "drizzle-orm";

export type OrderStatus = "draft" | "sent" | "returned" | "paid" | "cancelled";

export function computeOrderItemTotal(
  items: { unitPriceCents: number; discountCents?: number; quantity: number; status: string }[],
  discountCents: number,
  shippingCents: number,
  creditAppliedCents = 0
): number {
  const keptTotal = items
    .filter((i) => i.status === "kept")
    .reduce((acc, i) => acc + (i.unitPriceCents - (i.discountCents ?? 0)) * i.quantity, 0);
  return Math.max(0, keptTotal + shippingCents - discountCents - creditAppliedCents);
}

export async function getAllOrders(
  filters?: { status?: OrderStatus; from?: Date; to?: Date; search?: string },
  pagination?: { page: number; limit: number }
) {
  const conditions = [isNull(orders.deletedAt)];
  if (filters?.status) conditions.push(eq(orders.status, filters.status));
  if (filters?.from) conditions.push(gte(orders.soldAt, filters.from));
  if (filters?.to) conditions.push(lt(orders.soldAt, filters.to));
  if (filters?.search) conditions.push(ilike(customers.name, `%${filters.search}%`));

  const where = conditions.length ? and(...conditions) : undefined;
  const limit = pagination?.limit ?? 1000;
  const offset = pagination ? (pagination.page - 1) * pagination.limit : 0;

  const countBase = db.select({ total: count() }).from(orders);
  const countQuery = filters?.search
    ? countBase.innerJoin(customers, eq(orders.customerId, customers.id)).where(where)
    : countBase.where(where);

  const [[countRow], rows] = await Promise.all([
    countQuery,
    db
      .select({
        order: orders,
        customer: { id: customers.id, name: customers.name, phone: customers.phone },
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(where)
      .orderBy(asc(orders.soldAt), asc(orders.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const orderIds = rows.map((r) => r.order.id);

  if (!orderIds.length) return { items: [], total: countRow.total };

  const allItems = await db
    .select({
      orderId: orderItems.orderId,
      status: orderItems.status,
      unitPriceCents: orderItems.unitPriceCents,
      discountCents: orderItems.discountCents,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(and(inArray(orderItems.orderId, orderIds), isNull(orderItems.deletedAt)));

  return {
    items: rows.map((r) => ({
      ...r.order,
      customer: r.customer,
      total: computeOrderItemTotal(
        allItems.filter((i) => i.orderId === r.order.id),
        r.order.discountCents,
        r.order.shippingCents,
        r.order.creditAppliedCents
      ),
      itemCount: allItems.filter((i) => i.orderId === r.order.id).length,
    })),
    total: countRow.total,
  };
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
    .where(and(eq(orderItems.orderId, id), isNull(orderItems.deletedAt)))
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
    .where(and(eq(payments.orderId, id), isNull(payments.deletedAt)))
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
      row.order.shippingCents,
      row.order.creditAppliedCents
    ),
  };
}
