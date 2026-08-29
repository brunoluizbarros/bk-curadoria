import { cn } from "@/lib/utils";

interface HeroSectionProps {
  tag?: string;
  title: string;
  titleEm?: string;
  body?: string;
  gradient?: string;
  className?: string;
}

export function HeroSection({ tag, title, titleEm, body, gradient, className }: HeroSectionProps) {
  const bg = gradient ?? "linear-gradient(135deg,#6a7256 0%,#4f5841 60%,#3a4230 100%)";

  return (
    <section
      className={cn("relative px-5 py-12 md:py-24 overflow-hidden", className)}
      style={{ background: bg }}
    >
      {/* Círculos decorativos */}
      <div
        className="absolute top-4 right-4 md:top-1/2 md:right-20 md:-translate-y-1/2 w-28 h-28 md:w-72 md:h-72 lg:w-96 lg:h-96 rounded-full opacity-20"
        style={{ border: "1px solid #c9a063" }}
      />
      <div
        className="hidden md:block absolute top-1/2 right-20 -translate-y-1/2 w-52 h-52 lg:w-64 lg:h-64 rounded-full opacity-10"
        style={{ border: "1px solid #c9a063" }}
      />

      <div className="relative z-10 max-w-screen-xl mx-auto md:flex md:items-center md:justify-between">
        {/* Conteúdo */}
        <div className="max-w-[480px] md:max-w-xl lg:max-w-2xl">
          {tag && (
            <p className="font-body text-[10px] tracking-[0.3em] uppercase text-gold mb-3">
              {tag}
            </p>
          )}
          <h1 className="font-display font-300 text-3xl md:text-5xl lg:text-6xl leading-tight text-cream">
            {title}{" "}
            {titleEm && <em className="italic">{titleEm}</em>}
          </h1>
          {body && (
            <p className="font-body font-200 text-sm leading-relaxed text-cream/70 mt-4 max-w-sm md:max-w-md">
              {body}
            </p>
          )}
        </div>

        {/* Monograma decorativo — desktop */}
        <div className="hidden md:flex items-center justify-end pr-4 lg:pr-16">
          <span className="font-display text-[120px] lg:text-[180px] text-cream/8 select-none leading-none">
            BK
          </span>
        </div>
      </div>
    </section>
  );
}
