import { db } from "@/db/client";
import {
  products,
  productImages,
  productCategories,
  categories,
} from "@/db/schema";
import { and, asc, count, desc, eq, ilike, inArray, isNull } from "drizzle-orm";

export type ProductAdminSort = "name" | "created" | "order";
export type SortDir = "asc" | "desc";

export async function getActiveProducts(categorySlug?: string) {
  let productIds: string[] | undefined;

  if (categorySlug && categorySlug !== "all") {
    const [cat] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, categorySlug));

    if (cat) {
      const links = await db
        .select({ productId: productCategories.productId })
        .from(productCategories)
        .where(eq(productCategories.categoryId, cat.id));
      productIds = links.map((l) => l.productId);
      if (productIds.length === 0) return [];
    }
  }

  const where = productIds
    ? and(eq(products.active, true), isNull(products.deletedAt), inArray(products.id, productIds))
    : and(eq(products.active, true), isNull(products.deletedAt));

  const rows = await db
    .select()
    .from(products)
    .where(where)
    .orderBy(asc(products.sortOrder), asc(products.createdAt));

  // Busca primeira imagem de cada produto
  const allImages = await db
    .select()
    .from(productImages)
    .orderBy(asc(productImages.sortOrder));

  return rows
    .map((p) => ({
      ...p,
      firstImage: allImages.find((img) => img.productId === p.id) ?? null,
    }))
    .filter((p) => p.firstImage !== null);
}

export async function getProductBySlug(slug: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.active, true), isNull(products.deletedAt)));

  if (!product) return null;

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.sortOrder));

  const catLinks = await db
    .select({ category: categories })
    .from(productCategories)
    .innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(eq(productCategories.productId, product.id));

  return {
    ...product,
    images,
    categories: catLinks.map((l) => l.category),
  };
}

export async function getAllProductsAdmin() {
  const rows = await db
    .select()
    .from(products)
    .where(isNull(products.deletedAt))
    .orderBy(asc(products.sortOrder), asc(products.createdAt));

  const [images, catLinks] = await Promise.all([
    db.select().from(productImages).orderBy(asc(productImages.sortOrder)),
    db
      .select({ productId: productCategories.productId, label: categories.label })
      .from(productCategories)
      .innerJoin(categories, eq(productCategories.categoryId, categories.id)),
  ]);

  return rows.map((p) => ({
    ...p,
    firstImage: images.find((img) => img.productId === p.id) ?? null,
    categoryLabels: catLinks.filter((c) => c.productId === p.id).map((c) => c.label),
  }));
}

export async function getProductsAdminPaginated(
  page: number,
  limit: number,
  filters?: { search?: string; categoryId?: string; sort?: ProductAdminSort; dir?: SortDir }
) {
  const offset = (page - 1) * limit;

  const conditions = [isNull(products.deletedAt)];
  if (filters?.search) conditions.push(ilike(products.name, `%${filters.search}%`));

  if (filters?.categoryId) {
    const links = await db
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(eq(productCategories.categoryId, filters.categoryId));
    const ids = links.map((l) => l.productId);
    if (ids.length === 0) return { items: [], total: 0 };
    conditions.push(inArray(products.id, ids));
  }

  const where = and(...conditions);
  const dir = filters?.dir === "desc" ? desc : asc;
  const orderColumn =
    filters?.sort === "name" ? products.name
    : filters?.sort === "created" ? products.createdAt
    : products.sortOrder;

  const [[countRow], rows] = await Promise.all([
    db.select({ total: count() }).from(products).where(where),
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(dir(orderColumn), asc(products.id))
      .limit(limit)
      .offset(offset),
  ]);

  const productIds = rows.map((p) => p.id);

  if (!productIds.length) return { items: [], total: countRow.total };

  const [images, catLinks] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, productIds))
      .orderBy(asc(productImages.sortOrder)),
    db
      .select({ productId: productCategories.productId, label: categories.label })
      .from(productCategories)
      .innerJoin(categories, eq(productCategories.categoryId, categories.id))
      .where(inArray(productCategories.productId, productIds)),
  ]);

  return {
    items: rows.map((p) => ({
      ...p,
      firstImage: images.find((img) => img.productId === p.id) ?? null,
      categoryLabels: catLinks.filter((c) => c.productId === p.id).map((c) => c.label),
    })),
    total: countRow.total,
  };
}

export async function getProductByIdAdmin(id: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id));

  if (!product) return null;

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, id))
    .orderBy(asc(productImages.sortOrder));

  const catLinks = await db
    .select({ categoryId: productCategories.categoryId })
    .from(productCategories)
    .where(eq(productCategories.productId, id));

  return {
    ...product,
    images,
    categoryIds: catLinks.map((l) => l.categoryId),
  };
}
