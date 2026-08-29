import { pgTable, real, timestamp } from "drizzle-orm/pg-core";
import { paymentMethodEnum } from "./payments";

export const paymentFeeConfigs = pgTable("payment_fee_configs", {
  method: paymentMethodEnum("method").primaryKey(),
  feePercent: real("fee_percent").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PaymentFeeConfig = typeof paymentFeeConfigs.$inferSelect;
