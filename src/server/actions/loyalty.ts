"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { loyaltyCredits, orders, orderItems, siteConfig } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCustomerCreditBalance } from "@/server/queries/loyalty";
import { computeOrderItemTotal } from "@/server/queries/orders";
import { getOrderById } from "@/server/queries/orders";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

export async function saveLoyaltyConfig(data: FormData) {
  await requireAdmin();

  const enabled = data.get("loyalty_enabled") === "on" ? "true" : "false";
  const percent = data.get("loyalty_percent") as string ?? "5";
  const validityDays = data.get("loyalty_validity_days") as string ?? "180";
  const minOrderCents = String(
    Math.round(parseFloat((data.get("loyalty_min_order_reais") as string | null) ?? "0") * 100)
  );

  const entries: Record<string, string> = {
    loyalty_enabled: enabled,
    loyalty_percent: percent,
    loyalty_validity_days: validityDays,
    loyalty_min_order_cents: minOrderCents,
  };

  for (const [key, value] of Object.entries(entries)) {
    await db
      .insert(siteConfig)
      .values({ key, value })
      .onConflictDoUpdate({ target: siteConfig.key, set: { value, updatedAt: new Date() } });
  }

  revalidatePath("/admin/configuracoes");
  return { success: true };
}

export async function applyCreditToOrder(orderId: string, amountCentsRaw: unknown) {
  await requireAdmin();

  const amountCents = typeof amountCentsRaw === "number" ? amountCentsRaw : parseInt(String(amountCentsRaw), 10);
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { error: "Valor de crédito inválido." };
  }

  const order = await getOrderById(orderId);
  if (!order) return { error: "Pedido não encontrado." };
  if (order.status === "paid" || order.status === "cancelled") {
    return { error: "Não é possível aplicar crédito a um pedido finalizado." };
  }

  const balance = await getCustomerCreditBalance(order.customer.id);
  if (amountCents > balance) {
    return { error: "Saldo de crédito insuficiente." };
  }

  // Total do pedido sem crédito aplicado
  const orderTotal = computeOrderItemTotal(
    order.items,
    order.discountCents,
    order.shippingCents,
    0
  );
  const maxApplicable = Math.min(amountCents, orderTotal);

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ creditAppliedCents: maxApplicable, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    await tx.insert(loyaltyCredits).values({
      customerId: order.customer.id,
      kind: "redeem",
      amountCents: -maxApplicable,
      orderId,
      notes: `Usado no pedido`,
    });
  });

  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath(`/admin/clientes/${order.customer.id}`);
  return { success: true };
}

export async function removeCreditFromOrder(orderId: string) {
  await requireAdmin();

  const order = await getOrderById(orderId);
  if (!order) return { error: "Pedido não encontrado." };
  if (order.creditAppliedCents === 0) return { success: true };

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ creditAppliedCents: 0, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    // Remover a transação de redeem vinculada a este pedido
    await tx
      .delete(loyaltyCredits)
      .where(
        and(
          eq(loyaltyCredits.orderId, orderId),
          eq(loyaltyCredits.kind, "redeem")
        )
      );
  });

  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath(`/admin/clientes/${order.customer.id}`);
  return { success: true };
}

export async function adjustCustomerCredit(
  customerId: string,
  amountCents: number,
  notes: string
) {
  await requireAdmin();

  if (!Number.isInteger(amountCents) || amountCents === 0) {
    return { error: "Valor inválido. Informe um valor diferente de zero." };
  }

  await db.insert(loyaltyCredits).values({
    customerId,
    kind: "adjust",
    amountCents,
    notes: notes || "Ajuste manual",
  });

  revalidatePath(`/admin/clientes/${customerId}`);
  return { success: true };
}

export async function setItemDiscountCents(itemId: string, orderId: string, discountCents: number) {
  await requireAdmin();

  if (!Number.isInteger(discountCents) || discountCents < 0) {
    return { error: "Desconto inválido." };
  }

  await db.update(orderItems).set({ discountCents }).where(eq(orderItems.id, itemId));

  revalidatePath(`/admin/pedidos/${orderId}`);
  return { success: true };
}
