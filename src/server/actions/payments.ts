"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { payments, orders, orderItems, loyaltyCredits } from "@/db/schema";
import { paymentSchema } from "@/lib/validations";
import { calcFeeCents, calcNetCents } from "@/lib/fees";
import { and, eq, gte, isNull, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getLoyaltyConfig, hasEarnedCreditForOrder } from "@/server/queries/loyalty";
import { computeOrderItemTotal } from "@/server/queries/orders";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

export async function createPayment(orderId: string, data: unknown) {
  await requireAdmin();
  const parsed = paymentSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const [order] = await db.select({ deletedAt: orders.deletedAt }).from(orders).where(eq(orders.id, orderId));
  if (!order || order.deletedAt) return { error: "Pedido não encontrado ou excluído." };

  const { paidAt, settledAt, ...rest } = parsed.data;

  const isCard = rest.method === "credit_card" || rest.method === "debit_card";
  const feePercent = isCard ? rest.feePercent : 0;
  const feeCents = isCard ? (rest.feeCents || calcFeeCents(rest.grossCents, feePercent)) : 0;
  const netCents = isCard ? (rest.netCents || calcNetCents(rest.grossCents, feePercent)) : rest.grossCents;

  // ponytail: 10s window on (orderId,grossCents,method,paidAt) dedupes double-submit
  const tenSecondsAgo = new Date(Date.now() - 10_000);
  const [existing] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.orderId, orderId),
        eq(payments.grossCents, rest.grossCents),
        eq(payments.method, rest.method),
        eq(payments.paidAt, new Date(paidAt)),
        gte(payments.createdAt, tenSecondsAgo),
        isNull(payments.deletedAt)
      )
    )
    .limit(1);

  if (existing) return { id: existing.id };

  const [payment] = await db
    .insert(payments)
    .values({
      ...rest,
      brand: isCard ? (rest.brand ?? null) : null,
      installments: isCard ? (rest.installments ?? 1) : 1,
      feePercent,
      feeCents,
      netCents,
      orderId,
      paidAt: new Date(paidAt),
      settledAt: settledAt ? new Date(settledAt) : null,
    })
    .returning({ id: payments.id });

  // Marca paid_at no pedido se ainda não tiver
  await markOrderPaidIfNeeded(orderId);

  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/recebimentos");
  return { id: payment.id };
}

export async function updatePayment(id: string, orderId: string, data: unknown) {
  await requireAdmin();
  const parsed = paymentSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { paidAt, settledAt, ...rest } = parsed.data;

  const isCard = rest.method === "credit_card" || rest.method === "debit_card";
  const feePercent = isCard ? rest.feePercent : 0;
  const feeCents = isCard ? (rest.feeCents || calcFeeCents(rest.grossCents, feePercent)) : 0;
  const netCents = isCard ? (rest.netCents || calcNetCents(rest.grossCents, feePercent)) : rest.grossCents;

  await db
    .update(payments)
    .set({
      ...rest,
      brand: isCard ? (rest.brand ?? null) : null,
      installments: isCard ? (rest.installments ?? 1) : 1,
      feePercent,
      feeCents,
      netCents,
      paidAt: new Date(paidAt),
      settledAt: settledAt ? new Date(settledAt) : null,
    })
    .where(eq(payments.id, id));

  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/recebimentos");
  return { success: true };
}

export async function markPaymentSettled(id: string, orderId: string) {
  await requireAdmin();
  await db
    .update(payments)
    .set({ settledAt: new Date() })
    .where(eq(payments.id, id));
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/recebimentos");
  return { success: true };
}

export async function deletePayment(id: string, orderId: string) {
  await requireAdmin();
  await db.update(payments).set({ deletedAt: new Date() }).where(eq(payments.id, id));
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/recebimentos");
  return { success: true };
}

async function markOrderPaidIfNeeded(orderId: string) {
  const [order] = await db
    .select({
      paidAt: orders.paidAt,
      customerId: orders.customerId,
      discountCents: orders.discountCents,
      shippingCents: orders.shippingCents,
      creditAppliedCents: orders.creditAppliedCents,
    })
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order || order.paidAt) return;

  const items = await db
    .select({
      unitPriceCents: orderItems.unitPriceCents,
      discountCents: orderItems.discountCents,
      quantity: orderItems.quantity,
      status: orderItems.status,
    })
    .from(orderItems)
    .where(and(eq(orderItems.orderId, orderId), isNull(orderItems.deletedAt)));

  const orderTotal = computeOrderItemTotal(
    items,
    order.discountCents,
    order.shippingCents,
    order.creditAppliedCents
  );

  const [{ totalPaid }] = await db
    .select({ totalPaid: sum(payments.grossCents) })
    .from(payments)
    .where(and(eq(payments.orderId, orderId), isNull(payments.deletedAt)));

  if (Number(totalPaid ?? 0) >= orderTotal) {
    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({ paidAt: new Date(), status: "paid", updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      // Gerar crédito de fidelidade (idempotente)
      const alreadyEarned = await hasEarnedCreditForOrder(orderId);
      if (!alreadyEarned) {
        const cfg = await getLoyaltyConfig();
        const creditableBase = items
          .filter((i) => i.status === "kept" && (i.discountCents ?? 0) === 0)
          .reduce((acc, i) => acc + i.unitPriceCents * i.quantity, 0);

        if (cfg.enabled && creditableBase >= cfg.minOrderCents && creditableBase > 0) {
          const earned = Math.floor((creditableBase * cfg.percent) / 100);
          if (earned > 0) {
            const expiresAt = new Date(Date.now() + cfg.validityDays * 86_400_000);
            await tx.insert(loyaltyCredits).values({
              customerId: order.customerId,
              kind: "earn",
              amountCents: earned,
              orderId,
              expiresAt,
              notes: `Compra paga`,
            });
          }
        }
      }
    });
  }
}
