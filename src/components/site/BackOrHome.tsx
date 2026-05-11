"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconX, IconArrowLeft } from "@tabler/icons-react";

export function BackOrHome() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState<boolean | null>(null);

  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, []);

  if (canGoBack === null) return <div className="h-7 w-7" />;

  if (canGoBack) {
    return (
      <button
        onClick={() => router.back()}
        aria-label="Fechar"
        className="flex items-center justify-center w-8 h-8 rounded-full bg-ink/5 hover:bg-ink/10 transition-colors text-ink"
      >
        <IconX size={16} />
      </button>
    );
  }

  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 font-body text-[10px] tracking-widest uppercase text-ink-soft hover:text-ink transition-colors"
    >
      <IconArrowLeft size={12} />
      Ir Início
    </Link>
  );
}
