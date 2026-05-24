import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { customers, addresses } from "./customers";
import { products } from "./products";

export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "sent",
  "returned",
  "paid",
  "cancelled",
]);

export const orderItemStatusEnum = pgEnum("order_item_status", [
  "kept",
  "returned",
]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    addressId: uuid("address_id").references(() => addresses.id, {
      onDelete: "set null",
    }),
    status: orderStatusEnum("status").default("draft").notNull(),
    soldAt: timestamp("sold_at", { withTimezone: true }).defaultNow().notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    discountCents: integer("discount_cents").default(0).notNull(),
    shippingCents: integer("shipping_cents").default(0).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("orders_customer_id_idx").on(t.customerId),
    index("orders_status_idx").on(t.status),
    index("orders_sold_at_idx").on(t.soldAt),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").default(1).notNull(),
    status: orderItemStatusEnum("status").default("kept").notNull(),
    notes: text("notes"),
  },
  (t) => [index("order_items_order_id_idx").on(t.orderId)]
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
