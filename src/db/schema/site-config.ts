import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";

export const siteConfig = pgTable("site_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const homeDifferentials = pgTable("home_differentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  iconName: text("icon_name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type SiteConfig = typeof siteConfig.$inferSelect;
export type HomeDifferential = typeof homeDifferentials.$inferSelect;
export type NewHomeDifferential = typeof homeDifferentials.$inferInsert;
