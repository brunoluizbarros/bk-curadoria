"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { cardMachines } from "@/db/schema";
import { cardMachineSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

export async function createCardMachine(data: unknown) {
  await requireAdmin();
  const parsed = cardMachineSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const [row] = await db
    .insert(cardMachines)
    .values(parsed.data)
    .returning({ id: cardMachines.id });

  revalidatePath("/admin/maquininhas");
  return { id: row.id };
}

export async function updateCardMachine(id: string, data: unknown) {
  await requireAdmin();
  const parsed = cardMachineSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  await db.update(cardMachines).set(parsed.data).where(eq(cardMachines.id, id));

  revalidatePath("/admin/maquininhas");
  return { success: true };
}

export async function deleteCardMachine(id: string) {
  await requireAdmin();
  try {
    await db.delete(cardMachines).where(eq(cardMachines.id, id));
    revalidatePath("/admin/maquininhas");
    return { success: true };
  } catch {
    return { error: "Maquininha possui recebimentos e não pode ser removida." };
  }
}

export async function setDefaultCardMachine(id: string) {
  await requireAdmin();
  await db.transaction(async (tx) => {
    await tx.update(cardMachines).set({ isDefault: false });
    await tx.update(cardMachines).set({ isDefault: true }).where(eq(cardMachines.id, id));
  });
  revalidatePath("/admin/maquininhas");
  return { success: true };
}
