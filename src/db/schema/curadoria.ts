import { pgTable, integer, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const curadoriaContent = pgTable("curadoria_content", {
  id: integer("id").primaryKey().default(1),
  eyebrow: text("eyebrow").notNull(),
  title: text("title").notNull(),
  titleEm: text("title_em"),
  leadParagraph1: text("lead_p1").notNull(),
  leadParagraph2: text("lead_p2"),
  quoteText: text("quote_text").notNull(),
  quoteSignature: text("quote_signature"),
  ctaLabel: text("cta_label").notNull(),
  ctaSubtext: text("cta_subtext"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const curadoriaCrivos = pgTable("curadoria_crivos", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: text("number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const curadoriaRelacao = pgTable("curadoria_relacao", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type CuradoriaContent = typeof curadoriaContent.$inferSelect;
export type CuradoriaCrivo = typeof curadoriaCrivos.$inferSelect;
export type CuradoriaRelacaoItem = typeof curadoriaRelacao.$inferSelect;
