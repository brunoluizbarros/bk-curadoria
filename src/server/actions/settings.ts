"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { paymentFeeConfigs } from "@/db/schema";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado");
}

export async function savePaymentFeeConfigs(data: FormData) {
  await requireAdmin();

  const methods = ["pix", "credit_card", "debit_card", "cash", "transfer"] as const;

  for (const method of methods) {
    const raw = data.get(method);
    const feePercent = raw ? parseFloat(raw as string) : 0;
    if (isNaN(feePercent) || feePercent < 0 || feePercent > 100) continue;

    await db
      .insert(paymentFeeConfigs)
      .values({ method, feePercent, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: paymentFeeConfigs.method,
        set: { feePercent, updatedAt: new Date() },
      });
  }

  revalidatePath("/admin/configuracoes");
}
