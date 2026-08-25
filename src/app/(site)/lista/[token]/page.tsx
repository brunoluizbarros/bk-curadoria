import { getWishlistByToken } from "@/server/queries/wishlists";
import { getSiteConfig } from "@/server/queries/site-config";
import { WishlistShareActions } from "@/components/site/WishlistShareActions";
import { formatBRL } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { pickFallbackGradient } from "@/lib/gradients";
import { notFound } from "next/navigation";
import Image from "next/image";
import { IconHeart, IconBrandWhatsapp } from "@/components/ui/icons";
import type { Metadata } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const list = await getWishlistByToken(token);
  if (!list) return {};
  return {
    title: `Lista de desejos de ${list.wisherName} · BK Curadoria`,
    description: `${list.wisherName} montou uma lista especial com ${list.items.length} peça${list.items.length !== 1 ? "s" : ""} na BK Curadoria.`,
  };
}

export default async function WishlistTokenPage({ params }: Props) {
  const { token } = await params;
  const [list, config] = await Promise.all([
    getWishlistByToken(token),
    getSiteConfig(),
  ]);

  if (!list) notFound();

  const phone = config.whatsapp_number ?? "5581999999999";

  const storeContactLink = buildWhatsAppLink(
    {
      kind: "wishlist-to-store",
      wisherName: list.wisherName,
      token,
    },
    phone
  );

  return (
    <div className="max-w-[480px] md:max-w-2xl mx-auto px-5 py-8">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2 mb-1">
        <IconHeart size={20} className="text-terracotta" />
        <span className="font-body text-xs tracking-[0.2em] uppercase text-terracotta">
          Lista de desejos
        </span>
      </div>
      <h1 className="font-display font-400 text-2xl md:text-3xl text-ink mb-1">
        Lista de {list.wisherName}
      </h1>
      <p className="font-body text-sm text-ink-soft mb-6">
        {list.wisherName} adoraria ganhar {list.items.length === 1 ? "essa peça" : `uma dessas ${list.items.length} peças`} de presente
        {list.occasion === "namorados" ? " no Dia dos Namorados 💕" : ""}
      </p>

      {/* Produtos */}
      <div className="space-y-3 mb-8">
        {list.items.map((item) => (
          <a
            key={item.id}
            href={`${BASE}/produtos/${item.slug}`}
            className="flex items-center gap-3 bg-cream rounded-card px-3 py-3 border border-ink/10 hover:border-ink/30 transition-colors"
          >
            <div
              className="w-12 h-14 rounded shrink-0 overflow-hidden"
              style={{ background: item.firstImage ? undefined : item.fallbackGradient ?? pickFallbackGradient(item.id) }}
            >
              {item.firstImage && (
                <Image
                  src={item.firstImage.url}
                  alt={item.name}
                  width={48}
                  height={56}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-400 text-sm text-ink truncate">{item.name}</p>
              <p className="font-body text-xs text-terracotta mt-0.5">{formatBRL(item.priceCents)}</p>
            </div>
          </a>
        ))}
      </div>

      {/* CTA para o presenteador */}
      <div className="border-t border-ink/10 pt-6 space-y-4">
        <p className="font-body text-sm text-ink-soft text-center">
          Quer ser quem realiza esse desejo?
        </p>
        <a
          href={storeContactLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-btn font-body text-xs tracking-[0.2em] uppercase bg-terracotta text-cream hover:bg-terracotta-soft transition-colors"
        >
          <IconBrandWhatsapp size={16} />
          Quero presentear
        </a>

        <WishlistShareActions
          token={token}
          wisherName={list.wisherName}
          gifterName={list.gifterName}
          gifterRelation={list.gifterRelation}
          gifterPhone={list.gifterPhone}
        />
      </div>

      {list.note && (
        <div className="mt-6 bg-cream-soft rounded-card px-4 py-3 border border-ink/10">
          <p className="font-body text-[10px] tracking-widest uppercase text-ink-soft mb-1">Recadinho</p>
          <p className="font-body text-sm text-ink italic">"{list.note}"</p>
        </div>
      )}
    </div>
  );
}
