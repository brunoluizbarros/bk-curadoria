"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "bk_wishlist";
const CART_EVENT = "bk_wishlist_change";

export interface WishlistCartItem {
  id: string;
  name: string;
  priceCents: number;
  slug: string;
  firstImageUrl: string | null;
  fallbackGradient: string | null;
}

function readStorage(): WishlistCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WishlistCartItem[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: WishlistCartItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function useWishlistCart() {
  const [items, setItems] = useState<WishlistCartItem[]>([]);

  useEffect(() => {
    setItems(readStorage());
    const handler = () => setItems(readStorage());
    window.addEventListener(CART_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CART_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const addItem = useCallback((item: WishlistCartItem) => {
    const current = readStorage();
    if (current.some((i) => i.id === item.id)) return;
    const next = [...current, item];
    writeStorage(next);
    setItems(next);
  }, []);

  const removeItem = useCallback((id: string) => {
    const next = readStorage().filter((i) => i.id !== id);
    writeStorage(next);
    setItems(next);
  }, []);

  const clearCart = useCallback(() => {
    writeStorage([]);
    setItems([]);
  }, []);

  const hasItem = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  );

  return { items, addItem, removeItem, clearCart, hasItem, count: items.length };
}
