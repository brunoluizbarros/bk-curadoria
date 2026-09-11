import { getSalesYearSummary } from "@/server/queries/orders";
import { getSalesDetail } from "@/server/queries/report-detail";
import { monthBounds, yearBounds } from "@/server/queries/dre";
import { ReportDetailOverlay } from "@/components/admin/ReportDetailOverlay";
import { formatBRL } from "@/lib/format";
import { IconShoppingCart } from "@/components/ui/icons";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Vendas · BK Admin" } };

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Props {
  searchParams: Promise<{ ano?: string; detalhe?: string; detalheMes?: string }>;
}

export default async function VendasPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const parsedYear = params.ano ? parseInt(params.ano, 10) : NaN;
  const year = Number.isInteger(parsedYear) ? parsedYear : now.getFullYear();

  const months = await getSalesYearSummary(year);
  const yearTotal = months.reduce((acc, m) => acc + m.totalCents, 0);
  const yearOrders = months.reduce((acc, m) => acc + m.orderCount, 0);

  function detalheHref(detalheMonth?: number): string {
    const qs = new URLSearchParams({ ano: String(year), detalhe: "vendas" });
    if (detalheMonth) qs.set("detalheMes", String(detalheMonth));
    return `/admin/vendas?${qs.toString()}`;
  }
  const closeHref = `/admin/vendas?ano=${year}`;

  let detailOverlay: { title: string; rows: Awaited<ReturnType<typeof getSalesDetail>> } | null = null;
  if (params.detalhe === "vendas") {
    const detalheMonth = params.detalheMes ? parseInt(params.detalheMes, 10) : undefined;
    const { from, to } = detalheMonth ? monthBounds(year, detalheMonth) : yearBounds(year);
    const scopeLabel = detalheMonth ? `${MONTHS[detalheMonth - 1]} ${year}` : `${year}`;
    const rows = await getSalesDetail(from, to);
    detailOverlay = { title: `Vendas — ${scopeLabel}`, rows };
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <IconShoppingCart size={22} className="text-terracotta" />
        <h1 className="font-display font-400 text-3xl text-ink">Vendas</h1>
        <span className="font-body text-xs text-ink-soft uppercase tracking-widest">Por data do pedido</span>
      </div>
      <p className="font-body text-sm text-ink-soft mb-6 max-w-2xl">
        Total vendido no mês em que o pedido foi feito (data da venda), esteja pago ou não. Pedidos
        cancelados não contam. Para receita reconhecida por pagamento, veja o{" "}
        <Link href="/admin/dre" className="underline hover:text-ink">DRE</Link>; para o dinheiro que
        efetivamente cai na conta, veja o{" "}
        <Link href="/admin/fluxo-caixa" className="underline hover:text-ink">Fluxo de Caixa</Link>.
      </p>

      {/* Seletor de ano */}
      <form method="get" className="flex items-center gap-3 mb-6">
        <label className="font-body text-xs text-ink-soft">Ano:</label>
        <select
          name="ano"
          defaultValue={year}
          className="border border-ink/20 rounded bg-cream px-3 py-1.5 font-body text-sm text-ink focus:outline-none focus:border-ink"
        >
          {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button type="submit" className="font-body text-xs text-ink-soft hover:text-ink uppercase tracking-widest">
          Filtrar
        </button>
      </form>

      {/* Resumo do ano */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link href={detalheHref()} className="bg-cream rounded-card px-4 py-4 border border-ink/10 hover:border-terracotta/40 transition-colors">
          <p className="font-body text-[10px] uppercase tracking-widest text-ink-soft mb-1">Total vendido {year}</p>
          <p className="font-display text-2xl text-terracotta">{formatBRL(yearTotal)}</p>
        </Link>
        <div className="bg-cream rounded-card px-4 py-4 border border-ink/10">
          <p className="font-body text-[10px] uppercase tracking-widest text-ink-soft mb-1">Pedidos {year}</p>
          <p className="font-display text-2xl text-ink">{yearOrders}</p>
        </div>
      </div>

      {/* Tabela mensal */}
      <section>
        <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-3">Mês a mês</h2>
        <div className="overflow-x-auto">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b border-ink/10">
                <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">Mês</th>
                <th className="text-right py-2 px-3 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">Pedidos</th>
                <th className="text-right py-2 pl-3 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">Total vendido</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.month} className="border-b border-ink/5 hover:bg-ink/[0.02] transition-colors">
                  <td className="py-2.5 pr-4 font-body text-sm text-ink">{MONTHS[m.month - 1]}</td>
                  <td className="text-right px-3 text-ink-soft tabular-nums">{m.orderCount || "—"}</td>
                  <td className="text-right pl-3 text-terracotta font-medium tabular-nums">
                    {m.totalCents > 0 ? (
                      <Link href={detalheHref(m.month)} className="hover:underline">
                        {formatBRL(m.totalCents)}
                      </Link>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink/20">
                <td className="py-2.5 pr-4 font-body text-xs uppercase tracking-widest text-ink-soft">Total</td>
                <td className="text-right px-3 text-ink font-medium tabular-nums">{yearOrders}</td>
                <td className="text-right pl-3 text-terracotta font-medium tabular-nums">
                  <Link href={detalheHref()} className="hover:underline">
                    {formatBRL(yearTotal)}
                  </Link>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {detailOverlay && (
        <ReportDetailOverlay title={detailOverlay.title} rows={detailOverlay.rows} closeHref={closeHref} />
      )}
    </div>
  );
}
