const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

type WhatsAppCtx =
  | { kind: "default" }
  | { kind: "curadoria" }
  | { kind: "product"; name: string; price: string; slug: string }
  | { kind: "service"; name: string };

const templates: Record<WhatsAppCtx["kind"], (ctx: WhatsAppCtx) => string> = {
  default: () => "Olá Rebeka, vim pelo site da BK.",
  curadoria: () => "Olá Rebeka, quero conhecer melhor a curadoria BK.",
  product: (ctx) => {
    const c = ctx as Extract<WhatsAppCtx, { kind: "product" }>;
    return `Olá Rebeka, tenho interesse em:\n*${c.name}* (${c.price})\n\n🔗 ${BASE_URL}/produtos/${c.slug}`;
  },
  service: (ctx) => {
    const c = ctx as Extract<WhatsAppCtx, { kind: "service" }>;
    return `Olá Rebeka, tenho interesse em ${c.name}.`;
  },
};

export function buildWhatsAppLink(ctx: WhatsAppCtx, phone: string): string {
  const msg = templates[ctx.kind](ctx);
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
