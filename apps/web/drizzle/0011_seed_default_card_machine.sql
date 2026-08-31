-- Cria a maquininha padrão "Mercado Livre", usando a taxa de cartão de
-- crédito já configurada em payment_fee_configs (mesmo valor para taxa
-- antecipada e não antecipada — o sistema anterior só tinha 1 taxa por
-- método, sem diferenciar). Idempotente: não recria se já existir uma
-- maquininha com esse nome. Só roda se houver histórico de pagamentos —
-- numa instalação nova, não faz sentido semear uma maquininha fictícia.
INSERT INTO "card_machines" ("name","anticipated_fee_percent","non_anticipated_fee_percent","anticipation_days","installment_interval_days","active")
SELECT
  'Mercado Livre',
  COALESCE((SELECT "fee_percent" FROM "payment_fee_configs" WHERE "method" = 'credit_card'), 0),
  COALESCE((SELECT "fee_percent" FROM "payment_fee_configs" WHERE "method" = 'credit_card'), 0),
  1,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM "card_machines" WHERE "name" = 'Mercado Livre')
  AND EXISTS (SELECT 1 FROM "payments");
--> statement-breakpoint

-- Indexa a maquininha nova a todas as compras de cartão já existentes que
-- ainda não têm maquininha vinculada. Não altera fee_percent/fee_cents/
-- net_cents já gravados em cada pagamento — só associa qual maquininha
-- processou a venda, para relatórios futuros.
UPDATE "payments"
SET "machine_id" = (SELECT "id" FROM "card_machines" WHERE "name" = 'Mercado Livre')
WHERE "method" IN ('credit_card', 'debit_card')
  AND "machine_id" IS NULL;
