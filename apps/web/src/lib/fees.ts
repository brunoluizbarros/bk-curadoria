export function calcNetCents(grossCents: number, feePercent: number): number {
  const feeCents = Math.round(grossCents * (feePercent / 100));
  return grossCents - feeCents;
}

export function calcFeeCents(grossCents: number, feePercent: number): number {
  return Math.round(grossCents * (feePercent / 100));
}

// Divide totalCents em `parts` pedaços sem perder nem inventar centavo.
// Resto vai na ÚLTIMA parcela — mesma convenção de src/server/actions/expenses.ts,
// para as duas fontes de parcelamento do sistema arredondarem igual.
export function splitCents(totalCents: number, parts: number): number[] {
  const base = Math.floor(totalCents / parts);
  const remainder = totalCents - base * parts;
  return Array.from({ length: parts }, (_, i) => (i === parts - 1 ? base + remainder : base));
}

type CardMachineFees = { anticipatedFeePercent: number; nonAnticipatedFeePercent: number };

// Resolve a taxa aplicável: cartão com maquininha usa a taxa da maquininha
// (antecipada ou não); cartão sem maquininha cai no fallback por método já
// existente em payment_fee_configs; não-cartão nunca tem taxa.
export function resolveFeePercent(
  method: string,
  anticipated: boolean,
  machine: CardMachineFees | null,
  methodFallback: Record<string, number>
): number {
  const isCard = method === "credit_card" || method === "debit_card";
  if (!isCard) return 0;
  if (machine) return anticipated ? machine.anticipatedFeePercent : machine.nonAnticipatedFeePercent;
  return methodFallback[method] ?? 0;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export interface ReceivableSchedule {
  installmentNumber: number;
  netCents: number;
  expectedAt: Date;
}

// Gera o cronograma de recebíveis de um pagamento:
// - antecipado (ou não-cartão): 1 linha, dinheiro cai de uma vez.
// - não antecipado: 1 linha por parcela, uma a cada `installmentIntervalDays`.
// `paidAt` é ancorado ao meio-dia UTC antes de somar dias, para a data
// resultante não depender do fuso do servidor.
export function buildReceivableSchedule(opts: {
  netCents: number;
  paidAt: Date;
  installments: number;
  anticipated: boolean;
  anticipationDays: number;
  installmentIntervalDays: number;
}): ReceivableSchedule[] {
  const { netCents, paidAt, installments, anticipated, anticipationDays, installmentIntervalDays } = opts;
  const base = new Date(
    Date.UTC(paidAt.getUTCFullYear(), paidAt.getUTCMonth(), paidAt.getUTCDate(), 12)
  );

  if (anticipated) {
    return [{ installmentNumber: 1, netCents, expectedAt: addDays(base, anticipationDays) }];
  }

  const parts = splitCents(netCents, installments);
  return parts.map((amount, i) => ({
    installmentNumber: i + 1,
    netCents: amount,
    expectedAt: addDays(base, installmentIntervalDays * (i + 1)),
  }));
}
