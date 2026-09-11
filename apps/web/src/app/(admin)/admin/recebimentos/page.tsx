import { getReceivables, getReceivableMonths, type ReceivableSort, type ReceivableStatus } from "@/server/queries/payments";
import { markReceivableSettled } from "@/server/actions/payments";
import { FormWithToast } from "@/components/admin/FormWithToast";
import { Button } from "@/components/ui/Button";
import { formatBRL, formatDate } from "@/lib/format";
import { IconCashBanknote, IconCircleCheck, IconSearch } from "@/components/ui/icons";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Recebimentos · BK Admin" } };

function formatMonthLabel(ym: string) {
  const [year, month] = ym.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

const METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  cash: "Dinheiro",
  transfer: "Transferência",
};

const STATUS_LABELS: Record<ReceivableStatus, string> = {
  pending: "Pendente",
  settled: "Liquidado",
};

export default async function RecebimentosPage({
  searchParams,
}: {
  searchParams: Promise<{ ym?: string; q?: string; sort?: string; status?: string }>;
}) {
  const { ym: ymParam, q, sort: sortParam, status: statusParam } = await searchParams;
  const ym = ymParam ?? new Date().toISOString().slice(0, 7);
  const status: ReceivableStatus | undefined =
    statusParam === "pending" || statusParam === "settled" ? statusParam : undefined;
  const sort: ReceivableSort =
    sortParam === "date_desc" ||
    sortParam === "name_asc" ||
    sortParam === "name_desc" ||
    sortParam === "value_asc" ||
    sortParam === "value_desc"
      ? sortParam
      : "date_asc";

  const [receivables, months] = await Promise.all([
    getReceivables({ ym: ym || undefined, search: q || undefined, status }, sort),
    getReceivableMonths(),
  ]);

  const pendingTotal = receivables.filter((r) => !r.settledAt).reduce((acc, r) => acc + r.netCents, 0);
  const installmentLabel = (r: (typeof receivables)[number]) =>
    r.payment.installments > 1 ? `${r.installmentNumber}/${r.payment.installments}` : null;

  function sortHref(field: "date" | "name" | "value") {
    const isActive = sort.startsWith(field);
    const nextDir = isActive && sort.endsWith("_asc") ? "desc" : "asc";
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    params.set("ym", ym);
    params.set("sort", `${field}_${nextDir}`);
    return `/admin/recebimentos?${params}`;
  }

  function sortArrow(field: "date" | "name" | "value") {
    if (!sort.startsWith(field)) return "";
    return sort.endsWith("_asc") ? " ↑" : " ↓";
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <IconCashBanknote size={22} className="text-terracotta" />
        <h1 className="font-display font-400 text-3xl text-ink">Recebimentos</h1>
      </div>

      {/* Abas de mês */}
      <div className="flex gap-1 overflow-x-auto mb-4 pb-px">
        {[{ value: "", label: "Todos" }, ...months.map((m) => ({ value: m, label: formatMonthLabel(m) }))].map(
          ({ value, label }) => {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (status) params.set("status", status);
            params.set("ym", value);
            const href = `/admin/recebimentos?${params}`;
            return (
              <Link
                key={value || "todos"}
                href={href}
                className={`shrink-0 px-3 py-1.5 rounded-btn font-body text-xs transition-colors whitespace-nowrap capitalize ${
                  ym === value ? "bg-ink text-cream" : "border border-ink/20 text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {label}
              </Link>
            );
          }
        )}
      </div>

      {/* Busca por cliente */}
      <form method="get" className="mb-4 flex gap-2">
        <input type="hidden" name="ym" value={ym} />
        <input type="hidden" name="sort" value={sort} />
        {status && <input type="hidden" name="status" value={status} />}
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
        {[{ value: "", label: "Todos" }, ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))].map(
          ({ value, label }) => {
            const params = new URLSearchParams();
            if (value) params.set("status", value);
            if (q) params.set("q", q);
            params.set("ym", ym);
            const href = `/admin/recebimentos?${params}`;
            return (
              <Link
                key={value || "todos"}
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
          }
        )}
      </div>

      {/* Ordenação */}
      <div className="flex items-center gap-2 mb-4">
        <span className="font-body text-xs text-ink-soft uppercase tracking-widest">Ordenar por</span>
        {(["date", "name", "value"] as const).map((field) => (
          <Link
            key={field}
            href={sortHref(field)}
            className={`font-body text-xs px-3 py-1.5 rounded-btn border transition-colors ${
              sort.startsWith(field)
                ? "bg-ink text-cream border-ink"
                : "border-ink/20 text-ink-soft hover:border-ink hover:text-ink"
            }`}
          >
            {field === "date" ? "Data" : field === "name" ? "Cliente" : "Valor"}
            {sortArrow(field)}
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft">
          {receivables.length} {receivables.length === 1 ? "recebível" : "recebíveis"}
        </h2>
        {pendingTotal > 0 && (
          <span className="font-body text-sm text-gold font-medium">{formatBRL(pendingTotal)} aguardando</span>
        )}
      </div>

      {receivables.length === 0 ? (
        <p className="font-body text-sm text-ink-soft">Nenhum recebível encontrado para os filtros aplicados.</p>
      ) : (
        <div className="space-y-2">
          {receivables.map((r) => (
            <div
              key={r.id}
              className={`flex items-center gap-4 bg-cream rounded-card px-4 py-3 border ${
                r.settledAt ? "border-ink/10 opacity-80" : "border-gold/30"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-ink truncate">{r.customer.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-body text-xs text-ink-soft">{METHOD_LABELS[r.payment.method] ?? r.payment.method}</span>
                  {installmentLabel(r) && (
                    <span className="font-body text-xs text-ink-soft">· {installmentLabel(r)}</span>
                  )}
                  {r.settledAt ? (
                    <span className="font-body text-xs text-sage-deep flex items-center gap-1">
                      · <IconCircleCheck size={10} /> liquidado {formatDate(r.settledAt)}
                    </span>
                  ) : (
                    <span className="font-body text-xs text-ink-soft">· previsto {formatDate(r.expectedAt)}</span>
                  )}
                </div>
                {r.payment.reference && (
                  <p className="font-body text-[10px] text-ink-soft mt-0.5 truncate">{r.payment.reference}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-body text-sm text-terracotta font-medium">{formatBRL(r.netCents)}</p>
                {r.feeCents > 0 && (
                  <p className="font-body text-[10px] text-ink-soft">taxa {formatBRL(r.feeCents)}</p>
                )}
              </div>
              {!r.settledAt && (
                <FormWithToast
                  action={async () => {
                    "use server";
                    return markReceivableSettled(r.id, r.order.id);
                  }}
                  successMessage="Recebível liquidado"
                >
                  <Button type="submit" variant="ghost" size="sm">
                    <IconCircleCheck size={12} />
                    Liquidar
                  </Button>
                </FormWithToast>
              )}
              <Link
                href={`/admin/pedidos/${r.order.id}`}
                className="font-body text-[10px] text-ink-soft hover:text-ink uppercase tracking-widest shrink-0"
              >
                Ver pedido
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
