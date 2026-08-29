"use client";

import { useWishlistCart, WishlistCartItem } from "@/lib/wishlist-cart";
import { IconHeart, IconHeartFilled } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface AddToWishlistButtonProps {
  product: WishlistCartItem;
  className?: string;
  label?: string;
}

export function AddToWishlistButton({ product, className, label }: AddToWishlistButtonProps) {
  const { addItem, removeItem, hasItem } = useWishlistCart();
  const isInList = hasItem(product.id);

  function toggle() {
    if (isInList) {
      removeItem(product.id);
    } else {
      addItem(product);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isInList ? "Remover da lista de desejos" : "Adicionar à lista de desejos"}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-btn",
        "font-body text-xs tracking-[0.2em] uppercase transition-colors",
        isInList
          ? "bg-ink text-cream hover:bg-ink-soft"
          : "bg-cream text-ink hover:bg-cream-soft border border-ink/20",
        className
      )}
    >
      {isInList ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
      {label ?? (isInList ? "Na lista" : "Adicionar à lista")}
    </button>
  );
}
