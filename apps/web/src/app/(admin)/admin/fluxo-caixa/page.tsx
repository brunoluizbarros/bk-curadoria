import { getCashFlowYearSummary } from "@/server/queries/cash-flow";
import { formatBRL } from "@/lib/format";
import { IconChartLine } from "@/components/ui/icons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Fluxo de Caixa · BK Admin" } };

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Props {
  searchParams: Promise<{ ano?: string }>;
}

export default async function FluxoCaixaPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const parsedYear = params.ano ? parseInt(params.ano, 10) : NaN;
  const year = Number.isInteger(parsedYear) ? parsedYear : now.getFullYear();

  const months = await getCashFlowYearSummary(year);

  const yearInflow = months.reduce((acc, m) => acc + m.inflowRealizedCents + m.inflowProjectedCents, 0);
  const yearOutflow = months.reduce((acc, m) => acc + m.outflowCents, 0);
  const yearBalanceRealized = months[11].accumulatedRealizedCents;
  const yearBalanceProjected = months[11].accumulatedProjectedCents;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <IconChartLine size={22} className="text-terracotta" />
        <h1 className="font-display font-400 text-3xl text-ink">Fluxo de Caixa</h1>
      </div>

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
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-cream rounded-card px-4 py-4 border border-ink/10">
          <p className="font-body text-[10px] uppercase tracking-widest text-ink-soft mb-1">Entradas {year}</p>
          <p className="font-display text-2xl text-terracotta">{formatBRL(yearInflow)}</p>
        </div>
        <div className="bg-cream rounded-card px-4 py-4 border border-ink/10">
          <p className="font-body text-[10px] uppercase tracking-widest text-ink-soft mb-1">Saídas {year}</p>
          <p className="font-display text-2xl text-ink">{formatBRL(yearOutflow)}</p>
        </div>
        <div className={`rounded-card px-4 py-4 border ${yearBalanceProjected >= 0 ? "bg-sage/10 border-sage/20" : "bg-red-50 border-red-100"}`}>
          <p className="font-body text-[10px] uppercase tracking-widest text-ink-soft mb-1">Saldo {year} (c/ projetado)</p>
          <p className={`font-display text-2xl ${yearBalanceProjected >= 0 ? "text-sage-deep" : "text-red-600"}`}>
            {formatBRL(yearBalanceProjected)}
          </p>
          <p className="font-body text-[10px] text-ink-soft mt-1">Realizado: {formatBRL(yearBalanceRealized)}</p>
        </div>
      </div>

      {/* Tabela mensal */}
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-ink/10">
              <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">Mês</th>
              <th className="text-right py-2 px-3 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">Entradas realizadas</th>
              <th className="text-right py-2 px-3 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">Entradas projetadas</th>
              <th className="text-right py-2 px-3 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">Taxas</th>
              <th className="text-right py-2 px-3 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">Saídas</th>
              <th className="text-right py-2 px-3 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">Saldo do mês</th>
              <th className="text-right py-2 px-3 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">Acumulado realizado</th>
              <th className="text-right py-2 pl-3 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">Acumulado c/ projetado</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.month} className="border-b border-ink/5 hover:bg-ink/[0.02] transition-colors">
                <td className="py-2.5 pr-4 text-ink">{MONTHS[m.month - 1]}</td>
                <td className="text-right px-3 text-terracotta tabular-nums">
                  {m.inflowRealizedCents > 0 ? formatBRL(m.inflowRealizedCents) : "—"}
                </td>
                <td className="text-right px-3 text-gold tabular-nums">
                  {m.inflowProjectedCents > 0 ? formatBRL(m.inflowProjectedCents) : "—"}
                </td>
                <td className="text-right px-3 text-ink-soft tabular-nums">
                  {m.feeCents > 0 ? formatBRL(m.feeCents) : "—"}
                </td>
                <td className="text-right px-3 text-ink-soft tabular-nums">
                  {m.outflowCents > 0 ? formatBRL(m.outflowCents) : "—"}
                </td>
                <td className={`text-right px-3 tabular-nums ${m.balanceCents > 0 ? "text-sage-deep" : m.balanceCents < 0 ? "text-red-600" : "text-ink-soft"}`}>
                  {m.balanceCents !== 0 ? formatBRL(m.balanceCents) : "—"}
                </td>
                <td className={`text-right px-3 font-medium tabular-nums ${m.accumulatedRealizedCents >= 0 ? "text-sage-deep" : "text-red-600"}`}>
                  {formatBRL(m.accumulatedRealizedCents)}
                </td>
                <td className={`text-right pl-3 font-medium tabular-nums ${m.accumulatedProjectedCents >= 0 ? "text-sage-deep" : "text-red-600"}`}>
                  {formatBRL(m.accumulatedProjectedCents)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink/20">
              <td className="py-2.5 pr-4 font-body text-xs uppercase tracking-widest text-ink-soft">Total</td>
              <td className="text-right px-3 text-terracotta font-medium tabular-nums">
                {formatBRL(months.reduce((acc, m) => acc + m.inflowRealizedCents, 0))}
              </td>
              <td className="text-right px-3 text-gold font-medium tabular-nums">
                {formatBRL(months.reduce((acc, m) => acc + m.inflowProjectedCents, 0))}
              </td>
              <td className="text-right px-3 text-ink-soft font-medium tabular-nums">
                {formatBRL(months.reduce((acc, m) => acc + m.feeCents, 0))}
              </td>
              <td className="text-right px-3 text-ink font-medium tabular-nums">{formatBRL(yearOutflow)}</td>
              <td className="text-right px-3" />
              <td className={`text-right px-3 font-medium tabular-nums ${yearBalanceRealized >= 0 ? "text-sage-deep" : "text-red-600"}`}>
                {formatBRL(yearBalanceRealized)}
              </td>
              <td className={`text-right pl-3 font-medium tabular-nums ${yearBalanceProjected >= 0 ? "text-sage-deep" : "text-red-600"}`}>
                {formatBRL(yearBalanceProjected)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
