import Link from "next/link";

interface BannerCuradoriaProps {
  tag?: string;
  title?: string;
  titleEm?: string;
  cta?: string;
}

export function BannerCuradoria({
  tag = "Saiba mais",
  title = "A BK não é uma loja.",
  titleEm = "É uma curadoria.",
  cta = "Conhecer o método",
}: BannerCuradoriaProps) {
  return (
    <div className="px-4 my-5 md:my-8">
      <Link
        href="/curadoria"
        className="block max-w-screen-xl mx-auto rounded-card overflow-hidden group"
        style={{ background: "linear-gradient(135deg,#b8634a 0%,#8e4a35 100%)" }}
      >
        <div className="px-5 py-6 md:px-10 md:py-10 md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <p className="font-body text-[9px] tracking-[0.3em] uppercase text-cream/60 mb-2">{tag}</p>
            <p className="font-display font-300 text-xl md:text-3xl text-cream leading-snug">
              {title}{" "}
              <em className="italic">{titleEm}</em>
            </p>
          </div>
          <p className="font-body text-[10px] tracking-widest uppercase text-cream/70 mt-4 md:mt-0 flex items-center gap-1 shrink-0">
            {cta}
            <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
          </p>
        </div>
      </Link>
    </div>
  );
}
