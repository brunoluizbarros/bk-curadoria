-- Backfill: todo pagamento existente (anticipated = true, por default da 0009)
-- ganha exatamente 1 recebível, na data em que já liquidou (ou na data do
-- pagamento, se ainda pendente). Idempotente via NOT EXISTS.
INSERT INTO "payment_receivables" ("payment_id","installment_number","net_cents","expected_at","settled_at")
SELECT p."id", 1, p."net_cents", COALESCE(p."settled_at", p."paid_at"), p."settled_at"
FROM "payments" p
WHERE NOT EXISTS (SELECT 1 FROM "payment_receivables" r WHERE r."payment_id" = p."id");
