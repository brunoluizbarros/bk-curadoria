export const dynamic = "force-dynamic";

import { getCuradoriaContent } from "@/server/queries/curadoria";
import { getSiteConfig } from "@/server/queries/site-config";
import { HeroSection } from "@/components/site/HeroSection";
import { CrivoList } from "@/components/site/CrivoList";
import { RelacaoList } from "@/components/site/RelacaoList";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import type { Metadata } from "next";

import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Curadoria",
  description: "Conheça o método da BK Curadoria: como Rebeka Fragoso seleciona cada peça de moda feminina em Recife com critério, intenção e olhar autoral.",
  path: "/curadoria",
});

export default async function CuradoriaPage() {
  const [{ content, crivos, relacao }, config] = await Promise.all([
    getCuradoriaContent(),
    getSiteConfig(),
  ]);

  const phone = config.whatsapp_number ?? "5581999999999";

  if (!content) {
    return <p className="p-10">Conteúdo não disponível.</p>;
  }

  return (
    <>
      <HeroSection
        tag={content.eyebrow}
        title={content.title}
        titleEm={content.titleEm ?? undefined}
      />

      <section className="px-5 py-10 max-w-screen-xl mx-auto">
        <div className="md:max-w-2xl lg:max-w-3xl mx-auto">
        <p className="font-body font-300 text-sm text-ink-soft leading-relaxed">
          {content.leadParagraph1}
        </p>
        {content.leadParagraph2 && (
          <p className="font-body font-300 text-sm text-ink-soft leading-relaxed mt-3">
            {content.leadParagraph2}
          </p>
        )}

        {content.quoteText && (
          <blockquote className="my-8 bg-sage-deep text-cream rounded-card px-6 py-6 relative overflow-hidden">
            <span className="absolute top-0 right-4 font-display text-8xl text-white/10 leading-none select-none">
              R
            </span>
            <p className="font-display italic text-lg leading-relaxed relative z-10">
              &ldquo;{content.quoteText}&rdquo;
            </p>
            {content.quoteSignature && (
              <p className="font-body text-[10px] tracking-widest uppercase text-cream/50 mt-3 relative z-10">
                — {content.quoteSignature}
              </p>
            )}
          </blockquote>
        )}

        {crivos.length > 0 && (
          <div className="mb-10">
            <p className="font-body text-[9px] tracking-[0.3em] uppercase text-gold mb-5">
              Os critérios
            </p>
            <CrivoList crivos={crivos} />
          </div>
        )}

        {relacao.length > 0 && (
          <div className="mb-10">
            <p className="font-body text-[9px] tracking-[0.3em] uppercase text-gold mb-5">
              Como funciona
            </p>
            <RelacaoList items={relacao} />
          </div>
        )}

        {/* CTA */}
        <div className="border-t border-ink/10 pt-8">
          {content.ctaSubtext && (
            <p className="font-body font-200 text-xs text-ink-soft mb-4">{content.ctaSubtext}</p>
          )}
          <WhatsAppButton
            ctx={{ kind: "curadoria" }}
            phone={phone}
            label={content.ctaLabel}
            className="w-full md:w-auto"
          />
        </div>
        </div>
      </section>
    </>
  );
}
