import { getAllOrders } from "@/server/queries/orders";
import Link from "next/link";
import { IconReceipt, IconPlus } from "@/components/ui/icons";
import { formatBRL, formatDate } from "@/lib/format";
import { Pagination } from "@/components/admin/Pagination";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Pedidos · BK Admin" } };

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Rascunho", cls: "bg-ink/10 text-ink-soft" },
  sent: { label: "Enviado", cls: "bg-gold/20 text-gold" },
  returned: { label: "Devolvido", cls: "bg-terracotta/20 text-terracotta" },
  paid: { label: "Pago", cls: "bg-sage/20 text-sage-deep" },
  cancelled: { label: "Cancelado", cls: "bg-red-100 text-red-600" },
};

type OrderStatus = "draft" | "sent" | "returned" | "paid" | "cancelled";

const LIMIT = 20;

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const { items: orders, total } = await getAllOrders(
    status ? { status: status as OrderStatus } : undefined,
    { page, limit: LIMIT }
  );
  const totalPages = Math.ceil(total / LIMIT);
  const currentParams: Record<string, string> = status ? { status } : {};

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <IconReceipt size={22} className="text-terracotta" />
          <h1 className="font-display font-400 text-3xl text-ink">Pedidos</h1>
        </div>
        <Link
          href="/admin/pedidos/novo"
          className="inline-flex items-center gap-2 bg-terracotta text-cream px-4 py-2 rounded-btn font-body text-xs uppercase tracking-widest hover:bg-terracotta-soft transition-colors"
        >
          <IconPlus size={14} />
          Novo pedido
        </Link>
      </div>

      {/* Filtro status */}
      <div className="flex gap-2 flex-wrap mb-4">
        {[
          { value: "", label: "Todos" },
          ...Object.entries(STATUS_LABELS).map(([value, { label }]) => ({ value, label })),
        ].map(({ value, label }) => (
          <Link
            key={value}
            href={value ? `/admin/pedidos?status=${value}` : "/admin/pedidos"}
            className={`font-body text-xs uppercase tracking-widest px-3 py-1.5 rounded-btn border transition-colors ${
              (status ?? "") === value
                ? "bg-ink text-cream border-ink"
                : "border-ink/20 text-ink-soft hover:border-ink hover:text-ink"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="font-body text-sm text-ink-soft">Nenhum pedido encontrado.</p>
      ) : (
        <>
          <div className="space-y-2">
            {orders.map((order) => {
              const s = STATUS_LABELS[order.status] ?? STATUS_LABELS.draft;
              return (
                <Link
                  key={order.id}
                  href={`/admin/pedidos/${order.id}`}
                  className="flex items-center gap-4 bg-cream rounded-card px-4 py-3 border border-ink/10 hover:border-ink/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-400 text-sm text-ink truncate">{order.customer.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-body text-xs text-ink-soft">{formatDate(order.soldAt)}</span>
                      <span className="font-body text-xs text-ink-soft">·</span>
                      <span className="font-body text-xs text-ink-soft">
                        {order.itemCount} {order.itemCount === 1 ? "peça" : "peças"}
                      </span>
                    </div>
                  </div>
                  <span className="font-body text-sm text-terracotta font-medium">{formatBRL(order.total)}</span>
                  <span className={`font-body text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm ${s.cls}`}>
                    {s.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <Pagination page={page} totalPages={totalPages} baseHref="/admin/pedidos" params={currentParams} />
        </>
      )}
    </div>
  );
}
