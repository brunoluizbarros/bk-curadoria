interface FooterProps {
  signature?: string;
}

export function Footer({ signature = "rebeka fragoso · recife · 2026" }: FooterProps) {
  return (
    <footer className="bg-ink text-cream py-8">
      <div className="max-w-[480px] md:max-w-screen-xl mx-auto px-4 text-center">
        <p className="font-display text-2xl text-cream mb-1">BK</p>
        <p className="font-body text-[10px] tracking-widest uppercase text-cream/50">
          {signature}
        </p>
      </div>
    </footer>
  );
}
