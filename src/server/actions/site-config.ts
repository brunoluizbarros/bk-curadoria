"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { siteConfig, homeDifferentials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

export async function updateSiteConfig(data: Record<string, string>) {
  await requireAdmin();

  await Promise.all(
    Object.entries(data).map(([key, value]) =>
      db
        .insert(siteConfig)
        .values({ key, value })
        .onConflictDoUpdate({ target: siteConfig.key, set: { value, updatedAt: new Date() } })
    )
  );

  revalidatePath("/");
  revalidatePath("/curadoria");
  return { success: true };
}

export async function upsertDifferential(data: {
  id?: string;
  iconName: string;
  title: string;
  description: string;
  sortOrder: number;
}) {
  await requireAdmin();

  if (data.id) {
    await db
      .update(homeDifferentials)
      .set({ iconName: data.iconName, title: data.title, description: data.description, sortOrder: data.sortOrder })
      .where(eq(homeDifferentials.id, data.id));
  } else {
    await db.insert(homeDifferentials).values({
      iconName: data.iconName,
      title: data.title,
      description: data.description,
      sortOrder: data.sortOrder,
    });
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteDifferential(id: string) {
  await requireAdmin();
  await db.delete(homeDifferentials).where(eq(homeDifferentials.id, id));
  revalidatePath("/");
  return { success: true };
}
