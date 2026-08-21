import { getAllOrders } from "@/server/queries/orders";
import Link from "next/link";
import { IconReceipt, IconPlus, IconSearch } from "@/components/ui/icons";
import { formatBRL, formatDate } from "@/lib/format";
import { Pagination } from "@/components/admin/Pagination";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Pedidos · BK Admin" } };

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

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
  searchParams: Promise<{ status?: string; page?: string; q?: string; mes?: string; ano?: string }>;
}) {
  const { status, page: pageStr, q, mes: mesParam, ano: anoParam } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const now = new Date();
  // default = mês atual; mes="" = todos
  const mes = mesParam ?? String(now.getMonth() + 1);
  const ano = anoParam ? parseInt(anoParam, 10) : now.getFullYear();
  const from = mes !== "" ? new Date(ano, parseInt(mes, 10) - 1, 1) : undefined;
  const to = mes !== "" ? new Date(ano, parseInt(mes, 10), 1) : undefined;

  const { items: orders, total } = await getAllOrders(
    { status: status as OrderStatus | undefined, search: q || undefined, from, to },
    { page, limit: LIMIT }
  );
  const totalPages = Math.ceil(total / LIMIT);
  const currentParams: Record<string, string> = {};
  if (status) currentParams.status = status;
  if (q) currentParams.q = q;
  currentParams.mes = mes;
  currentParams.ano = String(ano);

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

      {/* Filtro mês/ano */}
      <form method="get" className="mb-3 flex gap-2 flex-wrap">
        {status && <input type="hidden" name="status" value={status} />}
        {q && <input type="hidden" name="q" value={q} />}
        <select
          name="mes"
          defaultValue={mes}
          className="rounded border border-ink/20 bg-cream px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink"
        >
          <option value="">Todos os meses</option>
          {MONTHS.map((label, i) => (
            <option key={i + 1} value={String(i + 1)}>{label}</option>
          ))}
        </select>
        <select
          name="ano"
          defaultValue={String(ano)}
          className="rounded border border-ink/20 bg-cream px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink"
        >
          {Array.from({ length: 4 }, (_, i) => now.getFullYear() - i).map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded border border-ink/20 font-body text-sm text-ink hover:bg-ink/5 transition-colors"
        >
          Filtrar
        </button>
      </form>

      {/* Busca por cliente */}
      <form method="get" className="mb-4 flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <input type="hidden" name="mes" value={mes} />
        <input type="hidden" name="ano" value={String(ano)} />
        <div className="relative flex-1 max-w-sm">
          <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome do cliente..."
            className="w-full pl-8 pr-3 py-2 rounded border border-ink/20 bg-cream font-body text-sm text-ink focus:outline-none focus:border-ink"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded border border-ink/20 font-body text-sm text-ink hover:bg-ink/5 transition-colors"
        >
          Buscar
        </button>
      </form>

      {/* Filtro status */}
      <div className="flex gap-2 flex-wrap mb-4">
        {[
          { value: "", label: "Todos" },
          ...Object.entries(STATUS_LABELS).map(([value, { label }]) => ({ value, label })),
        ].map(({ value, label }) => {
          const params = new URLSearchParams();
          if (value) params.set("status", value);
          if (q) params.set("q", q);
          params.set("mes", mes);
          params.set("ano", String(ano));
          const href = `/admin/pedidos?${params}`;
          return (
            <Link
              key={value}
              href={href}
              className={`font-body text-xs uppercase tracking-widest px-3 py-1.5 rounded-btn border transition-colors ${
                (status ?? "") === value
                  ? "bg-ink text-cream border-ink"
                  : "border-ink/20 text-ink-soft hover:border-ink hover:text-ink"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <p className="font-body text-sm text-ink-soft">
          {q || status || from ? "Nenhum pedido encontrado para os filtros aplicados." : "Nenhum pedido cadastrado ainda."}
        </p>
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
                        {order.paidAt ? `finalizado ${formatDate(order.paidAt)}` : "em aberto"}
                      </span>
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
