"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { ProductImage } from "@/db/schema";

interface ProductCarouselProps {
  images: ProductImage[];
  fallbackGradient?: string | null;
  productName: string;
}

export function ProductCarousel({ images, fallbackGradient, productName }: ProductCarouselProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const total = images.length;
  const hasPrev = current > 0;
  const hasNext = current < total - 1;

  const go = useCallback((idx: number) => setCurrent(idx), []);
  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent((c) => Math.min(total - 1, c + 1)), [total]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  }

  return (
    <div className="relative select-none" style={{ aspectRatio: "3/4" }}>
      {/* Slides */}
      <div
        className="relative w-full h-full overflow-hidden rounded-t-card"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {total === 0 ? (
          <div
            className="w-full h-full"
            style={{ background: fallbackGradient ?? "linear-gradient(135deg,#6A7256,#4F5841)" }}
          />
        ) : (
          <div
            className="flex h-full transition-transform duration-400 ease-in-out"
            style={{ transform: `translateX(-${current * 100}%)`, width: `${total * 100}%` }}
          >
            {images.map((img) => (
              <div key={img.id} className="relative h-full" style={{ width: `${100 / total}%` }}>
                <Image
                  src={img.url}
                  alt={img.alt ?? productName}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 50vw, 100vw"
                  priority
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Setas */}
      {hasPrev && (
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-cream/80 rounded-full flex items-center justify-center text-ink hover:bg-cream transition-colors"
          aria-label="Imagem anterior"
        >
          <IconChevronLeft size={16} />
        </button>
      )}
      {hasNext && (
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-cream/80 rounded-full flex items-center justify-center text-ink hover:bg-cream transition-colors"
          aria-label="Próxima imagem"
        >
          <IconChevronRight size={16} />
        </button>
      )}

      {/* Indicadores */}
      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => go(idx)}
              aria-label={`Imagem ${idx + 1}`}
              className={cn(
                "h-0.5 rounded-full transition-all duration-300",
                idx === current ? "w-8 bg-cream" : "w-4 bg-cream/40"
              )}
            />
          ))}
        </div>
      )}

      {/* Contador */}
      {total > 1 && (
        <div className="absolute top-3 right-3 bg-ink/60 text-cream text-[10px] px-2 py-0.5 rounded-sm">
          {current + 1} / {total}
        </div>
      )}
    </div>
  );
}
