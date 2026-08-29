"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Category } from "@/db/schema";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: Category[];
  activeSlug: string;
}

export function CategoryFilter({ categories, activeSlug }: CategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSelect(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === "all") {
      params.delete("cat");
    } else {
      params.set("cat", slug);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const allCategories = [{ id: "all", slug: "all", label: "Tudo", sortOrder: -1, active: true }, ...categories];

  return (
    <div className="px-4 py-3 md:py-4">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-x-visible md:pb-0">
          {allCategories.map((cat) => {
            const isActive = cat.slug === activeSlug;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelect(cat.slug)}
                className={cn(
                  "shrink-0 px-4 py-1.5 rounded-full text-xs tracking-wider uppercase font-body transition-colors border",
                  isActive
                    ? "bg-ink text-cream border-ink"
                    : "bg-transparent text-ink border-ink/30 hover:border-ink"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
