import { db } from "@/db/client";
import { wishlists, wishlistItems, products, productImages } from "@/db/schema";
import { and, asc, count, desc, eq, inArray, isNull } from "drizzle-orm";

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
    .where(and(eq(wishlistItems.wishlistId, list.id), isNull(products.deletedAt)));

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

export async function getAllWishlistsAdmin(pagination?: { page: number; limit: number }) {
  const limit = pagination?.limit ?? 1000;
  const offset = pagination ? (pagination.page - 1) * pagination.limit : 0;

  const [[countRow], rows] = await Promise.all([
    db.select({ total: count() }).from(wishlists),
    db
      .select()
      .from(wishlists)
      .orderBy(desc(wishlists.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  if (!rows.length) return { items: [], total: countRow.total };

  const wishlistIds = rows.map((w) => w.id);
  const itemCounts = await db
    .select({ wishlistId: wishlistItems.wishlistId })
    .from(wishlistItems)
    .where(inArray(wishlistItems.wishlistId, wishlistIds));

  return {
    items: rows.map((w) => ({
      ...w,
      itemCount: itemCounts.filter((c) => c.wishlistId === w.id).length,
    })),
    total: countRow.total,
  };
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
    .where(and(eq(wishlistItems.wishlistId, id), isNull(products.deletedAt)));

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
