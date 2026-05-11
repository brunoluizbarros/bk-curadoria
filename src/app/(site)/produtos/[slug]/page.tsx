import { getProductBySlug } from "@/server/queries/products";
import { getSiteConfig } from "@/server/queries/site-config";
import { ProductCarousel } from "@/components/site/ProductCarousel";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { ShareButton } from "@/components/site/ShareButton";
import { formatBRL } from "@/lib/format";
import { notFound } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
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
    twitter: {
      card: "summary_large_image",
      images: [ogImageUrl],
    },
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
    <div className="max-w-[480px] md:max-w-2xl mx-auto">
      <div className="md:grid md:grid-cols-2 md:gap-8">
        <div>
          <ProductCarousel
            images={product.images}
            fallbackGradient={product.fallbackGradient}
            productName={product.name}
          />
        </div>

        <div className="px-5 md:px-0 pt-5 md:pt-8 pb-24 md:pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-body text-[10px] tracking-widest uppercase text-ink-soft hover:text-ink mb-6"
          >
            <IconArrowLeft size={12} />
            Voltar
          </Link>

          <h1 className="font-display font-400 text-2xl text-ink">{product.name}</h1>
          <p className="font-body font-200 text-xs text-ink-soft mt-0.5">{product.color}</p>
          <p className="font-body text-xl text-terracotta mt-2">{formatBRL(product.priceCents)}</p>

          <p className="font-body font-300 text-sm text-ink-soft leading-relaxed mt-5">
            {product.description}
          </p>

          <div className="mt-5 space-y-2 border-t border-ink/10 pt-4">
            {product.composition && (
              <div className="flex justify-between">
                <span className="font-body text-[10px] tracking-widest uppercase text-ink-soft">Composição</span>
                <span className="font-body text-xs text-ink">{product.composition}</span>
              </div>
            )}
            {product.origin && (
              <div className="flex justify-between">
                <span className="font-body text-[10px] tracking-widest uppercase text-ink-soft">Origem</span>
                <span className="font-body text-xs text-ink">{product.origin}</span>
              </div>
            )}
          </div>

          <blockquote className="mt-5 border-l-2 border-gold pl-3">
            <p className="font-display italic text-sm text-ink-soft">
              &ldquo;Cada peça que entra na BK passou por um processo rigoroso de seleção.&rdquo;
            </p>
          </blockquote>

          <div className="mt-8 md:mt-6 space-y-4">
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
