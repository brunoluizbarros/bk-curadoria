"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { services, serviceSteps } from "@/db/schema";
import { serviceSchema, serviceStepSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

export async function updateService(slug: string, data: unknown) {
  await requireAdmin();
  const parsed = serviceSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  await db.update(services).set(parsed.data).where(eq(services.slug, slug));
  revalidatePath("/");
  revalidatePath(`/servicos/${slug}`);
  return { success: true };
}

export async function upsertServiceStep(slug: string, data: { id?: string; title: string; description: string; sortOrder: number }) {
  await requireAdmin();
  const d = data;
  const parsed = serviceStepSchema.safeParse(d);
  if (!parsed.success) return { error: parsed.error.flatten() };

  if (d.id) {
    await db.update(serviceSteps).set(parsed.data).where(eq(serviceSteps.id, d.id));
  } else {
    await db.insert(serviceSteps).values({ ...parsed.data, serviceSlug: slug });
  }

  revalidatePath(`/servicos/${slug}`);
  return { success: true };
}

export async function deleteServiceStep(id: string, slug: string) {
  await requireAdmin();
  await db.delete(serviceSteps).where(eq(serviceSteps.id, id));
  revalidatePath(`/servicos/${slug}`);
  return { success: true };
}
