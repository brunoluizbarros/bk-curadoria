/**
 * Teste do cronograma de recebíveis (split de centavos, antecipação,
 * resolução de taxa por parcela, vencimento mensal). Sem framework, sem banco.
 * Uso: tsx scripts/check-receivables.ts
 */
import { splitCents, resolveFeePercent, buildReceivableSchedule } from "../src/lib/fees";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    console.error(`✗ ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

function main() {
  // splitCents: nunca perde nem inventa centavo, resto na última parcela
  {
    const parts = splitCents(100000, 12);
    assert(parts.length === 12, "splitCents(100000,12) tem 12 partes");
    assert(parts.reduce((a, b) => a + b, 0) === 100000, "splitCents(100000,12) soma exato");
    assert(parts.slice(0, 11).every((p) => p === 8333), "splitCents(100000,12): 11 primeiras = base (8333)");
    assert(parts[11] === 8337, "splitCents(100000,12): última absorve o resto (8333+4)");
  }
  {
    const parts = splitCents(7, 3);
    assert(parts.reduce((a, b) => a + b, 0) === 7, "splitCents(7,3) soma exato");
    assert(JSON.stringify(parts) === JSON.stringify([2, 2, 3]), "splitCents(7,3) = [2,2,3]");
  }
  {
    const parts = splitCents(0, 12);
    assert(parts.every((p) => p === 0), "splitCents(0,12) tudo zero");
  }

  // resolveFeePercent: tabela por nº de parcelas > fallback padrão da maquininha > fallback por método
  {
    const machine = {
      anticipatedFeePercent: 1.5,
      nonAnticipatedFeePercent: 3.5,
      rates: [
        { installments: 1, feePercent: 2.0 },
        { installments: 3, feePercent: 6.2 },
      ],
    };
    assert(resolveFeePercent("credit_card", true, 3, machine, {}) === 1.5, "cartão+maquininha antecipado usa taxa antecipada, ignora a tabela");
    assert(resolveFeePercent("credit_card", false, 3, machine, {}) === 6.2, "não antecipado 3x usa a linha da tabela (3x)");
    assert(resolveFeePercent("credit_card", false, 1, machine, {}) === 2.0, "não antecipado 1x usa a linha da tabela (1x)");
    assert(resolveFeePercent("credit_card", false, 18, machine, {}) === 3.5, "não antecipado sem linha na tabela (18x) cai no padrão da maquininha");
    assert(resolveFeePercent("credit_card", true, 1, null, { credit_card: 4.5 }) === 4.5, "cartão sem maquininha cai no fallback por método");
    assert(resolveFeePercent("pix", true, 1, machine, { pix: 99 }) === 0, "pix nunca tem taxa, mesmo com maquininha/fallback");
  }

  // buildReceivableSchedule: antecipado — taxa única, 1 parcela mesmo com installments>1
  {
    const paidAt = new Date("2026-03-10T15:00:00Z");
    const schedule = buildReceivableSchedule({
      grossCents: 100000,
      feePercent: 1.5,
      paidAt,
      installments: 3,
      anticipated: true,
      anticipationDays: 1,
    });
    assert(schedule.length === 1, "antecipado gera 1 parcela mesmo com installments>1");
    assert(schedule[0].grossCents === 100000, "antecipado: bruto de uma vez");
    assert(schedule[0].feeCents === 1500, "antecipado: taxa única sobre o bruto total (1.5% de 100000)");
    assert(schedule[0].netCents === 98500, "antecipado: líquido = bruto - taxa");
    const expected = new Date("2026-03-11T12:00:00Z");
    assert(schedule[0].expectedAt.getTime() === expected.getTime(), "antecipado: expectedAt = paidAt + anticipationDays");
  }

  // buildReceivableSchedule: 3x não antecipado — bruto/taxa/líquido por parcela, vencimento mensal
  {
    const paidAt = new Date("2026-01-31T09:00:00Z"); // virada de mês proposital
    const schedule = buildReceivableSchedule({
      grossCents: 100000,
      feePercent: 6.2,
      paidAt,
      installments: 3,
      anticipated: false,
      anticipationDays: 1,
    });
    assert(schedule.length === 3, "3x não antecipado gera 3 parcelas");
    assert(
      schedule.reduce((a, s) => a + s.grossCents, 0) === 100000,
      "3x: soma dos brutos bate o bruto exato"
    );
    assert(
      schedule.every((s) => s.grossCents - s.feeCents === s.netCents),
      "3x: em toda parcela, bruto - taxa = líquido"
    );
    for (let i = 1; i < schedule.length; i++) {
      assert(schedule[i].expectedAt.getTime() > schedule[i - 1].expectedAt.getTime(), `parcela ${i + 1} depois da ${i}`);
    }
    // Vencimento mensal com clamp: 31/jan não existe em fevereiro → cai em 28/fev.
    assert(
      schedule[0].expectedAt.toISOString().slice(0, 10) === "2026-02-28",
      "virada de mês: 31/jan + 1 mês = 28/fev (mês-calendário, não +30 dias corridos)"
    );
    assert(
      schedule[1].expectedAt.toISOString().slice(0, 10) === "2026-03-31",
      "2ª parcela: 31/jan + 2 meses = 31/mar"
    );
    assert(
      schedule[2].expectedAt.toISOString().slice(0, 10) === "2026-04-30",
      "3ª parcela: 31/jan + 3 meses = 30/abr (abril não tem dia 31)"
    );
  }

  if (process.exitCode) {
    console.error("\nFalhou.");
  } else {
    console.log("\nOK.");
  }
}

main();
