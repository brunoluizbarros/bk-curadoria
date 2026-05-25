import { getServiceBySlug, getActiveServices } from "@/server/queries/services";
import { getSiteConfig } from "@/server/queries/site-config";
import { HeroSection } from "@/components/site/HeroSection";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildServiceSchema, buildBreadcrumbSchema } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowRight } from "@tabler/icons-react";
import type { Metadata } from "next";

export const revalidate = 3600;

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bkcuradoria.com.br";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const services = await getActiveServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  const description = service.lead ?? service.subtitle ?? `Serviço de consultoria de imagem: ${service.name} com Rebeka Fragoso em Recife.`;
  return buildMetadata({
    title: service.name,
    description,
    path: `/servicos/${slug}`,
    image: `${BASE}/servicos/${slug}/opengraph-image`,
  });
}

export default async function ServicoPage({ params }: Props) {
  const { slug } = await params;

  const [service, allServices, config] = await Promise.all([
    getServiceBySlug(slug),
    getActiveServices(),
    getSiteConfig(),
  ]);

  if (!service) notFound();

  const phone = config.whatsapp_number ?? "5581999999999";
  const others = allServices.filter((s) => s.slug !== slug);

  const breadcrumbs = [
    { name: "Início", url: BASE },
    { name: "Consultoria", url: `${BASE}/consultoria` },
    { name: service.name, url: `${BASE}/servicos/${slug}` },
  ];

  return (
    <>
      <JsonLd data={buildServiceSchema({ name: service.name, description: service.lead, slug: service.slug })} />
      <JsonLd data={buildBreadcrumbSchema(breadcrumbs)} />

      <HeroSection
        tag={service.subtitle}
        title={service.name}
        gradient={service.heroGradient}
      />

      <section className="px-5 py-10 max-w-screen-xl mx-auto">
        <div className="md:max-w-2xl lg:max-w-3xl mx-auto">

          <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Consultoria", href: "/consultoria" }, { label: service.name }]} />

          <p className="font-body font-300 text-sm text-ink-soft leading-relaxed mb-8 mt-6">
            {service.lead}
          </p>

          {/* Etapas */}
          {service.steps.length > 0 && (
            <div className="mb-8">
              <p className="font-body text-[9px] tracking-[0.3em] uppercase text-gold mb-5">
                Como funciona
              </p>
              <div className="space-y-6">
                {service.steps.map((step, i) => (
                  <div key={step.id} className="flex gap-4">
                    <span className="font-display italic text-3xl text-gold shrink-0 leading-none mt-1">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h2 className="font-display font-400 text-base text-ink">{step.title}</h2>
                      <p className="font-body font-200 text-sm text-ink-soft leading-relaxed mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Entrega */}
          <div className="bg-sage-deep text-cream rounded-card px-5 py-5 mb-8">
            <p className="font-body text-[9px] tracking-widest uppercase text-cream/50 mb-3">
              O que você recebe
            </p>
            <div className="border-t border-gold/30 pt-3">
              <p className="font-body font-300 text-sm leading-relaxed">{service.deliverable}</p>
              <p className="font-display italic text-sm text-gold/80 mt-3">{service.duration}</p>
            </div>
          </div>

          {/* CTA */}
          <WhatsAppButton
            ctx={{ kind: "service", name: service.name }}
            phone={phone}
            label={`Quero saber mais sobre ${service.name}`}
            className="w-full"
          />

          {/* Outros serviços */}
          {others.length > 0 && (
            <div className="mt-12 border-t border-ink/10 pt-6">
              <p className="font-body text-[9px] tracking-[0.3em] uppercase text-gold mb-4">
                Outros serviços
              </p>
              <div className="space-y-3">
                {others.map((svc) => (
                  <Link
                    key={svc.slug}
                    href={`/servicos/${svc.slug}`}
                    className="flex items-center justify-between py-3 border-b border-ink/10 hover:text-terracotta transition-colors group"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="font-display italic text-xl text-gold">{svc.number}</span>
                      <span className="font-display font-400 text-base">{svc.name}</span>
                    </div>
                    <IconArrowRight size={14} className="text-terracotta transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
