import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  real,
  boolean,
  timestamp,
  index,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const paymentMethodEnum = pgEnum("payment_method", [
  "pix",
  "credit_card",
  "debit_card",
  "cash",
  "transfer",
]);

// Cadastro de maquininhas — cada uma tem sua própria política de taxa e prazo
// de liquidação (antecipado x não antecipado). Fica neste arquivo (em vez de
// settings.ts) para evitar import circular: settings.ts já importa
// paymentMethodEnum daqui.
export const cardMachines = pgTable("card_machines", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  anticipatedFeePercent: real("anticipated_fee_percent").default(0).notNull(),
  // Fallback quando não há linha em card_machine_rates para o nº de parcelas
  // (ex: acima de 12x, ou maquininha sem tabela cadastrada).
  nonAnticipatedFeePercent: real("non_anticipated_fee_percent").default(0).notNull(),
  anticipationDays: integer("anticipation_days").default(1).notNull(),
  active: boolean("active").default(true).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Taxa não antecipada por número de parcelas (ex: 1x=4,98%, 2x=5,6%...) —
// modelo de tabela por parcela usado por maquininhas tipo Mercado Pago/PagSeguro.
export const cardMachineRates = pgTable(
  "card_machine_rates",
  {
    machineId: uuid("machine_id")
      .notNull()
      .references(() => cardMachines.id, { onDelete: "cascade" }),
    installments: integer("installments").notNull(),
    feePercent: real("fee_percent").notNull(),
  },
  (t) => [primaryKey({ columns: [t.machineId, t.installments] })]
);

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
    machineId: uuid("machine_id").references(() => cardMachines.id),
    anticipated: boolean("anticipated").default(true).notNull(),
    reference: text("reference"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("payments_order_id_idx").on(t.orderId),
    index("payments_settled_at_idx").on(t.settledAt),
    index("payments_paid_at_idx").on(t.paidAt),
  ]
);

// Uma linha por parcela de recebimento — inclusive antecipados e métodos não
// cartão, que sempre geram exatamente 1 linha. Fonte única de "quando o
// dinheiro cai", usada tanto pelo DRE quanto pelo Fluxo de Caixa.
export const paymentReceivables = pgTable(
  "payment_receivables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    installmentNumber: integer("installment_number").notNull(),
    grossCents: integer("gross_cents").default(0).notNull(),
    feeCents: integer("fee_cents").default(0).notNull(),
    netCents: integer("net_cents").notNull(),
    expectedAt: timestamp("expected_at", { withTimezone: true }).notNull(),
    settledAt: timestamp("settled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("payment_receivables_payment_installment_unique").on(t.paymentId, t.installmentNumber),
    index("payment_receivables_expected_at_idx").on(t.expectedAt),
    index("payment_receivables_settled_at_idx").on(t.settledAt),
  ]
);

export type CardMachine = typeof cardMachines.$inferSelect;
export type NewCardMachine = typeof cardMachines.$inferInsert;
export type CardMachineRate = typeof cardMachineRates.$inferSelect;
export type NewCardMachineRate = typeof cardMachineRates.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type PaymentReceivable = typeof paymentReceivables.$inferSelect;
export type NewPaymentReceivable = typeof paymentReceivables.$inferInsert;
