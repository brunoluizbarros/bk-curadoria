import { getAllWishlistsAdmin } from "@/server/queries/wishlists";
import Link from "next/link";
import { formatBRL } from "@/lib/format";
import { IconHeart } from "@/components/ui/icons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Listas de Desejos · BK Admin" } };

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Nova", cls: "bg-gold/20 text-gold" },
  contacted: { label: "Contatada", cls: "bg-sage/20 text-sage-deep" },
  closed: { label: "Fechada", cls: "bg-ink/10 text-ink-soft" },
};

function fmt(d: Date | null) {
  if (!d) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(d));
}

export default async function WishlistsPage() {
  const lists = await getAllWishlistsAdmin();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <IconHeart size={22} className="text-terracotta" />
        <h1 className="font-display font-400 text-3xl text-ink">Listas de desejos</h1>
      </div>

      {lists.length === 0 ? (
        <p className="font-body text-sm text-ink-soft">Nenhuma lista recebida ainda.</p>
      ) : (
        <div className="space-y-2">
          {lists.map((list) => {
            const status = STATUS_LABELS[list.status] ?? STATUS_LABELS.pending;
            return (
              <Link
                key={list.id}
                href={`/admin/wishlists/${list.id}`}
                className="flex items-center gap-4 bg-cream rounded-card px-4 py-3 border border-ink/10 hover:border-ink/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-display font-400 text-sm text-ink truncate">
                    {list.wisherName}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="font-body text-xs text-ink-soft">
                      {list.itemCount} {list.itemCount === 1 ? "peça" : "peças"}
                    </span>
                    <span className="font-body text-xs text-ink-soft">·</span>
                    <span className="font-body text-xs text-ink-soft">
                      para {list.gifterName} ({list.gifterRelation})
                    </span>
                  </div>
                </div>

                <span className="font-body text-[10px] text-ink-soft hidden sm:block">
                  {fmt(list.createdAt)}
                </span>

                <span className={`font-body text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm ${status.cls}`}>
                  {status.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
