const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

type WhatsAppCtx =
  | { kind: "default" }
  | { kind: "curadoria" }
  | { kind: "product"; name: string; price: string; slug: string }
  | { kind: "service"; name: string }
  | {
      kind: "wishlist-store-to-gifter";
      wisherName: string;
      gifterName: string;
      gifterRelation: string;
      token: string;
    }
  | {
      kind: "wishlist-share-to-gifter";
      wisherName: string;
      gifterName: string;
      gifterRelation: string;
      token: string;
    }
  | {
      kind: "wishlist-to-store";
      wisherName: string;
      token: string;
    };

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
  "wishlist-store-to-gifter": (ctx) => {
    const c = ctx as Extract<WhatsAppCtx, { kind: "wishlist-store-to-gifter" }>;
    return `Olá ${c.gifterName}! 💕\n\n${c.wisherName} montou uma lista de desejos aqui na *BK Curadoria* e pediu para entrarmos em contato com você, ${c.gifterRelation} dela, para te mostrar o que ela adoraria ganhar de presente! 🎁\n\n👉 Veja a lista: ${BASE_URL}/lista/${c.token}\n\nFicamos à disposição para ajudar!`;
  },
  "wishlist-share-to-gifter": (ctx) => {
    const c = ctx as Extract<WhatsAppCtx, { kind: "wishlist-share-to-gifter" }>;
    return `Oi ${c.gifterName}! 💕 Fiz uma listinha de desejos aqui na BK Curadoria com tudo que amei e adoraria ganhar de presente. Dá uma olhadinha? 😍\n\n👉 ${BASE_URL}/lista/${c.token}`;
  },
  "wishlist-to-store": (ctx) => {
    const c = ctx as Extract<WhatsAppCtx, { kind: "wishlist-to-store" }>;
    return `Olá Rebeka! Vi a lista de desejos de *${c.wisherName}* e quero saber como presenteá-la! 🎁\n\n👉 ${BASE_URL}/lista/${c.token}`;
  },
};

export function buildWhatsAppLink(ctx: WhatsAppCtx, phone: string): string {
  const msg = templates[ctx.kind](ctx);
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
