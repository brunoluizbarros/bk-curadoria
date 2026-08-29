import { db } from "@/db/client";
import { loyaltyCredits, siteConfig } from "@/db/schema";
import { and, desc, eq, gt, inArray, isNull, or, sql, sum } from "drizzle-orm";

const LOYALTY_KEYS = [
  "loyalty_enabled",
  "loyalty_percent",
  "loyalty_validity_days",
  "loyalty_min_order_cents",
] as const;

export type LoyaltyConfig = {
  enabled: boolean;
  percent: number;
  validityDays: number;
  minOrderCents: number;
};

export async function getLoyaltyConfig(): Promise<LoyaltyConfig> {
  const rows = await db
    .select()
    .from(siteConfig)
    .where(inArray(siteConfig.key, [...LOYALTY_KEYS]));

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    enabled: map.loyalty_enabled === "true",
    percent: parseFloat(map.loyalty_percent ?? "5"),
    validityDays: parseInt(map.loyalty_validity_days ?? "180", 10),
    minOrderCents: parseInt(map.loyalty_min_order_cents ?? "0", 10),
  };
}

// Saldo disponível: soma de todas transações excluindo earn expirados
export async function getCustomerCreditBalance(customerId: string): Promise<number> {
  const now = new Date();

  const [row] = await db
    .select({ total: sum(loyaltyCredits.amountCents) })
    .from(loyaltyCredits)
    .where(
      and(
        eq(loyaltyCredits.customerId, customerId),
        // Conta: earn não expirados + redeems + adjusts
        or(
          // Transações sem expiração (redeem/adjust)
          isNull(loyaltyCredits.expiresAt),
          // Earn ainda válidos
          gt(loyaltyCredits.expiresAt, now)
        )
      )
    );

  return Math.max(0, Number(row?.total ?? 0));
}

export type CreditHistoryRow = {
  id: string;
  kind: "earn" | "redeem" | "adjust";
  amountCents: number;
  orderId: string | null;
  expiresAt: Date | null;
  notes: string | null;
  createdAt: Date;
  isExpired: boolean;
};

export async function getCustomerCreditHistory(customerId: string): Promise<CreditHistoryRow[]> {
  const rows = await db
    .select()
    .from(loyaltyCredits)
    .where(eq(loyaltyCredits.customerId, customerId))
    .orderBy(desc(loyaltyCredits.createdAt));

  const now = new Date();
  return rows.map((r) => ({
    ...r,
    isExpired: r.expiresAt !== null && r.expiresAt <= now,
  }));
}

// Verifica se já existe crédito earn para esse pedido (idempotência)
export async function hasEarnedCreditForOrder(orderId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: loyaltyCredits.id })
    .from(loyaltyCredits)
    .where(
      and(
        eq(loyaltyCredits.orderId, orderId),
        eq(loyaltyCredits.kind, "earn")
      )
    )
    .limit(1);
  return !!row;
}
