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

type CardMachineFees = {
  anticipatedFeePercent: number;
  nonAnticipatedFeePercent: number;
  rates?: { installments: number; feePercent: number }[];
};

// Resolve a taxa aplicável: cartão com maquininha usa a taxa da maquininha —
// antecipada é sempre um único percentual; não antecipada busca primeiro na
// tabela por nº de parcelas (rates) e cai no percentual padrão se não achar
// (ex: acima de 12x, ou maquininha sem tabela cadastrada). Cartão sem
// maquininha cai no fallback por método já existente em payment_fee_configs;
// não-cartão nunca tem taxa.
export function resolveFeePercent(
  method: string,
  anticipated: boolean,
  installments: number,
  machine: CardMachineFees | null,
  methodFallback: Record<string, number>
): number {
  const isCard = method === "credit_card" || method === "debit_card";
  if (!isCard) return 0;
  if (machine) {
    if (anticipated) return machine.anticipatedFeePercent;
    const rate = machine.rates?.find((r) => r.installments === installments);
    return rate?.feePercent ?? machine.nonAnticipatedFeePercent;
  }
  return methodFallback[method] ?? 0;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

// Soma meses de calendário, com clamp ao último dia do mês de destino
// (31/jan +1 mês = 28/fev, não 03/mar). `base` já deve estar ancorado ao
// meio-dia UTC, mesma convenção do resto deste arquivo.
function addMonths(base: Date, months: number): Date {
  const y = base.getUTCFullYear();
  const m = base.getUTCMonth();
  const d = base.getUTCDate();
  const lastDayOfTarget = new Date(Date.UTC(y, m + months + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m + months, Math.min(d, lastDayOfTarget), 12));
}

export interface ReceivableSchedule {
  installmentNumber: number;
  grossCents: number;
  feeCents: number;
  netCents: number;
  expectedAt: Date;
}

// Gera o cronograma de recebíveis de um pagamento:
// - antecipado (ou não-cartão): 1 linha, dinheiro cai de uma vez, taxa única.
// - não antecipado: 1 linha por parcela, uma por mês de calendário; bruto e
//   taxa também são rateados por parcela (a taxa pode variar por nº de
//   parcelas — ver resolveFeePercent — mas dentro de um mesmo pagamento é
//   o mesmo percentual em todas as parcelas).
// `paidAt` é ancorado ao meio-dia UTC antes de somar dias/meses, para a data
// resultante não depender do fuso do servidor.
export function buildReceivableSchedule(opts: {
  grossCents: number;
  feePercent: number;
  paidAt: Date;
  installments: number;
  anticipated: boolean;
  anticipationDays: number;
}): ReceivableSchedule[] {
  const { grossCents, feePercent, paidAt, installments, anticipated, anticipationDays } = opts;
  const base = new Date(
    Date.UTC(paidAt.getUTCFullYear(), paidAt.getUTCMonth(), paidAt.getUTCDate(), 12)
  );

  if (anticipated) {
    const feeCents = calcFeeCents(grossCents, feePercent);
    return [
      {
        installmentNumber: 1,
        grossCents,
        feeCents,
        netCents: grossCents - feeCents,
        expectedAt: addDays(base, anticipationDays),
      },
    ];
  }

  const grossParts = splitCents(grossCents, installments);
  return grossParts.map((gross, i) => {
    const fee = calcFeeCents(gross, feePercent);
    return {
      installmentNumber: i + 1,
      grossCents: gross,
      feeCents: fee,
      netCents: gross - fee,
      expectedAt: addMonths(base, i + 1),
    };
  });
}
