import Link from "next/link";

interface BreadcrumbsItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbsItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 flex-wrap">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1.5">
              {idx > 0 && (
                <span className="font-body text-[10px] text-ink-soft/40" aria-hidden="true">/</span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="font-body text-[10px] tracking-widest uppercase text-ink-soft hover:text-terracotta transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`font-body text-[10px] tracking-widest uppercase ${isLast ? "text-ink" : "text-ink-soft"}`}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
