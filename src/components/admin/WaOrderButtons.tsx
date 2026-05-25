"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendOrderWhatsApp } from "@/server/actions/orders";
import { IconSend, IconMessageCircle, IconCircleCheck } from "@/components/ui/icons";

interface Props {
  orderId: string;
}

export function WaOrderButtons({ orderId }: Props) {
  const [paymentLink, setPaymentLink] = useState("");
  const [, startTransition] = useTransition();

  function send(type: Parameters<typeof sendOrderWhatsApp>[1], extra?: Record<string, string>) {
    startTransition(async () => {
      try {
        await sendOrderWhatsApp(orderId, type, extra);
        toast.success("Mensagem enviada via WhatsApp");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao enviar mensagem");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => send("malinha_enviada")}
        className="inline-flex items-center gap-1.5 font-body text-xs px-3 py-1.5 rounded-btn border border-sage/40 text-sage-deep hover:bg-sage/10 transition-colors"
      >
        <IconSend size={12} />
        Malinha enviada
      </button>

      <button
        type="button"
        onClick={() => send("itens_confirmados")}
        className="inline-flex items-center gap-1.5 font-body text-xs px-3 py-1.5 rounded-btn border border-gold/40 text-gold hover:bg-gold/10 transition-colors"
      >
        <IconMessageCircle size={12} />
        Itens confirmados
      </button>

      <div className="flex items-center gap-1.5">
        <input
          value={paymentLink}
          onChange={(e) => setPaymentLink(e.target.value)}
          type="url"
          placeholder="Link de pagamento (URL)"
          className="border border-ink/20 bg-cream rounded px-2 py-1 font-body text-xs text-ink focus:outline-none focus:border-ink w-56"
        />
        <button
          type="button"
          onClick={() => {
            if (!paymentLink.trim()) { toast.error("Informe o link de pagamento"); return; }
            send("link_pagamento", { paymentLink: paymentLink.trim() });
          }}
          className="inline-flex items-center gap-1.5 font-body text-xs px-3 py-1.5 rounded-btn border border-terracotta/40 text-terracotta hover:bg-terracotta/10 transition-colors shrink-0"
        >
          <IconSend size={12} />
          Enviar link
        </button>
      </div>

      <button
        type="button"
        onClick={() => send("pagamento_confirmado")}
        className="inline-flex items-center gap-1.5 font-body text-xs px-3 py-1.5 rounded-btn border border-ink/20 text-ink-soft hover:bg-ink/5 transition-colors"
      >
        <IconCircleCheck size={12} />
        Pago confirmado
      </button>
    </div>
  );
}
