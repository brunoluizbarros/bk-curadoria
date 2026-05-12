"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { wishlists, wishlistItems } from "@/db/schema";
import { wishlistSubmitSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

function generateToken(length = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export async function submitWishlist(data: unknown) {
  const parsed = wishlistSubmitSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { productIds, ...rest } = parsed.data;

  let token = generateToken();
  // garantir unicidade (colisão improvável mas tratada)
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await db
      .select({ id: wishlists.id })
      .from(wishlists)
      .where(eq(wishlists.token, token));
    if (existing.length === 0) break;
    token = generateToken();
  }

  const [newList] = await db
    .insert(wishlists)
    .values({ ...rest, token, occasion: rest.occasion ?? "namorados" })
    .returning({ id: wishlists.id, token: wishlists.token });

  await db.insert(wishlistItems).values(
    productIds.map((productId) => ({ wishlistId: newList.id, productId }))
  );

  revalidatePath("/admin/wishlists");

  return { id: newList.id, token: newList.token };
}

export async function updateWishlistStatus(id: string, status: string) {
  await requireAdmin();
  await db
    .update(wishlists)
    .set({ status, updatedAt: new Date() })
    .where(eq(wishlists.id, id));
  revalidatePath("/admin/wishlists");
  revalidatePath(`/admin/wishlists/${id}`);
  return { success: true };
}

export async function deleteWishlist(id: string) {
  await requireAdmin();
  await db.delete(wishlists).where(eq(wishlists.id, id));
  revalidatePath("/admin/wishlists");
  return { success: true };
}
