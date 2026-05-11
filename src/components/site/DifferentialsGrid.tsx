import { HomeDifferential } from "@/db/schema";
import { IconEye, IconStar, IconUser, IconRefresh } from "@tabler/icons-react";

const iconMap: Record<string, React.ReactNode> = {
  eye: <IconEye size={20} />,
  star: <IconStar size={20} />,
  user: <IconUser size={20} />,
  refresh: <IconRefresh size={20} />,
};

interface DifferentialsGridProps {
  items: HomeDifferential[];
}

export function DifferentialsGrid({ items }: DifferentialsGridProps) {
  return (
    <section className="px-5 py-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-screen-xl mx-auto">
        {items.map((item) => (
          <div key={item.id} className="bg-cream-soft rounded-card p-4">
            <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center text-cream mb-3">
              {iconMap[item.iconName] ?? <IconStar size={20} />}
            </div>
            <h3 className="font-display font-400 text-base text-ink mb-1">{item.title}</h3>
            <p className="font-body font-200 text-xs text-ink-soft leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
