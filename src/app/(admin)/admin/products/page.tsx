import { getProductsAdminPaginated, type ProductAdminSort, type SortDir } from "@/server/queries/products";
import { getAllCategories } from "@/server/queries/categories";
import { formatBRL } from "@/lib/format";
import { pickFallbackGradient } from "@/lib/gradients";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProductDeleteButton } from "@/components/admin/ProductDeleteButton";
import { Pagination } from "@/components/admin/Pagination";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Produtos · BK Admin" } };

const LIMIT = 20;

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "order-asc", label: "Ordem (crescente)" },
  { value: "order-desc", label: "Ordem (decrescente)" },
  { value: "name-asc", label: "Nome (A-Z)" },
  { value: "name-desc", label: "Nome (Z-A)" },
  { value: "created-desc", label: "Mais recentes" },
  { value: "created-asc", label: "Mais antigos" },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; categoria?: string; sort?: string; view?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const sortValue = sp.sort ?? "order-asc";
  const [sortField, sortDir] = sortValue.split("-") as [ProductAdminSort, SortDir];
  const view = sp.view === "card" ? "card" : "list";

  const [{ items: products, total }, categories] = await Promise.all([
    getProductsAdminPaginated(page, LIMIT, {
      search: sp.q || undefined,
      categoryId: sp.categoria || undefined,
      sort: sortField,
      dir: sortDir,
    }),
    getAllCategories(),
  ]);
  const totalPages = Math.ceil(total / LIMIT);

  const currentParams: Record<string, string> = {};
  if (sp.q) currentParams.q = sp.q;
  if (sp.categoria) currentParams.categoria = sp.categoria;
  if (sp.sort) currentParams.sort = sp.sort;
  if (view !== "list") currentParams.view = view;

  const viewHref = (v: string) => {
    const params = new URLSearchParams({ ...currentParams, view: v });
    if (v === "list") params.delete("view");
    return `/admin/products${params.toString() ? `?${params}` : ""}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-400 text-3xl text-ink">Produtos</h1>
        <Link href="/admin/products/new">
          <Button size="sm">+ Novo</Button>
        </Link>
      </div>

      {/* Busca, categoria e ordenação */}
      <form method="get" className="mb-4 flex gap-2 flex-wrap items-center">
        {view !== "list" && <input type="hidden" name="view" value={view} />}
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Buscar por nome..."
          className="flex-1 min-w-[180px] max-w-xs px-3 py-2 rounded border border-ink/20 bg-cream font-body text-sm text-ink focus:outline-none focus:border-ink"
        />
        <select
          name="categoria"
          defaultValue={sp.categoria ?? ""}
          className="rounded border border-ink/20 bg-cream px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink"
        >
          <option value="">Todas categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={sortValue}
          className="rounded border border-ink/20 bg-cream px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded border border-ink/20 font-body text-sm text-ink hover:bg-ink/5 transition-colors"
        >
          Filtrar
        </button>
      </form>

      {/* Alternar visualização */}
      <div className="flex gap-2 mb-4">
        <Link
          href={viewHref("list")}
          className={`font-body text-xs uppercase tracking-widest px-3 py-1.5 rounded-btn border transition-colors ${
            view === "list" ? "bg-ink text-cream border-ink" : "border-ink/20 text-ink-soft hover:border-ink hover:text-ink"
          }`}
        >
          Lista
        </Link>
        <Link
          href={viewHref("card")}
          className={`font-body text-xs uppercase tracking-widest px-3 py-1.5 rounded-btn border transition-colors ${
            view === "card" ? "bg-ink text-cream border-ink" : "border-ink/20 text-ink-soft hover:border-ink hover:text-ink"
          }`}
        >
          Cards
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="font-body text-sm text-ink-soft">
          {sp.q || sp.categoria ? "Nenhum produto encontrado para os filtros aplicados." : "Nenhum produto cadastrado."}
        </p>
      ) : view === "card" ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p) => (
              <div key={p.id}>
                <Link href={`/admin/products/${p.id}/edit`} className="block group">
                  <div
                    className="relative w-full rounded-card overflow-hidden mb-2"
                    style={{ aspectRatio: "3/4" }}
                  >
                    {p.firstImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.firstImage.url}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ background: p.fallbackGradient ?? pickFallbackGradient(p.id) }}
                      />
                    )}
                  </div>
                  <p className="font-display font-400 text-sm text-ink truncate">{p.name}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="font-body text-xs text-ink-soft">{formatBRL(p.priceCents)}</span>
                    {p.categoryLabels.map((label) => (
                      <span key={label} className="font-body text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded-sm bg-gold/15 text-gold">
                        {label}
                      </span>
                    ))}
                  </div>
                  <span
                    className={`inline-block mt-1 font-body text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm ${
                      p.active ? "bg-sage/20 text-sage-deep" : "bg-ink/10 text-ink-soft"
                    }`}
                  >
                    {p.active ? "Ativo" : "Inativo"}
                  </span>
                </Link>
                <div className="flex gap-2 mt-2">
                  <Link href={`/admin/products/${p.id}/edit`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full">Editar</Button>
                  </Link>
                  <ProductDeleteButton productId={p.id} productName={p.name} />
                </div>
              </div>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} baseHref="/admin/products" params={currentParams} />
        </>
      ) : (
        <>
          <div className="space-y-2">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 flex-wrap bg-cream rounded-card px-4 py-3 border border-ink/10"
              >
                <div
                  className="w-10 h-12 rounded shrink-0"
                  style={{
                    background: p.firstImage
                      ? undefined
                      : p.fallbackGradient ?? pickFallbackGradient(p.id),
                  }}
                >
                  {p.firstImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.firstImage.url}
                      alt={p.name}
                      className="w-full h-full object-cover rounded"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-display font-400 text-sm text-ink truncate">{p.name}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="font-body text-xs text-ink-soft">{formatBRL(p.priceCents)}</span>
                    {p.categoryLabels.map((label) => (
                      <span key={label} className="font-body text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded-sm bg-gold/15 text-gold">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                <span
                  className={`shrink-0 font-body text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm ${
                    p.active ? "bg-sage/20 text-sage-deep" : "bg-ink/10 text-ink-soft"
                  }`}
                >
                  {p.active ? "Ativo" : "Inativo"}
                </span>

                <div className="flex gap-2 shrink-0">
                  <Link href={`/admin/products/${p.id}/edit`}>
                    <Button variant="ghost" size="sm">Editar</Button>
                  </Link>
                  <ProductDeleteButton productId={p.id} productName={p.name} />
                </div>
              </div>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} baseHref="/admin/products" params={currentParams} />
        </>
      )}
    </div>
  );
}
