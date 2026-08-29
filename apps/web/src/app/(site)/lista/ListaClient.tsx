"use client";

import { useWishlistCart } from "@/lib/wishlist-cart";
import { WishlistForm } from "@/components/site/WishlistForm";
import { BackOrHome } from "@/components/site/BackOrHome";
import { formatBRL } from "@/lib/format";
import { IconHeart, IconX } from "@/components/ui/icons";
import { pickFallbackGradient } from "@/lib/gradients";
import Image from "next/image";
import Link from "next/link";

export function ListaClient() {
  const { items, removeItem, clearCart, count } = useWishlistCart();

  return (
    <div className="max-w-[480px] md:max-w-2xl mx-auto px-0 md:px-6 py-6 md:py-10">
      <div className="flex justify-end px-5 md:px-0 mb-4">
        <BackOrHome />
      </div>

      <div className="px-5 md:px-0">
        <h1 className="font-display font-400 text-3xl text-ink mb-1">
          Minha lista de desejos
        </h1>
        <p className="font-body text-sm text-ink-soft mb-6">
          Escolha o que você quer ganhar de presente 💕
        </p>

      {count === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <IconHeart size={40} className="text-ink-soft/40" />
          <p className="font-body text-sm text-ink-soft">Sua lista está vazia.</p>
          <Link
            href="/"
            className="font-body text-xs tracking-[0.2em] uppercase text-terracotta hover:underline"
          >
            Ver produtos
          </Link>
        </div>
      ) : (
        <>
          {/* Produtos na lista */}
          <div className="space-y-3 mb-8">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-cream rounded-card px-3 py-3 border border-ink/10"
              >
                <div
                  className="w-12 h-14 rounded shrink-0 overflow-hidden"
                  style={{ background: item.firstImageUrl ? undefined : item.fallbackGradient ?? pickFallbackGradient(item.id) }}
                >
                  {item.firstImageUrl && (
                    <Image
                      src={item.firstImageUrl}
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
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remover ${item.name} da lista`}
                  className="p-1.5 text-ink-soft hover:text-ink transition-colors"
                >
                  <IconX size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-ink/10 pt-8">
            <WishlistForm items={items} onSubmitSuccess={clearCart} />
          </div>
        </>
      )}
      </div>
    </div>
  );
}
