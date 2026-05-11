import { CuradoriaRelacaoItem } from "@/db/schema";

interface RelacaoListProps {
  items: CuradoriaRelacaoItem[];
}

export function RelacaoList({ items }: RelacaoListProps) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-terracotta shrink-0" />
          <div>
            <p className="font-display font-400 text-sm text-ink">{item.title}</p>
            <p className="font-body font-200 text-xs text-ink-soft leading-relaxed mt-0.5">
              {item.description}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
