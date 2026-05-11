"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProductCarousel } from "./ProductCarousel";
import { WhatsAppButton } from "./WhatsAppButton";
import { formatBRL } from "@/lib/format";
import { IconX } from "@tabler/icons-react";
import { Product, ProductImage } from "@/db/schema";

interface ProductModalProps {
  product: Product & { images: ProductImage[] };
  phone: string;
}

export function ProductModal({ product, phone }: ProductModalProps) {
  const router = useRouter();

  const close = useCallback(() => router.back(), [router]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [close]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={close}
      />

      {/* Panel */}
      <div className="relative z-10 w-full md:max-w-2xl md:max-h-[90vh] bg-cream rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col animate-slide-up max-h-[95vh]">
        {/* Carousel */}
        <div className="flex-shrink-0">
          <ProductCarousel
            images={product.images}
            fallbackGradient={product.fallbackGradient}
            productName={product.name}
          />
        </div>

        {/* Body — rolável */}
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-24">
          <h2 className="font-display font-400 text-xl text-ink">{product.name}</h2>
          <p className="font-body font-200 text-xs text-ink-soft mt-0.5">{product.color}</p>
          <p className="font-body text-lg text-terracotta mt-1">{formatBRL(product.priceCents)}</p>

          <p className="font-body font-300 text-sm text-ink-soft leading-relaxed mt-4">
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
        </div>

        {/* CTA fixo */}
        <div className="absolute bottom-0 inset-x-0 bg-cream border-t border-ink/10 px-5 py-4">
          <WhatsAppButton
            ctx={{ kind: "product", name: product.name, price: formatBRL(product.priceCents) }}
            phone={phone}
            label="Tenho interesse"
            className="w-full"
          />
        </div>

        {/* Fechar */}
        <button
          onClick={close}
          className="absolute top-4 right-4 z-20 w-8 h-8 bg-ink/60 rounded-full flex items-center justify-center text-cream hover:bg-ink transition-colors"
          aria-label="Fechar"
        >
          <IconX size={16} />
        </button>
      </div>
    </div>
  );
}
