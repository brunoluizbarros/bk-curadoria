export function calcNetCents(grossCents: number, feePercent: number): number {
  const feeCents = Math.round(grossCents * (feePercent / 100));
  return grossCents - feeCents;
}

export function calcFeeCents(grossCents: number, feePercent: number): number {
  return Math.round(grossCents * (feePercent / 100));
}
