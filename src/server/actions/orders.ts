"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { orders, orderItems, products } from "@/db/schema";
import { orderSchema } from "@/lib/validations";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getOrderById } from "@/server/queries/orders";
import { getWaApiConfig } from "@/server/queries/settings";
import { sendWhatsAppText } from "@/lib/whatsapp-api";
import {
  buildMalinhaEnviadaMessage,
  buildLinkPagamentoMessage,
  buildPagamentoConfirmadoMessage,
  buildItemsConfirmadosMessage,
} from "@/lib/whatsapp-order-templates";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

export type WaNotificationType =
  | "malinha_enviada"
  | "link_pagamento"
  | "pagamento_confirmado"
  | "itens_confirmados";

// Shared internal helper — no auth check, call from within other server actions
async function dispatchOrderWhatsApp(
  orderId: string,
  type: WaNotificationType,
  extra?: { paymentLink?: string }
): Promise<void> {
  const [order, waConfig] = await Promise.all([getOrderById(orderId), getWaApiConfig()]);
  if (!order) return;

  let message: string;

  if (type === "malinha_enviada") {
    message = buildMalinhaEnviadaMessage(order);
  } else if (type === "link_pagamento") {
    if (!extra?.paymentLink) return;
    message = buildLinkPagamentoMessage(order, extra.paymentLink);
  } else if (type === "pagamento_confirmado") {
    message = buildPagamentoConfirmadoMessage(order);
  } else {
    message = buildItemsConfirmadosMessage(order);
  }

  await sendWhatsAppText(order.customer.phone, message, waConfig);
}

// Public server action — used by manual buttons on the pedido page
export async function sendOrderWhatsApp(
  orderId: string,
  type: WaNotificationType,
  extra?: { paymentLink?: string }
) {
  await requireAdmin();
  try {
    await dispatchOrderWhatsApp(orderId, type, extra);
    return { success: true };
  } catch (err) {
    console.error("[sendOrderWhatsApp]", err);
    return { error: String(err) };
  }
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
      addressId: orderData.addressId || null,
      soldAt: new Date(soldAt),
    })
    .returning({ id: orders.id });

  await db.insert(orderItems).values(
    items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      unitPriceCents: item.unitPriceCents,
      discountCents: item.discountCents ?? 0,
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
    .set({ ...rest, addressId: rest.addressId || null, soldAt: new Date(soldAt), updatedAt: new Date() })
    .where(and(eq(orders.id, id), isNull(orders.deletedAt)));

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  return { success: true };
}

export async function setOrderStatus(
  id: string,
  status: "draft" | "sent" | "returned" | "paid" | "cancelled"
) {
  await requireAdmin();
  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(orders.id, id), isNull(orders.deletedAt)));
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);

  // Auto-notify customer on meaningful transitions
  if (status === "sent" || status === "paid") {
    const type: WaNotificationType =
      status === "sent" ? "malinha_enviada" : "pagamento_confirmado";
    dispatchOrderWhatsApp(id, type).catch((e) => console.error("[auto-wa]", e));
  }

  return { success: true };
}

export async function addOrderItem(orderId: string, productId: string, quantity = 1) {
  await requireAdmin();
  const [order] = await db
    .select({ deletedAt: orders.deletedAt })
    .from(orders)
    .where(eq(orders.id, orderId));
  if (!order || order.deletedAt) return { error: "Pedido não encontrado ou excluído" };

  const [product] = await db
    .select({ priceCents: products.priceCents })
    .from(products)
    .where(and(eq(products.id, productId), isNull(products.deletedAt)));

  if (!product) return { error: "Produto não encontrado" };

  const [item] = await db
    .insert(orderItems)
    .values({ orderId, productId, unitPriceCents: product.priceCents, quantity })
    .returning({ id: orderItems.id });

  revalidatePath(`/admin/pedidos/${orderId}`);
  return { id: item.id };
}

export async function updateOrderItemStatus(
  itemId: string,
  orderId: string,
  status: "kept" | "returned"
) {
  await requireAdmin();
  await db.update(orderItems).set({ status }).where(eq(orderItems.id, itemId));
  revalidatePath(`/admin/pedidos/${orderId}`);
  return { success: true };
}

export async function removeOrderItem(itemId: string, orderId: string) {
  await requireAdmin();
  await db.update(orderItems).set({ deletedAt: new Date() }).where(eq(orderItems.id, itemId));
  revalidatePath(`/admin/pedidos/${orderId}`);
  return { success: true };
}

export async function deleteOrder(id: string) {
  await requireAdmin();
  await db.update(orders).set({ deletedAt: new Date() }).where(eq(orders.id, id));
  revalidatePath("/admin/pedidos");
  return { success: true };
}
