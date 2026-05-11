"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconX } from "@tabler/icons-react";

interface NavbarProps {
  brandName?: string;
}

export function Navbar({ brandName = "BK" }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // fecha ao navegar
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // bloqueia scroll quando aberto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-cream border-b border-ink/10">
        <div className="max-w-[480px] md:max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex flex-col leading-none">
            <span className="font-display font-400 text-2xl text-ink tracking-wide">
              {brandName}
            </span>
            <span className="font-body text-[10px] tracking-[0.25em] uppercase text-gold">
              rebeka fragoso
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/curadoria" className="font-body text-xs tracking-widest uppercase text-ink hover:text-terracotta transition-colors">
              Curadoria
            </Link>
            <Link href="/consultoria" className="font-body text-xs tracking-widest uppercase text-ink hover:text-terracotta transition-colors">
              Consultoria
            </Link>
          </div>

          {/* Hamburguer mobile */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden w-8 h-8 flex flex-col justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta rounded"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            <span className={`w-full h-px bg-ink block transition-transform origin-center duration-200 ${open ? "rotate-45 translate-y-[5px]" : ""}`} />
            <span className={`h-px bg-ink block transition-all duration-200 ${open ? "opacity-0 w-full" : "w-3/4"}`} />
            <span className={`w-full h-px bg-ink block transition-transform origin-center duration-200 ${open ? "-rotate-45 -translate-y-[5px]" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Overlay + Drawer mobile — só montados quando abertos para não interferir no scroll */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/40 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed top-14 right-0 bottom-0 z-50 w-64 bg-cream flex flex-col py-10 px-8 gap-8 md:hidden"
            role="dialog"
            aria-label="Menu de navegação"
          >
            <Link
              href="/curadoria"
              className="font-body text-sm tracking-widest uppercase text-ink hover:text-terracotta transition-colors"
            >
              Curadoria
            </Link>
            <Link
              href="/consultoria"
              className="font-body text-sm tracking-widest uppercase text-ink hover:text-terracotta transition-colors"
            >
              Consultoria
            </Link>
            <div className="mt-auto border-t border-ink/10 pt-6">
              <Link
                href="/"
                className="font-display italic text-sm text-ink-soft hover:text-ink transition-colors"
              >
                Início
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
