import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-5">
      <div className="text-center">
        <p className="font-display italic text-8xl text-gold/40 mb-4">404</p>
        <h1 className="font-display font-300 text-2xl text-ink mb-2">Página não encontrada</h1>
        <p className="font-body text-sm text-ink-soft mb-6">O conteúdo que você procura não existe ou foi movido.</p>
        <Link href="/" className="font-body text-xs tracking-widest uppercase text-terracotta hover:text-terracotta-soft transition-colors">
          Voltar ao início →
        </Link>
      </div>
    </div>
  );
}
