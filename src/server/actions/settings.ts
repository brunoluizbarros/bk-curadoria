"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { paymentFeeConfigs, siteConfig } from "@/db/schema";
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

export async function saveWaApiConfig(data: FormData) {
  await requireAdmin();

  const entries: Record<string, string> = {
    wa_api_url: (data.get("wa_api_url") as string | null) ?? "",
    wa_api_key: (data.get("wa_api_key") as string | null) ?? "",
    wa_instance: (data.get("wa_instance") as string | null) ?? "",
    wa_sender_number: (data.get("wa_sender_number") as string | null) ?? "",
  };

  for (const [key, value] of Object.entries(entries)) {
    await db
      .insert(siteConfig)
      .values({ key, value })
      .onConflictDoUpdate({ target: siteConfig.key, set: { value, updatedAt: new Date() } });
  }

  revalidatePath("/admin/configuracoes");
}

export async function saveMetaConfig(data: FormData) {
  await requireAdmin();

  const keys = [
    "meta_pixel_id",
    "meta_capi_token",
    "meta_whatsapp_number",
    "meta_whatsapp_message",
  ] as const;

  for (const key of keys) {
    const value = (data.get(key) as string | null) ?? "";
    await db
      .insert(siteConfig)
      .values({ key, value })
      .onConflictDoUpdate({ target: siteConfig.key, set: { value, updatedAt: new Date() } });
  }

  revalidatePath("/admin/configuracoes");
}
