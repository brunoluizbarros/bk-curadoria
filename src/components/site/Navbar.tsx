import Link from "next/link";

interface NavbarProps {
  brandName?: string;
}

export function Navbar({ brandName = "BK" }: NavbarProps) {
  return (
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
          <Link href="/#servicos" className="font-body text-xs tracking-widest uppercase text-ink hover:text-terracotta transition-colors">
            Consultoria
          </Link>
        </div>

        {/* Mobile menu icon (decorativo — expandir em Fase 6) */}
        <button
          className="md:hidden w-8 h-8 flex flex-col justify-center gap-1.5"
          aria-label="Menu"
        >
          <span className="w-full h-px bg-ink block" />
          <span className="w-3/4 h-px bg-ink block" />
        </button>
      </div>
    </nav>
  );
}
