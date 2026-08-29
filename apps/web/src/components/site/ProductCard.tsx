"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product, ProductImage } from "@/db/schema";
import { formatBRL } from "@/lib/format";

interface ProductCardProps {
  product: Product;
  firstImage: ProductImage | null;
}

export function ProductCard({ product, firstImage }: ProductCardProps) {
  const [broken, setBroken] = useState(false);

  // imagem quebrada (URL não carrega) = mesmo tratamento de "sem foto": não exibe o produto
  if (!firstImage || broken) return null;

  return (
    <article>
    <Link href={`/produtos/${product.slug}`} className="block group">
      <div
        className="relative w-full rounded-card overflow-hidden mb-3"
        style={{ aspectRatio: "3/4" }}
      >
        <Image
          src={firstImage.url}
          alt={firstImage.alt ?? product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-103"
          sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 48vw"
          quality={85}
          onError={() => setBroken(true)}
        />

        {product.tag && (
          <span className="absolute top-3 left-3 bg-ink/70 text-cream text-[9px] tracking-widest uppercase px-2 py-1 rounded-sm">
            {product.tag}
          </span>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="font-display font-400 text-base text-ink leading-tight">{product.name}</p>
        <p className="font-body font-200 text-xs text-ink-soft mt-0.5">{product.color}</p>
        <p className="font-body text-sm text-terracotta mt-1">{formatBRL(product.priceCents)}</p>
      </div>
    </Link>
    </article>
  );
}
