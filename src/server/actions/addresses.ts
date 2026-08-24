"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { addresses } from "@/db/schema";
import { addressSchema } from "@/lib/validations";
import { lookupCep } from "@/lib/viacep";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

export async function lookupCepAction(cep: string) {
  return lookupCep(cep);
}

export async function createAddress(customerId: string, data: unknown) {
  await requireAdmin();
  const parsed = addressSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  if (parsed.data.isDefault) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.customerId, customerId));
  }

  const [row] = await db
    .insert(addresses)
    .values({ ...parsed.data, customerId })
    .returning({ id: addresses.id });

  revalidatePath(`/admin/clientes/${customerId}`);
  return { id: row.id };
}

export async function updateAddress(id: string, customerId: string, data: unknown) {
  await requireAdmin();
  const parsed = addressSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  if (parsed.data.isDefault) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(and(eq(addresses.customerId, customerId), eq(addresses.isDefault, true)));
  }

  await db
    .update(addresses)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(addresses.id, id));

  revalidatePath(`/admin/clientes/${customerId}`);
  return { success: true };
}

export async function deleteAddress(id: string, customerId: string) {
  await requireAdmin();
  await db.update(addresses).set({ deletedAt: new Date() }).where(eq(addresses.id, id));
  revalidatePath(`/admin/clientes/${customerId}`);
  return { success: true };
}

export async function setDefaultAddress(id: string, customerId: string) {
  await requireAdmin();
  await db
    .update(addresses)
    .set({ isDefault: false })
    .where(eq(addresses.customerId, customerId));
  await db
    .update(addresses)
    .set({ isDefault: true })
    .where(eq(addresses.id, id));
  revalidatePath(`/admin/clientes/${customerId}`);
  return { success: true };
}
