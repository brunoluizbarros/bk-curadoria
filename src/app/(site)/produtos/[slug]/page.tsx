import { getProductBySlug } from "@/server/queries/products";
import { getSiteConfig } from "@/server/queries/site-config";
import { ProductCarousel } from "@/components/site/ProductCarousel";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { ShareButton } from "@/components/site/ShareButton";
import { BackOrHome } from "@/components/site/BackOrHome";
import { formatBRL } from "@/lib/format";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bkcuradoria.com.br";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const ogImageUrl = `${BASE}/produtos/${slug}/opengraph-image`;
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [ogImageUrl] },
  };
}

export default async function ProdutoPage({ params }: Props) {
  const { slug } = await params;
  const [product, config] = await Promise.all([
    getProductBySlug(slug),
    getSiteConfig(),
  ]);

  if (!product) notFound();

  const phone = config.whatsapp_number ?? "5581999999999";

  return (
    <div className="max-w-[480px] md:max-w-2xl lg:max-w-4xl mx-auto px-0 md:px-6 py-6 md:py-10">

      {/* topo: botão contextual */}
      <div className="flex justify-end px-5 md:px-0 mb-4">
        <BackOrHome />
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-10 lg:gap-16">

        {/* carrossel */}
        <ProductCarousel
          images={product.images}
          fallbackGradient={product.fallbackGradient}
          productName={product.name}
        />

        {/* info */}
        <div className="px-5 md:px-0 pt-6 md:pt-0 pb-24 md:pb-8 flex flex-col">
          <h1 className="font-display font-400 text-2xl md:text-3xl text-ink leading-tight">
            {product.name}
          </h1>
          <p className="font-body font-200 text-xs text-ink-soft mt-1">{product.color}</p>
          <p className="font-body text-xl text-terracotta mt-2">{formatBRL(product.priceCents)}</p>

          {product.tag && (
            <span className="mt-3 self-start font-body text-[10px] tracking-widest uppercase bg-gold/20 text-gold-soft px-2 py-0.5">
              {product.tag}
            </span>
          )}

          <p className="font-body font-300 text-sm text-ink-soft leading-relaxed mt-5">
            {product.description}
          </p>

          {(product.composition || product.origin) && (
            <div className="mt-5 space-y-2 border-t border-ink/10 pt-4">
              {product.composition && (
                <div className="flex justify-between gap-4">
                  <span className="font-body text-[10px] tracking-widest uppercase text-ink-soft">Composição</span>
                  <span className="font-body text-xs text-ink text-right">{product.composition}</span>
                </div>
              )}
              {product.origin && (
                <div className="flex justify-between gap-4">
                  <span className="font-body text-[10px] tracking-widest uppercase text-ink-soft">Origem</span>
                  <span className="font-body text-xs text-ink text-right">{product.origin}</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-auto pt-8 md:pt-6 space-y-4">
            <WhatsAppButton
              ctx={{ kind: "product", name: product.name, price: formatBRL(product.priceCents) }}
              phone={phone}
              label="Tenho interesse"
              className="w-full"
            />
            <div className="flex justify-center pt-1">
              <ShareButton
                url={`${BASE}/produtos/${product.slug}`}
                title={product.name}
                text={`${product.name} — BK Curadoria`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
