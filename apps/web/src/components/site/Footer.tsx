import Link from "next/link";

interface FooterProps {
  signature?: string;
  bizPhone?: string;
  bizAddress?: string;
  bizInstagramUrl?: string;
}

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/categorias", label: "Loja" },
  { href: "/curadoria", label: "Curadoria" },
  { href: "/consultoria", label: "Consultoria" },
  { href: "/lista", label: "Minha lista" },
];

export function Footer({ signature = "rebeka fragoso · recife · 2026", bizPhone, bizAddress, bizInstagramUrl }: FooterProps) {
  return (
    <footer className="bg-ink text-cream pt-10 pb-8" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
      <div className="max-w-[480px] md:max-w-screen-xl mx-auto px-5">
        <div className="md:grid md:grid-cols-3 md:gap-12 mb-8">
          {/* Marca */}
          <div>
            <p className="font-display text-3xl text-cream mb-1">BK</p>
            <p className="font-body text-[10px] tracking-widest uppercase text-cream/40 mb-4">
              rebeka fragoso
            </p>
            {bizAddress && (
              <address className="not-italic font-body text-xs text-cream/50 leading-relaxed">
                {bizAddress}
              </address>
            )}
            {bizPhone && (
              <a
                href={`https://wa.me/${bizPhone.replace(/\D/g, "")}`}
                className="font-body text-xs text-cream/50 hover:text-cream transition-colors mt-1 inline-block"
                target="_blank"
                rel="noopener noreferrer"
              >
                {bizPhone}
              </a>
            )}
            {bizInstagramUrl && (
              <a
                href={bizInstagramUrl}
                className="font-body text-xs text-cream/50 hover:text-cream transition-colors mt-1 block"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            )}
          </div>

          {/* Navegação */}
          <nav aria-label="Links do rodapé">
            <p className="font-body text-[10px] tracking-widest uppercase text-cream/30 mb-4">Navegação</p>
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-xs text-cream/60 hover:text-cream transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Assinatura */}
          <div className="mt-8 md:mt-0 md:text-right">
            <p className="font-body text-[10px] tracking-widest uppercase text-cream/30 mb-4">Curadoria</p>
            <p className="font-display italic text-sm text-cream/50 leading-relaxed max-w-[200px] md:ml-auto">
              Cada peça selecionada com intenção.
            </p>
          </div>
        </div>

        <div className="border-t border-cream/10 pt-6 text-center">
          <p className="font-body text-[10px] tracking-widest uppercase text-cream/30">
            {signature}
          </p>
        </div>
      </div>
    </footer>
  );
}
