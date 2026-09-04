import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { categories } from "./categories";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    color: text("color").notNull(),
    priceCents: integer("price_cents").notNull(),
    // Nulo = custo ainda não cadastrado (distinto de custo zero) — produtos
    // antigos ficam assim até alguém preencher em /admin/products/[id]/edit.
    costCents: integer("cost_cents"),
    tag: text("tag"),
    description: text("description").notNull(),
    composition: text("composition"),
    origin: text("origin"),
    fallbackGradient: text("fallback_gradient"),
    featured: boolean("featured").notNull().default(false),
    active: boolean("active").notNull().default(true),
    sortOrder: real("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    // slug único só entre produtos ativos — um produto soft-deletado libera o slug para reuso
    uniqueIndex("products_slug_unique").on(t.slug).where(sql`${t.deletedAt} is null`),
  ]
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    storageKey: text("storage_key").notNull(),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("product_images_product_sort_idx").on(t.productId, t.sortOrder)]
);

export const productCategories = pgTable(
  "product_categories",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.categoryId] })]
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
