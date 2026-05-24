"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { payments, orders, orderItems } from "@/db/schema";
import { paymentSchema } from "@/lib/validations";
import { calcFeeCents, calcNetCents } from "@/lib/fees";
import { eq, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

export async function createPayment(orderId: string, data: unknown) {
  await requireAdmin();
  const parsed = paymentSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { paidAt, settledAt, ...rest } = parsed.data;

  const feeCents = rest.feeCents || calcFeeCents(rest.grossCents, rest.feePercent);
  const netCents = rest.netCents || calcNetCents(rest.grossCents, rest.feePercent);

  const [payment] = await db
    .insert(payments)
    .values({
      ...rest,
      orderId,
      feeCents,
      netCents,
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

  const feeCents = rest.feeCents || calcFeeCents(rest.grossCents, rest.feePercent);
  const netCents = rest.netCents || calcNetCents(rest.grossCents, rest.feePercent);

  await db
    .update(payments)
    .set({
      ...rest,
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
  await db.delete(payments).where(eq(payments.id, id));
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/recebimentos");
  return { success: true };
}

async function markOrderPaidIfNeeded(orderId: string) {
  const [order] = await db
    .select({ paidAt: orders.paidAt })
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order || order.paidAt) return;

  const items = await db
    .select({ unitPriceCents: orderItems.unitPriceCents, quantity: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const keptItems = items.filter(() => true); // kept items total
  const orderTotal = keptItems.reduce(
    (acc, i) => acc + i.unitPriceCents * i.quantity,
    0
  );

  const [{ totalPaid }] = await db
    .select({ totalPaid: sum(payments.grossCents) })
    .from(payments)
    .where(eq(payments.orderId, orderId));

  if (Number(totalPaid ?? 0) >= orderTotal) {
    await db
      .update(orders)
      .set({ paidAt: new Date(), status: "paid", updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  }
}
