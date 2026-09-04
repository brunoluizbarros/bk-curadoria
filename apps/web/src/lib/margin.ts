// Taxa efetiva de cartão do pedido: soma(feeCents)/soma(grossCents) entre
// todos os pagamentos do pedido. Pedido sem pagamento (ou só métodos sem
// taxa, como pix/dinheiro) dá 0.
export function calcOrderFeeRate(payments: { grossCents: number; feeCents: number }[]): number {
  const grossTotal = payments.reduce((acc, p) => acc + p.grossCents, 0);
  if (grossTotal === 0) return 0;
  const feeTotal = payments.reduce((acc, p) => acc + p.feeCents, 0);
  return feeTotal / grossTotal;
}

// Receita de um item de pedido já líquida da taxa de cartão do pedido.
export function calcItemNetRevenue(
  unitPriceCents: number,
  discountCents: number,
  quantity: number,
  feeRate: number
): number {
  const grossRevenue = (unitPriceCents - discountCents) * quantity;
  return grossRevenue * (1 - feeRate);
}

export interface MarginResult {
  marginCents: number | null;
  marginPercent: number | null;
}

// costCents nulo = custo não cadastrado para o produto — margem indefinida,
// não zero, pra não confundir "sem custo" com "sem lucro" no relatório.
export function calcMargin(revenueCents: number, costCents: number | null): MarginResult {
  if (costCents === null) return { marginCents: null, marginPercent: null };
  const marginCents = revenueCents - costCents;
  const marginPercent = revenueCents !== 0 ? (marginCents / revenueCents) * 100 : null;
  return { marginCents, marginPercent };
}
