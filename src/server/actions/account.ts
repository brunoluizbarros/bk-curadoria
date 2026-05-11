"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { passwordChangeSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function changePassword(data: unknown) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  const parsed = passwordChangeSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email));

  if (!user) return { error: "Usuário não encontrado" };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { error: "Senha atual incorreta" };

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return { success: true };
}
