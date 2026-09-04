-- Backfill: recebíveis criados antes desta migração não tinham gross_cents/
-- fee_cents (só net_cents). Rateia payments.fee_cents entre as parcelas do
-- pagamento na mesma convenção de splitCents (resto na última parcela) e
-- deriva gross_cents = net_cents + fee_i, mantendo o invariante
-- gross - fee = net em toda linha. Idempotente via WHERE pr.gross_cents = 0
-- (grossCents nunca é 0 num pagamento novo, é positivo por validação).
WITH ranked AS (
  SELECT
    pr."id",
    pr."net_cents",
    p."fee_cents" AS payment_fee_cents,
    ROW_NUMBER() OVER (PARTITION BY pr."payment_id" ORDER BY pr."installment_number") AS rn,
    COUNT(*) OVER (PARTITION BY pr."payment_id") AS cnt
  FROM "payment_receivables" pr
  JOIN "payments" p ON p."id" = pr."payment_id"
  WHERE pr."gross_cents" = 0
),
computed AS (
  SELECT
    "id",
    "net_cents",
    CASE
      WHEN rn = cnt THEN (payment_fee_cents / cnt) + (payment_fee_cents - (payment_fee_cents / cnt) * cnt)
      ELSE payment_fee_cents / cnt
    END AS fee_share
  FROM ranked
)
UPDATE "payment_receivables" pr
SET
  "fee_cents" = c."fee_share",
  "gross_cents" = pr."net_cents" + c."fee_share"
FROM computed c
WHERE pr."id" = c."id";
