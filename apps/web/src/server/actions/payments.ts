"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import {
  payments,
  paymentReceivables,
  cardMachines,
  orders,
  orderItems,
  loyaltyCredits,
  customers,
  leads,
} from "@/db/schema";
import { paymentSchema } from "@/lib/validations";
import { calcFeeCents, calcNetCents, resolveFeePercent, buildReceivableSchedule } from "@/lib/fees";
import { and, desc, eq, gte, isNull, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getLoyaltyConfig, hasEarnedCreditForOrder } from "@/server/queries/loyalty";
import { getPaymentFeeConfigs } from "@/server/queries/settings";
import { computeOrderItemTotal } from "@/server/queries/orders";
import { sendPurchaseEvent } from "@/lib/meta-capi";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

function revalidatePaymentPaths(orderId: string) {
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/recebimentos");
  revalidatePath("/admin/dre");
  revalidatePath("/admin/fluxo-caixa");
}

// Recalcula taxa, líquido e o cronograma de recebíveis sempre no servidor —
// nunca confia em feePercent/feeCents/netCents/machineId que o cliente manda.
async function resolvePaymentMoney(input: {
  method: string;
  grossCents: number;
  installments: number;
  anticipated: boolean;
  machineId?: string | null;
}) {
  const isCard = input.method === "credit_card" || input.method === "debit_card";
  const canDefer = input.method === "credit_card"; // débito não parcela/antecipa na prática
  const anticipated = canDefer ? input.anticipated : true;
  const installments = canDefer ? input.installments : 1; // débito e não-cartão nunca parcelam
  const machineId = isCard && input.machineId ? input.machineId : null;

  let machine: typeof cardMachines.$inferSelect | null = null;
  if (machineId) {
    const [m] = await db.select().from(cardMachines).where(eq(cardMachines.id, machineId));
    if (!m) return { error: "Maquininha não encontrada." as const };
    machine = m;
  }

  const feeConfigs = isCard ? await getPaymentFeeConfigs() : ({} as Record<string, number>);
  const feePercent = resolveFeePercent(input.method, anticipated, machine, feeConfigs);
  const feeCents = isCard ? calcFeeCents(input.grossCents, feePercent) : 0;
  const netCents = isCard ? calcNetCents(input.grossCents, feePercent) : input.grossCents;

  return {
    anticipated,
    installments,
    machineId,
    feePercent,
    feeCents,
    netCents,
    anticipationDays: machine?.anticipationDays ?? 1,
    installmentIntervalDays: machine?.installmentIntervalDays ?? 30,
  } as const;
}

export async function createPayment(orderId: string, data: unknown) {
  await requireAdmin();
  const parsed = paymentSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const [order] = await db.select({ deletedAt: orders.deletedAt }).from(orders).where(eq(orders.id, orderId));
  if (!order || order.deletedAt) return { error: "Pedido não encontrado ou excluído." };

  const { paidAt, settledAt, ...rest } = parsed.data;
  const isCard = rest.method === "credit_card" || rest.method === "debit_card";

  const resolved = await resolvePaymentMoney(rest);
  if ("error" in resolved) return resolved;

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

  const schedule = buildReceivableSchedule({
    netCents: resolved.netCents,
    paidAt: new Date(paidAt),
    installments: resolved.installments,
    anticipated: resolved.anticipated,
    anticipationDays: resolved.anticipationDays,
    installmentIntervalDays: resolved.installmentIntervalDays,
  });
  // Recebimento já liquidado na criação (única parcela) herda a data informada.
  const settledAtDate = settledAt ? new Date(settledAt) : null;

  const paymentId = await db.transaction(async (tx) => {
    const [payment] = await tx
      .insert(payments)
      .values({
        orderId,
        method: rest.method,
        brand: isCard ? (rest.brand ?? null) : null,
        installments: resolved.installments,
        grossCents: rest.grossCents,
        feePercent: resolved.feePercent,
        feeCents: resolved.feeCents,
        netCents: resolved.netCents,
        paidAt: new Date(paidAt),
        settledAt: settledAtDate,
        machineId: resolved.machineId,
        anticipated: resolved.anticipated,
        reference: rest.reference,
        notes: rest.notes,
      })
      .returning({ id: payments.id });

    await tx.insert(paymentReceivables).values(
      schedule.map((s) => ({
        paymentId: payment.id,
        installmentNumber: s.installmentNumber,
        netCents: s.netCents,
        expectedAt: s.expectedAt,
        settledAt: schedule.length === 1 ? settledAtDate : null,
      }))
    );

    return payment.id;
  });

  // Marca paid_at no pedido se ainda não tiver
  await markOrderPaidIfNeeded(orderId);

  revalidatePaymentPaths(orderId);
  return { id: paymentId };
}

