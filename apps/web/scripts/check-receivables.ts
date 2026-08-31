/**
 * Teste do cronograma de recebíveis (split de centavos, antecipação,
 * resolução de taxa). Sem framework, sem banco.
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

  // resolveFeePercent
  {
    const machine = { anticipatedFeePercent: 1.5, nonAnticipatedFeePercent: 3.5 };
    assert(resolveFeePercent("credit_card", true, machine, {}) === 1.5, "cartão+maquininha antecipado usa taxa antecipada");
    assert(resolveFeePercent("credit_card", false, machine, {}) === 3.5, "cartão+maquininha não antecipado usa taxa não antecipada");
    assert(resolveFeePercent("credit_card", true, null, { credit_card: 4.5 }) === 4.5, "cartão sem maquininha cai no fallback por método");
    assert(resolveFeePercent("pix", true, machine, { pix: 99 }) === 0, "pix nunca tem taxa, mesmo com maquininha/fallback");
  }

  // buildReceivableSchedule: antecipado
  {
    const paidAt = new Date("2026-03-10T15:00:00Z");
    const schedule = buildReceivableSchedule({
      netCents: 100000,
      paidAt,
      installments: 3,
      anticipated: true,
      anticipationDays: 1,
      installmentIntervalDays: 30,
    });
    assert(schedule.length === 1, "antecipado gera 1 parcela mesmo com installments>1");
    assert(schedule[0].netCents === 100000, "antecipado: valor total de uma vez");
    const expected = new Date("2026-03-11T12:00:00Z");
    assert(schedule[0].expectedAt.getTime() === expected.getTime(), "antecipado: expectedAt = paidAt + anticipationDays");
  }

  // buildReceivableSchedule: 12x não antecipado
  {
    const paidAt = new Date("2026-01-31T09:00:00Z"); // virada de mês proposital
    const schedule = buildReceivableSchedule({
      netCents: 100000,
      paidAt,
      installments: 12,
      anticipated: false,
      anticipationDays: 1,
      installmentIntervalDays: 30,
    });
    assert(schedule.length === 12, "12x não antecipado gera 12 parcelas");
    assert(
      schedule.reduce((a, s) => a + s.netCents, 0) === 100000,
      "12x: soma das parcelas bate o líquido exato"
    );
    for (let i = 1; i < schedule.length; i++) {
      assert(schedule[i].expectedAt.getTime() > schedule[i - 1].expectedAt.getTime(), `parcela ${i + 1} depois da ${i}`);
    }
    // base UTC-noon é 2026-01-31T12:00Z; +30 dias corridos = 2026-03-02
    assert(
      schedule[0].expectedAt.toISOString().slice(0, 10) === "2026-03-02",
      "virada de mês: 31/jan + 30 dias corridos = 02/mar (sem pular mês/ano)"
    );
  }

  if (process.exitCode) {
    console.error("\nFalhou.");
  } else {
    console.log("\nOK.");
  }
}

main();
