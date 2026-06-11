import { getActiveCategories } from "@/server/queries/categories";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Categorias",
  description: "Explore todas as categorias da BK Curadoria: vestidos, blusas, calças, acessórios e muito mais. Moda feminina autoral selecionada por Rebeka Fragoso em Recife.",
  path: "/categorias",
});

export default async function CategoriasPage() {
  const categories = await getActiveCategories();

  return (
    <div className="max-w-[480px] md:max-w-screen-xl mx-auto px-5 py-12">
      <h1 className="font-display font-300 text-4xl text-ink mb-2">Categorias</h1>
      <p className="font-body text-sm text-ink-soft mb-10">
        Explore o acervo por categoria.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categorias/${cat.slug}`}
            className="group block rounded-card border border-ink/10 hover:border-terracotta/40 transition-colors px-5 py-6"
          >
            <h2 className="font-display font-400 text-lg text-ink group-hover:text-terracotta transition-colors">
              {cat.label}
            </h2>
            {cat.description && (
              <p className="font-body text-xs text-ink-soft mt-1 line-clamp-2">{cat.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
