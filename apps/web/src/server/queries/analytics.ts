import { db } from "@/db/client";
import { orders, orderItems, customers, products, payments } from "@/db/schema";
import { and, eq, gte, inArray, isNull, ne } from "drizzle-orm";
import { computeOrderItemTotal } from "./orders";
import { calcOrderFeeRate, calcItemNetRevenue, calcMargin } from "@/lib/margin";

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

export interface ProductMarginRanking {
  productId: string;
  name: string;
  quantitySold: number;
  revenueCents: number;
  costCents: number | null;
  marginCents: number | null;
  marginPercent: number | null;
}

// Ranking de produtos por margem, líquida da taxa de cartão do pedido em que
// foram vendidos. Regime de competência — mesmo critério do DRE
// (orders.paidAt), necessário aqui porque a taxa só existe atrelada a
// payments de pedido efetivamente pago.
export async function getProductMarginRanking(months = 12): Promise<ProductMarginRanking[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const paidOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(gte(orders.paidAt, since), isNull(orders.deletedAt)));

  if (!paidOrders.length) return [];
  const orderIds = paidOrders.map((o) => o.id);

  const paymentRows = await db
    .select({ orderId: payments.orderId, grossCents: payments.grossCents, feeCents: payments.feeCents })
    .from(payments)
    .where(and(inArray(payments.orderId, orderIds), isNull(payments.deletedAt)));

  const paymentsByOrder = new Map<string, { grossCents: number; feeCents: number }[]>();
  for (const p of paymentRows) {
    const list = paymentsByOrder.get(p.orderId) ?? [];
    list.push(p);
    paymentsByOrder.set(p.orderId, list);
  }
  const feeRateByOrder = new Map<string, number>();
  for (const [orderId, list] of paymentsByOrder) {
    feeRateByOrder.set(orderId, calcOrderFeeRate(list));
  }

  // Sem filtro em products.deletedAt/active — produto descontinuado continua
  // aparecendo no histórico de margem de vendas passadas.
  const itemRows = await db
    .select({
      productId: orderItems.productId,
      productName: products.name,
      costCents: products.costCents,
      unitPriceCents: orderItems.unitPriceCents,
      discountCents: orderItems.discountCents,
      quantity: orderItems.quantity,
      orderId: orderItems.orderId,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(
      and(
        inArray(orderItems.orderId, orderIds),
        isNull(orderItems.deletedAt),
        eq(orderItems.status, "kept")
      )
    );

  interface Acc {
    productId: string;
    name: string;
    quantitySold: number;
    revenueCents: number;
    costTotalCents: number;
    hasCost: boolean;
  }
  const byProduct = new Map<string, Acc>();
  for (const item of itemRows) {
    const feeRate = feeRateByOrder.get(item.orderId) ?? 0;
    const netRevenue = calcItemNetRevenue(item.unitPriceCents, item.discountCents, item.quantity, feeRate);

    const existing = byProduct.get(item.productId);
    if (existing) {
      existing.quantitySold += item.quantity;
      existing.revenueCents += netRevenue;
      if (item.costCents === null) existing.hasCost = false;
      else existing.costTotalCents += item.costCents * item.quantity;
    } else {
      byProduct.set(item.productId, {
        productId: item.productId,
        name: item.productName,
        quantitySold: item.quantity,
        revenueCents: netRevenue,
        costTotalCents: item.costCents !== null ? item.costCents * item.quantity : 0,
        hasCost: item.costCents !== null,
      });
    }
  }

  return Array.from(byProduct.values()).map((p) => {
    const revenueCents = Math.round(p.revenueCents);
    const { marginCents, marginPercent } = calcMargin(revenueCents, p.hasCost ? p.costTotalCents : null);
    return {
      productId: p.productId,
      name: p.name,
      quantitySold: p.quantitySold,
      revenueCents,
      costCents: p.hasCost ? p.costTotalCents : null,
      marginCents,
      marginPercent,
    };
  });
}
