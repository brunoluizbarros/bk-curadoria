"use client";

import { useState } from "react";
import { IconShare3, IconCheck } from "@tabler/icons-react";

interface ShareButtonProps {
  url: string;
  title: string;
  text?: string;
}

export function ShareButton({ url, title, text }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // usuário cancelou ou erro — não mostrar nada
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 font-body text-[10px] tracking-widest uppercase text-ink-soft hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 rounded"
    >
      {copied ? (
        <IconCheck size={13} className="text-sage-deep" />
      ) : (
        <IconShare3 size={13} />
      )}
      {copied ? "Link copiado" : "Compartilhar"}
    </button>
  );
}
