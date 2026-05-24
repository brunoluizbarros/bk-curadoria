import { db } from "@/db/client";
import { paymentFeeConfigs } from "@/db/schema";

const METHODS = ["pix", "credit_card", "debit_card", "cash", "transfer"] as const;

export type FeeConfigMap = Record<string, number>;

export async function getPaymentFeeConfigs(): Promise<FeeConfigMap> {
  const rows = await db.select().from(paymentFeeConfigs);
  const map: FeeConfigMap = Object.fromEntries(METHODS.map((m) => [m, 0]));
  for (const row of rows) {
    map[row.method] = row.feePercent;
  }
  return map;
}
