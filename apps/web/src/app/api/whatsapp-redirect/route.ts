import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { leads } from "@/db/schema";
import { getMetaConfig } from "@/server/queries/settings";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const fbclid = searchParams.get("fbclid") ?? null;
  const rawPhone = searchParams.get("phone") ?? null;
  const fbp = request.cookies.get("_fbp")?.value ?? null;

  const config = await getMetaConfig();

  if (rawPhone) {
    const phone = rawPhone.replace(/\D/g, "");
    if (phone.length >= 10) {
      try {
        await db.insert(leads).values({ phone, fbclid, fbp });
      } catch (err) {
        console.error("[whatsapp-redirect] falha ao salvar lead:", err);
      }
    }
  }

  const number = config.meta_whatsapp_number;
  const message = config.meta_whatsapp_message || "Olá! Vim pelo anúncio e quero saber mais.";
  const waUrl = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  return NextResponse.redirect(waUrl, { status: 302 });
}
