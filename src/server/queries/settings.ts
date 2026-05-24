import { db } from "@/db/client";
import { paymentFeeConfigs, siteConfig } from "@/db/schema";
import { inArray } from "drizzle-orm";

const METHODS = ["pix", "credit_card", "debit_card", "cash", "transfer"] as const;

export type FeeConfigMap = Record<string, number>;

export async function getPaymentFeeConfigs(): Promise<FeeConfigMap> {
  const rows = await db.select().from(paymentFeeConfigs);
  const map: FeeConfigMap = Object.fromEntries(METHODS.map((m) => [m, 0]));
  for (const row of rows) {
    map[row.method] = row.feePercent;
  }
  return map;
}

const META_KEYS = [
  "meta_pixel_id",
  "meta_capi_token",
  "meta_whatsapp_number",
  "meta_whatsapp_message",
] as const;

export type MetaConfigKey = (typeof META_KEYS)[number];

export type MetaConfig = Record<MetaConfigKey, string>;

export async function getMetaConfig(): Promise<MetaConfig> {
  const rows = await db
    .select()
    .from(siteConfig)
    .where(inArray(siteConfig.key, [...META_KEYS]));

  const config: MetaConfig = {
    meta_pixel_id: "",
    meta_capi_token: "",
    meta_whatsapp_number: "",
    meta_whatsapp_message: "Olá! Vim pelo anúncio e quero saber mais.",
  };

  for (const row of rows) {
    if (row.key in config) config[row.key as MetaConfigKey] = row.value;
  }

  return config;
}

const WA_KEYS = ["wa_api_url", "wa_api_key", "wa_instance", "wa_sender_number"] as const;

export async function getWaApiConfig(): Promise<{
  url: string;
  key: string;
  instance: string;
  senderNumber: string;
}> {
  const rows = await db
    .select()
    .from(siteConfig)
    .where(inArray(siteConfig.key, [...WA_KEYS]));

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    url: map.wa_api_url ?? "",
    key: map.wa_api_key ?? "",
    instance: map.wa_instance ?? "",
    senderNumber: map.wa_sender_number ?? "",
  };
}
