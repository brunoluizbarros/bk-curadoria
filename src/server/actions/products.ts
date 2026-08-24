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

  let product: { id: string; slug: string };
  try {
    [product] = await db.insert(products).values(productData).returning();
  } catch (err) {
    const cause = (err as { cause?: { code?: string; constraint_name?: string } })?.cause;
    if (cause?.code === "23505" && cause?.constraint_name === "products_slug_unique") {
      return { error: `O slug "${productData.slug}" já está em uso por outro produto. Escolha um slug diferente.` };
    }
    return { error: "Erro ao salvar produto. Tente novamente." };
  }

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

  try {
    await db
      .update(products)
      .set({ ...productData, updatedAt: new Date() })
      .where(eq(products.id, id));
  } catch (err) {
    const cause = (err as { cause?: { code?: string; constraint_name?: string } })?.cause;
    if (cause?.code === "23505" && cause?.constraint_name === "products_slug_unique") {
      return { error: `O slug "${productData.slug}" já está em uso por outro produto. Escolha um slug diferente.` };
    }
    return { error: "Erro ao salvar produto. Tente novamente." };
  }

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

  // soft delete: mantém a linha (e as fotos) para pedidos antigos continuarem exibindo o produto
  await db.update(products).set({ deletedAt: new Date() }).where(eq(products.id, id));

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
