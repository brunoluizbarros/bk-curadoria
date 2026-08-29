import Link from "next/link";
import { Service } from "@/db/schema";
import { IconArrowRight } from "@tabler/icons-react";

interface ServicesListProps {
  services: Service[];
  tag?: string;
  title?: string;
  titleEm?: string;
  subtitle?: string;
}

export function ServicesList({ services, tag, title, titleEm, subtitle }: ServicesListProps) {
  return (
    <section className="px-5 py-10" id="servicos">
      <div className="max-w-[480px] md:max-w-screen-xl mx-auto">
        {tag && (
          <p className="font-body text-[9px] tracking-[0.3em] uppercase text-gold mb-2">{tag}</p>
        )}
        {(title || titleEm) && (
          <h2 className="font-display font-300 text-2xl md:text-4xl text-ink mb-1">
            {title} <em className="italic">{titleEm}</em>
          </h2>
        )}
        {subtitle && (
          <p className="font-body font-200 text-xs text-ink-soft mb-6">{subtitle}</p>
        )}

        <div className="mt-6 border-t border-ink/10">
          {services.map((svc) => (
            <Link
              key={svc.slug}
              href={`/servicos/${svc.slug}`}
              className="group flex items-center justify-between py-5 border-b border-ink/10 hover:bg-cream-soft transition-colors px-2 -mx-2 rounded"
            >
              <div className="flex items-baseline gap-4">
                <span className="font-display italic text-2xl text-gold">{svc.number}</span>
                <span className="font-display font-400 text-lg text-ink">{svc.name}</span>
              </div>
              <IconArrowRight
                size={16}
                className="text-terracotta transition-transform group-hover:translate-x-1"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
