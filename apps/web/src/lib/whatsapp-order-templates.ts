import { formatBRL } from "@/lib/format";

const METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  cash: "Dinheiro",
  transfer: "Transferência",
};

type OrderForWa = {
  customer: { name: string };
  items: {
    product: { name: string };
    unitPriceCents: number;
    quantity: number;
    status: string;
  }[];
  total: number;
  shippingCents: number;
  discountCents: number;
  payments: { method: string; grossCents: number }[];
};

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0];
}

export function buildMalinhaEnviadaMessage(order: OrderForWa): string {
  const name = firstName(order.customer.name);
  const allItems = order.items;
  const n = allItems.length;

  return `Olá ${name}! 🛍️

Sua malinha BK com *${n} ${n === 1 ? "peça" : "peças"}* está a caminho!

Experimenta tudo com calma e me conta o que você amou. ✨

Qualquer dúvida, é só chamar! 💕`;
}

export function buildLinkPagamentoMessage(order: OrderForWa, paymentLink: string): string {
  const name = firstName(order.customer.name);
  const keptItems = order.items.filter((i) => i.status === "kept");

  const itemLines = keptItems
    .map((i) => `• ${i.product.name} — ${formatBRL(i.unitPriceCents * i.quantity)}`)
    .join("\n");

  const extras: string[] = [];
  if (order.shippingCents > 0) extras.push(`Frete: + ${formatBRL(order.shippingCents)}`);
  if (order.discountCents > 0) extras.push(`Desconto: − ${formatBRL(order.discountCents)}`);

  const extrasBlock = extras.length ? "\n" + extras.join("\n") : "";

  return `Olá ${name}! 💳

Peças escolhidas:
${itemLines}${extrasBlock}

*Total: ${formatBRL(order.total)}*

Segue o link para pagamento:
${paymentLink}

Qualquer dúvida, é só chamar! 💕`;
}

export function buildPagamentoConfirmadoMessage(order: OrderForWa): string {
  const name = firstName(order.customer.name);
  const last = order.payments[order.payments.length - 1];
  const methodLabel = last ? (METHOD_LABELS[last.method] ?? last.method) : "";

  return `Olá ${name}! ✅

Recebemos seu pagamento de *${formatBRL(order.total)}*${methodLabel ? ` via ${methodLabel}` : ""}.

Muito obrigada pela confiança! 💕`;
}

export function buildItemsConfirmadosMessage(order: OrderForWa): string {
  const name = firstName(order.customer.name);
  const kept = order.items.filter((i) => i.status === "kept");
  const returned = order.items.filter((i) => i.status === "returned");

  const keptLines = kept.map((i) => `✅ ${i.product.name}`).join("\n");
  const returnedLines = returned.length
    ? "\n\nDevolvendo:\n" + returned.map((i) => `↩️ ${i.product.name}`).join("\n")
    : "";

  return `Olá ${name}! 🛍️

Confirmando os itens da sua malinha:

${keptLines}${returnedLines}

*Total: ${formatBRL(order.total)}*

Em breve envio o link de pagamento! 💕`;
}
