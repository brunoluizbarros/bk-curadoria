// force-dynamic: build do Railway não alcança postgres.railway.internal (só em runtime)
export const dynamic = "force-dynamic";

import { getActiveServices } from "@/server/queries/services";
import { getSiteConfig } from "@/server/queries/site-config";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Consultoria de imagem",
  description: "Quatro formas de transformar sua relação com a moda com Rebeka Fragoso em Recife: consultoria de imagem presencial, personal shopper e mais.",
  path: "/consultoria",
});

export default async function ConsultoriaPage() {
  const [services, config] = await Promise.all([
    getActiveServices(),
    getSiteConfig(),
  ]);

  const phone = config.whatsapp_number ?? "5581999999999";

  return (
    <>
      {/* Hero */}
      <section className="px-5 py-14 md:py-20 bg-ink text-cream">
        <div className="max-w-[480px] md:max-w-screen-xl mx-auto">
          <p className="font-body text-[9px] tracking-[0.3em] uppercase text-gold mb-3">
            Consultoria
          </p>
          <h1 className="font-display font-300 text-4xl md:text-6xl leading-tight mb-4">
            Além do <em className="italic">produto.</em>
          </h1>
          <p className="font-body font-200 text-sm text-cream/60 max-w-sm leading-relaxed">
            Quatro formas de trabalharmos juntas para construir uma imagem que
            comunica quem você realmente é.
          </p>
        </div>
      </section>

      {/* Cards dos serviços */}
      <section className="px-5 py-12 md:py-16">
        <div className="max-w-[480px] md:max-w-screen-xl mx-auto space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
          {services.map((svc) => (
            <Link
              key={svc.slug}
              href={`/servicos/${svc.slug}`}
              className="group block rounded-card border border-ink/10 hover:border-terracotta/40 transition-colors overflow-hidden"
            >
              {/* faixa colorida com gradiente do serviço */}
              <div
                className="h-2"
                style={{ background: svc.heroGradient ?? "linear-gradient(90deg,#6A7256,#4F5841)" }}
              />

              <div className="p-6 md:p-8">
                {/* número + nome */}
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="font-display italic text-3xl text-gold leading-none">
                    {svc.number}
                  </span>
                  <h2 className="font-display font-400 text-xl text-ink">{svc.name}</h2>
                </div>

                {/* subtítulo */}
                {svc.subtitle && (
                  <p className="font-body text-[10px] tracking-widest uppercase text-ink-soft mb-4">
                    {svc.subtitle}
                  </p>
                )}

                {/* lead */}
                {svc.lead && (
                  <p className="font-body font-300 text-sm text-ink-soft leading-relaxed line-clamp-3">
                    {svc.lead}
                  </p>
                )}

                {/* entrega resumida */}
                {svc.duration && (
                  <p className="font-display italic text-xs text-gold/70 mt-4">
                    {svc.duration}
                  </p>
                )}

                {/* CTA inline */}
                <div className="flex items-center gap-1.5 mt-5 font-body text-[10px] tracking-widest uppercase text-terracotta group-hover:gap-3 transition-all">
                  Ver detalhes
                  <IconArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-5 py-14 md:py-20 bg-sage-deep text-cream">
        <div className="max-w-[480px] md:max-w-screen-xl mx-auto md:flex md:items-center md:justify-between md:gap-12">
          <div className="md:max-w-lg mb-6 md:mb-0">
            <h2 className="font-display font-300 text-2xl md:text-4xl leading-tight mb-2">
              Não sabe por onde <em className="italic">começar?</em>
            </h2>
            <p className="font-body font-200 text-sm text-cream/60 leading-relaxed">
              Me conta no WhatsApp o que você está buscando e eu indico o melhor caminho.
            </p>
          </div>
          <div className="shrink-0">
            <WhatsAppButton
              ctx={{ kind: "default" }}
              phone={phone}
              label="Falar com a Rebeka"
              variant="cream"
            />
          </div>
        </div>
      </section>
    </>
  );
}
