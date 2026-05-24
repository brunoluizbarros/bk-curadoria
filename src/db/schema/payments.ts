import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  real,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const paymentMethodEnum = pgEnum("payment_method", [
  "pix",
  "credit_card",
  "debit_card",
  "cash",
  "transfer",
]);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    method: paymentMethodEnum("method").notNull(),
    brand: text("brand"),
    installments: integer("installments").default(1).notNull(),
    grossCents: integer("gross_cents").notNull(),
    feePercent: real("fee_percent").default(0).notNull(),
    feeCents: integer("fee_cents").default(0).notNull(),
    netCents: integer("net_cents").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
    settledAt: timestamp("settled_at", { withTimezone: true }),
    reference: text("reference"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("payments_order_id_idx").on(t.orderId),
    index("payments_settled_at_idx").on(t.settledAt),
    index("payments_paid_at_idx").on(t.paidAt),
  ]
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
