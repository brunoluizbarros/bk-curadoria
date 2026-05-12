import { getAllProductsAdmin } from "@/server/queries/products";
import { formatBRL } from "@/lib/format";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { deleteProduct } from "@/server/actions/products";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Produtos · BK Admin" } };

export default async function ProductsPage() {
  const products = await getAllProductsAdmin();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-400 text-3xl text-ink">Produtos</h1>
        <Link href="/admin/products/new">
          <Button size="sm">+ Novo</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="font-body text-sm text-ink-soft">Nenhum produto cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 bg-cream rounded-card px-4 py-3 border border-ink/10"
            >
              {/* Thumb */}
              <div
                className="w-10 h-12 rounded shrink-0"
                style={{
                  background: p.firstImage
                    ? undefined
                    : p.fallbackGradient ?? "linear-gradient(135deg,#6A7256,#4F5841)",
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
                className={`font-body text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm ${
                  p.active ? "bg-sage/20 text-sage-deep" : "bg-ink/10 text-ink-soft"
                }`}
              >
                {p.active ? "Ativo" : "Inativo"}
              </span>

              <div className="flex gap-2">
                <Link href={`/admin/products/${p.id}/edit`}>
                  <Button variant="ghost" size="sm">Editar</Button>
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await deleteProduct(p.id);
                  }}
                >
                  <Button variant="danger" size="sm" type="submit">Deletar</Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
