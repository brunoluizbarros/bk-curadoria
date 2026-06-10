import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { orders } from "./orders";

export const loyaltyKindEnum = pgEnum("loyalty_kind", [
  "earn",
  "redeem",
  "adjust",
]);

export const loyaltyCredits = pgTable(
  "loyalty_credits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    kind: loyaltyKindEnum("kind").notNull(),
    // earn/adjust positivo → crédito; redeem/adjust negativo → débito
    amountCents: integer("amount_cents").notNull(),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("loyalty_credits_customer_idx").on(t.customerId),
    index("loyalty_credits_expires_idx").on(t.expiresAt),
    index("loyalty_credits_order_idx").on(t.orderId),
  ]
);

export type LoyaltyCredit = typeof loyaltyCredits.$inferSelect;
export type NewLoyaltyCredit = typeof loyaltyCredits.$inferInsert;
