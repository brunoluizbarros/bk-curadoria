export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function parseBRLtoCents(value: string): number {
  const clean = value.replace(/[R$\s.]/g, "").replace(",", ".");
  return Math.round(parseFloat(clean) * 100);
}
