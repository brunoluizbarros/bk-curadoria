import { createHash } from "crypto";
import { db } from "@/db/client";
import { leads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMetaConfig } from "@/server/queries/settings";

function hashPhone(phone: string): string {
  const normalized = phone.replace(/[+\s\-().]/g, "");
  return createHash("sha256").update(normalized).digest("hex");
}

// Constructs fbc from raw fbclid when _fbc cookie isn't available
function buildFbc(fbclid: string): string {
  return `fb.1.${Date.now()}.${fbclid}`;
}

export async function sendPurchaseEvent(leadId: string, valueCents: number): Promise<void> {
  const [config, rows] = await Promise.all([
    getMetaConfig(),
    db.select().from(leads).where(eq(leads.id, leadId)),
  ]);

  const { meta_pixel_id, meta_capi_token } = config;

  if (!meta_pixel_id || !meta_capi_token) {
    console.warn("[MetaCapi] Pixel ID ou token não configurados — evento ignorado");
    return;
  }

  const lead = rows[0];
  if (!lead) {
    console.error(`[MetaCapi] Lead não encontrado: ${leadId}`);
    return;
  }

  const userData: Record<string, unknown> = {
    ph: [hashPhone(lead.phone)],
  };

  if (lead.fbp) userData.fbp = lead.fbp;
  if (lead.fbclid) userData.fbc = buildFbc(lead.fbclid);

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        action_source: "system_generated",
        user_data: userData,
        custom_data: {
          currency: "BRL",
          value: (valueCents / 100).toFixed(2),
        },
      },
    ],
  };

  const url = `https://graph.facebook.com/v19.0/${meta_pixel_id}/events?access_token=${meta_capi_token}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await response.json();

    if (!response.ok) {
      console.error("[MetaCapi] Erro na API:", response.status, JSON.stringify(body));
      return;
    }

    console.log("[MetaCapi] Evento Purchase enviado:", JSON.stringify(body));

    await db
      .update(leads)
      .set({ converted: true, updatedAt: new Date() })
      .where(eq(leads.id, leadId));
  } catch (err) {
    console.error("[MetaCapi] Falha ao enviar evento:", err);
  }
}