// ponytail: sem UI de edição de pagamento hoje — se precisar, escrever do
// zero seguindo o padrão de createPayment (transação + resolvePaymentMoney +
// recusar se alguma parcela já liquidou), não reaproveitar uma versão antiga.

// Confere que o recebível existe, pertence ao pedido informado, e que nem o
// pagamento nem o pedido estão soft-deletados — usado pelas duas mutações
// abaixo antes de tocar em qualquer coisa.
async function findOwnedReceivable(receivableId: string, orderId: string) {
  const [row] = await db
    .select({ id: paymentReceivables.id })
    .from(paymentReceivables)
    .innerJoin(payments, eq(paymentReceivables.paymentId, payments.id))
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(
      and(
        eq(paymentReceivables.id, receivableId),
        eq(orders.id, orderId),
        isNull(payments.deletedAt),
        isNull(orders.deletedAt)
      )
    );
  return row ?? null;
}

// Idempotente: um segundo clique não move a data real de liquidação.
export async function markReceivableSettled(receivableId: string, orderId: string) {
  await requireAdmin();
  if (!(await findOwnedReceivable(receivableId, orderId))) {
    return { error: "Recebível não encontrado." };
  }
  const [row] = await db
    .update(paymentReceivables)
    .set({ settledAt: new Date() })
    .where(and(eq(paymentReceivables.id, receivableId), isNull(paymentReceivables.settledAt)))
    .returning({ id: paymentReceivables.id });
  revalidatePaymentPaths(orderId);
  return { success: !!row };
}

export async function updateReceivableExpectedAt(receivableId: string, orderId: string, dateStr: string) {
  await requireAdmin();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr ?? "");
  if (!match) return { error: "Data inválida." };
  if (!(await findOwnedReceivable(receivableId, orderId))) {
    return { error: "Recebível não encontrado." };
  }
  const [year, month, day] = match.slice(1).map(Number);
  // Meio-dia UTC, mesma âncora de buildReceivableSchedule — evita que o
  // bucket de mês (Fluxo de Caixa/DRE) ou a exibição dependam do fuso do servidor.
  const [row] = await db
    .update(paymentReceivables)
    .set({ expectedAt: new Date(Date.UTC(year, month - 1, day, 12)) })
    .where(and(eq(paymentReceivables.id, receivableId), isNull(paymentReceivables.settledAt)))
    .returning({ id: paymentReceivables.id });
  revalidatePaymentPaths(orderId);
  return { success: !!row };
}

export async function deletePayment(id: string, orderId: string) {
  await requireAdmin();
  await db.update(payments).set({ deletedAt: new Date() }).where(eq(payments.id, id));
  revalidatePaymentPaths(orderId);
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

    // ponytail: no FK between leads and customers/orders, so correlate by normalized phone (same digits-only format on both)
    const [customer] = await db
      .select({ phone: customers.phone })
      .from(customers)
      .where(eq(customers.id, order.customerId));

    if (customer?.phone) {
      const [lead] = await db
        .select({ id: leads.id })
        .from(leads)
        .where(and(eq(leads.phone, customer.phone), eq(leads.converted, false)))
        .orderBy(desc(leads.createdAt))
        .limit(1);

      if (lead) {
        await sendPurchaseEvent(lead.id, orderTotal);
      }
    }
  }
}
