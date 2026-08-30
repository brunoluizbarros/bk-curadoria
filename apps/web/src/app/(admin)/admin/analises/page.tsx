import Link from "next/link";
import { getCustomerPurchaseRanking, type CustomerPurchaseRanking } from "@/server/queries/analytics";
import { formatBRL } from "@/lib/format";
import { IconChartBar } from "@/components/ui/icons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Análises · BK Admin" } };

const RANKING_SIZE = 20;

export default async function AnalisesPage() {
  const ranking = await getCustomerPurchaseRanking(12);

  const byValue = [...ranking].sort((a, b) => b.totalCents - a.totalCents).slice(0, RANKING_SIZE);
  const byFrequency = [...ranking].sort((a, b) => b.orderCount - a.orderCount).slice(0, RANKING_SIZE);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <IconChartBar size={22} className="text-terracotta" />
        <h1 className="font-display font-400 text-3xl text-ink">Análises</h1>
        <span className="font-body text-xs text-ink-soft uppercase tracking-widest">Últimos 12 meses</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RankingTable
          title="Clientes que mais compram (valor)"
          rows={byValue}
          valueLabel="Total"
          renderValue={(r) => formatBRL(r.totalCents)}
        />
        <RankingTable
          title="Clientes mais frequentes (pedidos)"
          rows={byFrequency}
          valueLabel="Pedidos"
          renderValue={(r) => `${r.orderCount}×`}
        />
      </div>
    </div>
  );
}

function RankingTable({
  title,
  rows,
  valueLabel,
  renderValue,
}: {
  title: string;
  rows: CustomerPurchaseRanking[];
  valueLabel: string;
  renderValue: (r: CustomerPurchaseRanking) => string;
}) {
  return (
    <section>
      <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-3">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-ink/10">
              <th className="text-left py-2 pr-3 text-xs uppercase tracking-widest text-ink-soft font-normal w-8">#</th>
              <th className="text-left py-2 px-3 text-xs uppercase tracking-widest text-ink-soft font-normal">Cliente</th>
              <th className="text-right py-2 pl-3 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">
                {valueLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 font-body text-sm text-ink-soft">
                  Nenhuma compra no período.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.customerId} className="border-b border-ink/5 hover:bg-ink/[0.02] transition-colors">
                  <td className="py-2.5 pr-3 text-ink-soft tabular-nums">{i + 1}</td>
                  <td className="py-2.5 px-3">
                    <Link href={`/admin/clientes/${r.customerId}`} className="text-ink hover:text-terracotta">
                      {r.name}
                    </Link>
                  </td>
                  <td className="text-right pl-3 text-terracotta font-medium tabular-nums whitespace-nowrap">
                    {renderValue(r)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
