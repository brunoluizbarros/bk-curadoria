"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { customers } from "@/db/schema";
import { customerSchema } from "@/lib/validations";
import { searchCustomers, getCustomerById } from "@/server/queries/customers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

export async function createCustomer(data: unknown) {
  await requireAdmin();
  const parsed = customerSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const [row] = await db
    .insert(customers)
    .values({
      ...parsed.data,
      email: parsed.data.email || null,
      document: parsed.data.document || null,
    })
    .returning({ id: customers.id });

  revalidatePath("/admin/clientes");
  return { id: row.id };
}

export async function updateCustomer(id: string, data: unknown) {
  await requireAdmin();
  const parsed = customerSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  await db
    .update(customers)
    .set({ ...parsed.data, email: parsed.data.email || null, updatedAt: new Date() })
    .where(eq(customers.id, id));

  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${id}`);
  return { success: true };
}

export async function deleteCustomer(id: string) {
  await requireAdmin();
  await db.update(customers).set({ deletedAt: new Date() }).where(eq(customers.id, id));
  revalidatePath("/admin/clientes");
  return { success: true };
}

export async function searchCustomersAction(q: string) {
  await requireAdmin();
  return searchCustomers(q);
}

export async function getCustomerByIdAction(id: string) {
  await requireAdmin();
  return getCustomerById(id);
}
