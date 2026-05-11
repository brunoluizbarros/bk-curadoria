import { WhatsAppButton } from "./WhatsAppButton";

interface FinalCTAProps {
  title?: string;
  titleEm?: string;
  subtitle?: string;
  ctaLabel?: string;
  phone: string;
}

export function FinalCTA({ title, titleEm, subtitle, ctaLabel = "Iniciar conversa", phone }: FinalCTAProps) {
  return (
    <section className="px-5 py-12 md:py-20 bg-sage-deep text-cream">
      <div className="max-w-screen-xl mx-auto md:flex md:items-center md:justify-between md:gap-12">
        <div className="md:max-w-lg">
          {(title || titleEm) && (
            <h2 className="font-display font-300 text-2xl md:text-4xl lg:text-5xl leading-tight mb-3">
              {title} <em className="italic">{titleEm}</em>
            </h2>
          )}
          {subtitle && (
            <p className="font-body font-200 text-sm text-cream/70">{subtitle}</p>
          )}
        </div>
        <div className="mt-6 md:mt-0 md:shrink-0">
          <WhatsAppButton ctx={{ kind: "default" }} phone={phone} label={ctaLabel} variant="cream" />
        </div>
      </div>
    </section>
  );
}
