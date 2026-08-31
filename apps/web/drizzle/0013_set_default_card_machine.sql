-- Marca "Mercado Livre" como maquininha padrão, preservando o comportamento
-- que antes vinha do nome fixo no código. Só roda se nenhuma maquininha já
-- tiver sido marcada como padrão (idempotente e não sobrescreve escolha manual).
UPDATE "card_machines"
SET "is_default" = true
WHERE "name" = 'Mercado Livre'
  AND NOT EXISTS (SELECT 1 FROM "card_machines" WHERE "is_default" = true);
