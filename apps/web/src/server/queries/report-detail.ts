import { db } from "@/db/client";
import { payments, orders, customers, orderItems, paymentReceivables, expenses, expenseCategories } from "@/db/schema";
import { and, desc, eq, gt, gte, inArray, isNotNull, isNull, lt, ne, or } from "drizzle-orm";
import { computeOrderItemTotal } from "@/server/queries/orders";

// Uma linha do drill-down: o item individual que soma pro valor agregado
// exibido no DRE/Fluxo de Caixa (um pagamento, um recebível, uma despesa).
export interface ReportDetailRow {
  date: Date;
  label: string;
  sublabel: string;
  amountCents: number;
  href: string;
}

const METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão crédito",
  debit_card: "Cartão débito",
  cash: "Dinheiro",
  transfer: "Transferência",
};

// DRE — regime de competência: pagamentos de pedidos pagos (orders.paidAt)
// no período. "taxas" filtra só pagamentos com taxa de cartão > 0.
export async function getDRERevenueDetail(
  kind: "receita" | "taxas",
  from: Date,
  to: Date,
  method?: string
): Promise<ReportDetailRow[]> {
  const rows = await db
    .select({
      orderId: orders.id,
      customerName: customers.name,
      paidAt: orders.paidAt,
      method: payments.method,
      grossCents: payments.grossCents,
      feeCents: payments.feeCents,
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(
      and(
        gte(orders.paidAt, from),
        lt(orders.paidAt, to),
        isNull(payments.deletedAt),
        isNull(orders.deletedAt),
        method ? eq(payments.method, method as (typeof payments.method.enumValues)[number]) : undefined,
        kind === "taxas" ? gt(payments.feeCents, 0) : undefined
      )
    )
    .orderBy(desc(orders.paidAt));

  return rows.map((r) => ({
    date: r.paidAt as Date,
    label: r.customerName,
    sublabel: METHOD_LABELS[r.method] ?? r.method,
    amountCents: kind === "taxas" ? r.feeCents : r.grossCents,
    href: `/admin/pedidos/${r.orderId}`,
  }));
}

// Fluxo de Caixa — regime de caixa: recebíveis liquidados (settledAt) ou
// previstos (expectedAt) no período. "taxas" reúne os dois grupos (mesma
// regra de bucket de getCashFlowYearSummary) e filtra taxa > 0.
export async function getReceivableDetail(
  kind: "entradas-realizadas" | "entradas-projetadas" | "taxas",
  from: Date,
  to: Date
): Promise<ReportDetailRow[]> {
  const realized = and(
    isNotNull(paymentReceivables.settledAt),
    gte(paymentReceivables.settledAt, from),
    lt(paymentReceivables.settledAt, to)
  );
  const projected = and(
    isNull(paymentReceivables.settledAt),
    gte(paymentReceivables.expectedAt, from),
    lt(paymentReceivables.expectedAt, to)
  );

  const rows = await db
    .select({
      orderId: orders.id,
      customerName: customers.name,
      method: payments.method,
      installmentNumber: paymentReceivables.installmentNumber,
      installments: payments.installments,
      netCents: paymentReceivables.netCents,
      feeCents: paymentReceivables.feeCents,
      settledAt: paymentReceivables.settledAt,
      expectedAt: paymentReceivables.expectedAt,
    })
    .from(paymentReceivables)
    .innerJoin(payments, eq(paymentReceivables.paymentId, payments.id))
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(
      and(
        isNull(payments.deletedAt),
        isNull(orders.deletedAt),
        kind === "entradas-realizadas" ? realized : kind === "entradas-projetadas" ? projected : or(realized, projected)
      )
    )
    .orderBy(desc(paymentReceivables.expectedAt));

  return rows
    .filter((r) => kind !== "taxas" || r.feeCents > 0)
    .map((r) => ({
      date: (r.settledAt ?? r.expectedAt) as Date,
      label: r.customerName,
      sublabel:
        (METHOD_LABELS[r.method] ?? r.method) +
        (r.installments > 1 ? ` ${r.installmentNumber}/${r.installments}` : ""),
      amountCents: kind === "taxas" ? r.feeCents : r.netCents,
      href: `/admin/pedidos/${r.orderId}`,
    }));
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  returned: "Devolvido",
  paid: "Pago",
  cancelled: "Cancelado",
};

// Vendas — pela data do PEDIDO (soldAt), não pagamento. Mesma regra de
// getSalesYearSummary: cancelados não contam.
export async function getSalesDetail(from: Date, to: Date): Promise<ReportDetailRow[]> {
  const rows = await db
    .select({
      orderId: orders.id,
      customerName: customers.name,
      soldAt: orders.soldAt,
      status: orders.status,
      discountCents: orders.discountCents,
      shippingCents: orders.shippingCents,
      creditAppliedCents: orders.creditAppliedCents,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(
      and(
        isNull(orders.deletedAt),
        ne(orders.status, "cancelled"),
        gte(orders.soldAt, from),
        lt(orders.soldAt, to)
      )
    )
    .orderBy(desc(orders.soldAt));

  if (!rows.length) return [];

  const orderIds = rows.map((r) => r.orderId);
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

  return rows.map((r) => ({
    date: r.soldAt,
    label: r.customerName,
    sublabel: ORDER_STATUS_LABELS[r.status] ?? r.status,
    amountCents: computeOrderItemTotal(
      allItems.filter((i) => i.orderId === r.orderId),
      r.discountCents,
      r.shippingCents,
      r.creditAppliedCents
    ),
    href: `/admin/pedidos/${r.orderId}`,
  }));
}

// DRE "despesas" e Fluxo de Caixa "saídas" leem a mesma tabela — a única
// diferença é o rótulo na tela, o dado por trás é idêntico.
export async function getExpenseDetail(from: Date, to: Date, category?: string): Promise<ReportDetailRow[]> {
  const rows = await db
    .select({
      description: expenses.description,
      categoryName: expenseCategories.name,
      paidAt: expenses.paidAt,
      amountCents: expenses.amountCents,
    })
    .from(expenses)
    .innerJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .where(
      and(
        gte(expenses.paidAt, from),
        lt(expenses.paidAt, to),
        isNull(expenses.deletedAt),
        category ? eq(expenseCategories.name, category) : undefined
      )
    )
    .orderBy(desc(expenses.paidAt));

  return rows.map((r) => ({
    date: r.paidAt,
    label: r.description,
    sublabel: r.categoryName,
    amountCents: r.amountCents,
    href: `/admin/despesas`,
  }));
}
