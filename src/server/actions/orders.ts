"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { orders, orderItems, products } from "@/db/schema";
import { orderSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

export async function createOrder(data: unknown) {
  await requireAdmin();
  const parsed = orderSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { items, soldAt, ...orderData } = parsed.data;

  const [order] = await db
    .insert(orders)
    .values({
      ...orderData,
      addressId: orderData.addressId ?? null,
      soldAt: new Date(soldAt),
    })
    .returning({ id: orders.id });

  await db.insert(orderItems).values(
    items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
    }))
  );

  revalidatePath("/admin/pedidos");
  return { id: order.id };
}

export async function updateOrder(id: string, data: unknown) {
  await requireAdmin();
  const parsed = orderSchema
    .pick({ soldAt: true, addressId: true, discountCents: true, shippingCents: true, notes: true })
    .safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { soldAt, ...rest } = parsed.data;
  await db
    .update(orders)
    .set({ ...rest, soldAt: new Date(soldAt), updatedAt: new Date() })
    .where(eq(orders.id, id));

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  return { success: true };
}

export async function setOrderStatus(id: string, status: "draft" | "sent" | "returned" | "paid" | "cancelled") {
  await requireAdmin();
  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id));
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  return { success: true };
}

export async function addOrderItem(orderId: string, productId: string, quantity = 1) {
  await requireAdmin();
  const [product] = await db
    .select({ priceCents: products.priceCents })
    .from(products)
    .where(eq(products.id, productId));

  if (!product) return { error: "Produto não encontrado" };

  const [item] = await db
    .insert(orderItems)
    .values({ orderId, productId, unitPriceCents: product.priceCents, quantity })
    .returning({ id: orderItems.id });

  revalidatePath(`/admin/pedidos/${orderId}`);
  return { id: item.id };
}

export async function updateOrderItemStatus(itemId: string, orderId: string, status: "kept" | "returned") {
  await requireAdmin();
  await db
    .update(orderItems)
    .set({ status })
    .where(eq(orderItems.id, itemId));
  revalidatePath(`/admin/pedidos/${orderId}`);
  return { success: true };
}

export async function removeOrderItem(itemId: string, orderId: string) {
  await requireAdmin();
  await db.delete(orderItems).where(eq(orderItems.id, itemId));
  revalidatePath(`/admin/pedidos/${orderId}`);
  return { success: true };
}

export async function deleteOrder(id: string) {
  await requireAdmin();
  await db.delete(orders).where(eq(orders.id, id));
  revalidatePath("/admin/pedidos");
  return { success: true };
}
