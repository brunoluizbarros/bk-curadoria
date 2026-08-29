import { CuradoriaCrivo } from "@/db/schema";

interface CrivoListProps {
  crivos: CuradoriaCrivo[];
}

export function CrivoList({ crivos }: CrivoListProps) {
  return (
    <div className="space-y-6">
      {crivos.map((crivo) => (
        <div key={crivo.id} className="flex gap-4">
          <span className="font-display italic text-3xl text-gold shrink-0">{crivo.number}</span>
          <div>
            <h3 className="font-display font-400 text-base text-ink">{crivo.title}</h3>
            <p className="font-body font-200 text-sm text-ink-soft leading-relaxed mt-1">
              {crivo.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
