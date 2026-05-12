import { db } from "@/db/client";
import { wishlists, wishlistItems, products, productImages } from "@/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";

export async function getWishlistByToken(token: string) {
  const [list] = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.token, token));

  if (!list) return null;

  const items = await db
    .select({ product: products })
    .from(wishlistItems)
    .innerJoin(products, eq(wishlistItems.productId, products.id))
    .where(eq(wishlistItems.wishlistId, list.id));

  const productIds = items.map((i) => i.product.id);
  const allImages = productIds.length
    ? await db
        .select()
        .from(productImages)
        .where(and(...productIds.map((pid) => eq(productImages.productId, pid))))
        .orderBy(asc(productImages.sortOrder))
    : [];

  return {
    ...list,
    items: items.map((i) => ({
      ...i.product,
      firstImage: allImages.find((img) => img.productId === i.product.id) ?? null,
    })),
  };
}

export async function getAllWishlistsAdmin() {
  const rows = await db
    .select()
    .from(wishlists)
    .orderBy(desc(wishlists.createdAt));

  const itemCounts = await db
    .select({ wishlistId: wishlistItems.wishlistId })
    .from(wishlistItems);

  return rows.map((w) => ({
    ...w,
    itemCount: itemCounts.filter((c) => c.wishlistId === w.id).length,
  }));
}

export async function getWishlistByIdAdmin(id: string) {
  const [list] = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.id, id));

  if (!list) return null;

  const items = await db
    .select({ product: products })
    .from(wishlistItems)
    .innerJoin(products, eq(wishlistItems.productId, products.id))
    .where(eq(wishlistItems.wishlistId, id));

  const productIds = items.map((i) => i.product.id);
  const allImages = productIds.length
    ? await db
        .select()
        .from(productImages)
        .where(and(...productIds.map((pid) => eq(productImages.productId, pid))))
        .orderBy(asc(productImages.sortOrder))
    : [];

  return {
    ...list,
    items: items.map((i) => ({
      ...i.product,
      firstImage: allImages.find((img) => img.productId === i.product.id) ?? null,
    })),
  };
}
