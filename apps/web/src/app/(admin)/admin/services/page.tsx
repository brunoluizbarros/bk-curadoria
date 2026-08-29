import { getActiveServices } from "@/server/queries/services";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Serviços · BK Admin" } };

export default async function ServicesAdminPage() {
  const services = await getActiveServices();

  return (
    <div>
      <h1 className="font-display font-400 text-3xl text-ink mb-6">Serviços</h1>
      <p className="font-body text-sm text-ink-soft mb-6">
        Os 4 serviços são fixos. Clique para editar o conteúdo.
      </p>

      <div className="space-y-2">
        {services.map((svc) => (
          <Link
            key={svc.slug}
            href={`/admin/services/${svc.slug}/edit`}
            className="flex items-center justify-between bg-cream rounded-card px-4 py-4 border border-ink/10 hover:border-ink/30 transition-colors group"
          >
            <div className="flex items-baseline gap-4">
              <span className="font-display italic text-2xl text-gold">{svc.number}</span>
              <div>
                <p className="font-display font-400 text-base text-ink">{svc.name}</p>
                <p className="font-body text-xs text-ink-soft">{svc.subtitle}</p>
              </div>
            </div>
            <IconArrowRight size={14} className="text-terracotta transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
