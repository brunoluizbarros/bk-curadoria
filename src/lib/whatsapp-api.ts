export interface WaApiConfig {
  url: string;
  key: string;
  instance: string;
}

export function isWaConfigured(config: WaApiConfig): boolean {
  return !!(config.url && config.key && config.instance);
}

// Compatible with Evolution API v2
// POST {url}/message/sendText/{instance}
// Header: apikey: {key}
export async function sendWhatsAppText(
  phone: string,
  message: string,
  config: WaApiConfig
): Promise<void> {
  if (!isWaConfigured(config)) {
    console.warn("[WA] API não configurada — mensagem ignorada");
    return;
  }

  const cleanPhone = phone.replace(/\D/g, "");
  const endpoint = `${config.url.replace(/\/$/, "")}/message/sendText/${config.instance}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.key,
    },
    body: JSON.stringify({ number: cleanPhone, text: message }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[WA] ${res.status} — ${body}`);
  }
}
