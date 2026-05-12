"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react";
import { ProductImage } from "@/db/schema";

interface ProductCarouselProps {
  images: ProductImage[];
  fallbackGradient?: string | null;
  productName: string;
  className?: string;
}

export function ProductCarousel({ images, fallbackGradient, productName, className }: ProductCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const lbTouchStartX = useRef<number | null>(null);

  const total = images.length;
  const hasPrev = current > 0;
  const hasNext = current < total - 1;

  const go = useCallback((idx: number) => setCurrent(idx), []);
  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent((c) => Math.min(total - 1, c + 1)), [total]);

  // Teclado: ESC fecha, setas navegam
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, prev, next]);

  // Scroll lock no lightbox
  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    touchStartX.current = null;
  }

  function onLbTouchStart(e: React.TouchEvent) {
    lbTouchStartX.current = e.touches[0].clientX;
  }
  function onLbTouchEnd(e: React.TouchEvent) {
    if (lbTouchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - lbTouchStartX.current;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    lbTouchStartX.current = null;
  }

  return (
    <>
      {/* Carrossel inline */}
      <div className={cn("relative select-none", className)} style={className ? undefined : { aspectRatio: "3/4" }}>
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
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => { go(idx); setLightbox(true); }}
                  className="relative h-full cursor-zoom-in focus-visible:outline-none"
                  style={{ width: `${100 / total}%` }}
                  aria-label={`Ver imagem ${idx + 1} em tela cheia`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt ?? productName}
                    fill
                    className="object-contain bg-cream-soft"
                    sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
                    priority={idx === 0}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {hasPrev && (
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-cream/80 rounded-full flex items-center justify-center text-ink hover:bg-cream transition-colors" aria-label="Imagem anterior">
            <IconChevronLeft size={16} />
          </button>
        )}
        {hasNext && (
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-cream/80 rounded-full flex items-center justify-center text-ink hover:bg-cream transition-colors" aria-label="Próxima imagem">
            <IconChevronRight size={16} />
          </button>
        )}

        {total > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button key={idx} onClick={() => go(idx)} aria-label={`Imagem ${idx + 1}`}
                className={cn("h-0.5 rounded-full transition-all duration-300", idx === current ? "w-8 bg-cream" : "w-4 bg-cream/40")}
              />
            ))}
          </div>
        )}

        {total > 1 && (
          <div className="absolute top-3 right-3 bg-ink/60 text-cream text-[10px] px-2 py-0.5 rounded-sm">
            {current + 1} / {total}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && total > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-ink/95 flex items-center justify-center"
          onTouchStart={onLbTouchStart}
          onTouchEnd={onLbTouchEnd}
        >
          {/* Fechar ao clicar no fundo */}
          <div className="absolute inset-0" onClick={() => setLightbox(false)} aria-hidden="true" />

          {/* Imagem */}
          <div className="relative w-full h-full max-w-3xl max-h-[90dvh] mx-auto px-12 flex items-center justify-center pointer-events-none">
            <Image
              src={images[current].url}
              alt={images[current].alt ?? productName}
              fill
              className="object-contain pointer-events-none"
              sizes="100vw"
              quality={95}
            />
          </div>

          {/* Botão fechar */}
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 z-10 w-9 h-9 bg-cream/10 hover:bg-cream/20 rounded-full flex items-center justify-center text-cream transition-colors"
            aria-label="Fechar"
          >
            <IconX size={18} />
          </button>

          {/* Navegação */}
          {hasPrev && (
            <button onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-cream/10 hover:bg-cream/20 rounded-full flex items-center justify-center text-cream transition-colors"
              aria-label="Imagem anterior"
            >
              <IconChevronLeft size={20} />
            </button>
          )}
          {hasNext && (
            <button onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-cream/10 hover:bg-cream/20 rounded-full flex items-center justify-center text-cream transition-colors"
              aria-label="Próxima imagem"
            >
              <IconChevronRight size={20} />
            </button>
          )}

          {/* Contador + miniaturas */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">
            <div className="flex gap-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={(e) => { e.stopPropagation(); go(idx); }}
                  className={cn(
                    "w-10 h-10 rounded overflow-hidden border-2 transition-all",
                    idx === current ? "border-cream scale-110" : "border-cream/30 hover:border-cream/60"
                  )}
                  aria-label={`Ir para imagem ${idx + 1}`}
                >
                  <Image src={img.url} alt="" width={40} height={40} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <span className="text-cream/50 text-[11px] font-body">{current + 1} / {total}</span>
          </div>
        </div>
      )}
    </>
  );
}
