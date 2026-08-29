"use client";

import { useState } from "react";
import { IconLink, IconShare, IconBrandWhatsapp } from "@/components/ui/icons";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface WishlistShareActionsProps {
  token: string;
  wisherName: string;
  gifterName: string;
  gifterRelation: string;
  gifterPhone: string;
}

export function WishlistShareActions({
  token,
  wisherName,
  gifterName,
  gifterRelation,
  gifterPhone,
}: WishlistShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/lista/${token}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: do nothing
    }
  }

  const shareLink = buildWhatsAppLink(
    { kind: "wishlist-share-to-gifter", wisherName, gifterName, gifterRelation, token },
    gifterPhone
  );

  async function nativeShare() {
    if (typeof navigator.share === "function") {
      await navigator.share({ title: "Minha lista de desejos BK", url }).catch(() => null);
    } else {
      await copyLink();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={copyLink}
        className={cn(
          "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-btn",
          "font-body text-xs tracking-[0.2em] uppercase transition-colors",
          "bg-cream text-ink hover:bg-cream-soft border border-ink/20"
        )}
      >
        <IconLink size={16} />
        {copied ? "Link copiado!" : "Copiar link da lista"}
      </button>

      <a
        href={shareLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-btn font-body text-xs tracking-[0.2em] uppercase transition-colors bg-[#25D366] text-white hover:bg-[#1ebe5d]"
      >
        <IconBrandWhatsapp size={16} />
        Mandar para {gifterName.split(" ")[0]}
      </a>

      <button
        type="button"
        onClick={nativeShare}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-btn font-body text-xs tracking-[0.2em] uppercase transition-colors bg-cream text-ink hover:bg-cream-soft border border-ink/20"
      >
        <IconShare size={16} />
        Compartilhar
      </button>
    </div>
  );
}
