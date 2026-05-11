import { pgTable, text, integer, boolean, uuid } from "drizzle-orm/pg-core";

export const services = pgTable("services", {
  slug: text("slug").primaryKey(),
  number: text("number").notNull(),
  name: text("name").notNull(),
  subtitle: text("subtitle").notNull(),
  heroGradient: text("hero_gradient").notNull(),
  lead: text("lead").notNull(),
  deliverable: text("deliverable").notNull(),
  duration: text("duration").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const serviceSteps = pgTable("service_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceSlug: text("service_slug")
    .notNull()
    .references(() => services.slug, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type ServiceStep = typeof serviceSteps.$inferSelect;
export type NewServiceStep = typeof serviceSteps.$inferInsert;
