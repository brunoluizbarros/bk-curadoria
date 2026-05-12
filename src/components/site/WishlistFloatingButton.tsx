"use client";

import { useWishlistCart } from "@/lib/wishlist-cart";
import { IconHeart } from "@/components/ui/icons";
import Link from "next/link";

export function WishlistFloatingButton() {
  const { count } = useWishlistCart();

  if (count === 0) return null;

  return (
    <Link
      href="/lista"
      aria-label={`Minha lista de desejos — ${count} ${count === 1 ? "item" : "itens"}`}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-terracotta text-cream shadow-lg px-4 py-2.5 rounded-full font-body text-xs tracking-[0.15em] uppercase hover:bg-terracotta-soft transition-colors"
    >
      <IconHeart size={16} />
      <span>Lista</span>
      <span className="bg-cream text-terracotta rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-body leading-none">
        {count}
      </span>
    </Link>
  );
}
