"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import {
  products,
  productImages,
  productCategories,
} from "@/db/schema";
import { productSchema } from "@/lib/validations";
import { publicUrl, s3, BUCKET } from "@/lib/upload";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { unlink } from "fs/promises";
import { join } from "path";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

async function deleteStorageObject(storageKey: string) {
  if (s3) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: storageKey })).catch(() => null);
  } else {
    // desenvolvimento: remove arquivo local
    await unlink(join(process.cwd(), "public", "uploads", storageKey)).catch(() => null);
  }
}

export async function createProduct(data: unknown) {
  await requireAdmin();
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { categoryIds, ...productData } = parsed.data;

  const [product] = await db.insert(products).values(productData).returning();

  if (categoryIds.length > 0) {
    await db.insert(productCategories).values(
      categoryIds.map((categoryId) => ({ productId: product.id, categoryId }))
    );
  }

  revalidatePath("/");
  revalidatePath(`/produtos/${product.slug}`);
  return { id: product.id };
}

export async function updateProduct(id: string, data: unknown) {
  await requireAdmin();
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { categoryIds, ...productData } = parsed.data;

  await db
    .update(products)
    .set({ ...productData, updatedAt: new Date() })
    .where(eq(products.id, id));

  await db.delete(productCategories).where(eq(productCategories.productId, id));

  if (categoryIds.length > 0) {
    await db.insert(productCategories).values(
      categoryIds.map((categoryId) => ({ productId: id, categoryId }))
    );
  }

  const [p] = await db.select({ slug: products.slug }).from(products).where(eq(products.id, id));
  revalidatePath("/");
  revalidatePath(`/produtos/${p?.slug}`);
  return { success: true };
}

export async function deleteProduct(id: string) {
  await requireAdmin();

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, id));

  await Promise.all(images.map((img) => deleteStorageObject(img.storageKey)));

  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/");
  revalidatePath("/admin/products");
  return { success: true };
}

export async function addProductImage(data: {
  productId: string;
  storageKey: string;
  width?: number;
  height?: number;
  alt?: string;
}) {
  await requireAdmin();

  const existing = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, data.productId))
    .orderBy(asc(productImages.sortOrder));

  const sortOrder = existing.length;
  const url = publicUrl(data.storageKey);

  await db.insert(productImages).values({
    ...data,
    url,
    sortOrder,
  });

  const [p] = await db.select({ slug: products.slug }).from(products).where(eq(products.id, data.productId));
  revalidatePath("/");
  if (p) revalidatePath(`/produtos/${p.slug}`);
  return { success: true };
}

export async function removeProductImage(imageId: string) {
  await requireAdmin();

  const [img] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.id, imageId));

  if (!img) return { error: "Imagem não encontrada" };

  await deleteStorageObject(img.storageKey);
  await db.delete(productImages).where(eq(productImages.id, imageId));

  const [p] = await db.select({ slug: products.slug }).from(products).where(eq(products.id, img.productId));
  if (p) revalidatePath(`/produtos/${p.slug}`);
  revalidatePath("/");
  return { success: true };
}
