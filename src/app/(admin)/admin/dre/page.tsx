import { getDREYearSummary, getDREByMonth } from "@/server/queries/dre";
import { formatBRL } from "@/lib/format";
import { IconReportMoney, IconClock } from "@/components/ui/icons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "DRE · BK Admin" } };

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão crédito",
  debit_card: "Cartão débito",
  cash: "Dinheiro",
  transfer: "Transferência",
};

interface Props {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}

export default async function DREPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const year = params.ano ? parseInt(params.ano, 10) : now.getFullYear();
  const selectedMonth = params.mes ? parseInt(params.mes, 10) : now.getMonth() + 1;

  const [yearSummary, monthDetail] = await Promise.all([
    getDREYearSummary(year),
    getDREByMonth(year, selectedMonth),
  ]);

  const yearRevenue = yearSummary.reduce((acc, m) => acc + m.revenue.totalNetCents, 0);
  const yearExpenses = yearSummary.reduce((acc, m) => acc + m.expenses.totalCents, 0);
  const yearResult = yearRevenue - yearExpenses;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <IconReportMoney size={22} className="text-terracotta" />
        <h1 className="font-display font-400 text-3xl text-ink">DRE</h1>
        <span className="font-body text-xs text-ink-soft uppercase tracking-widest">Regime de caixa</span>
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
          <p className="font-body text-[10px] uppercase tracking-widest text-ink-soft mb-1">Receita {year}</p>
          <p className="font-display text-2xl text-terracotta">{formatBRL(yearRevenue)}</p>
        </div>
        <div className="bg-cream rounded-card px-4 py-4 border border-ink/10">
          <p className="font-body text-[10px] uppercase tracking-widest text-ink-soft mb-1">Despesas {year}</p>
          <p className="font-display text-2xl text-ink">{formatBRL(yearExpenses)}</p>
        </div>
        <div className={`rounded-card px-4 py-4 border ${yearResult >= 0 ? "bg-sage/10 border-sage/20" : "bg-red-50 border-red-100"}`}>
          <p className="font-body text-[10px] uppercase tracking-widest text-ink-soft mb-1">Resultado {year}</p>
          <p className={`font-display text-2xl ${yearResult >= 0 ? "text-sage-deep" : "text-red-600"}`}>
            {formatBRL(yearResult)}
          </p>
        </div>
      </div>

      {/* Tabela mensal */}
      <section className="mb-8">
        <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-3">Mês a mês</h2>
        <div className="overflow-x-auto">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b border-ink/10">
                <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest text-ink-soft font-normal">Mês</th>
                <th className="text-right py-2 px-4 text-xs uppercase tracking-widest text-ink-soft font-normal">Receita</th>
                <th className="text-right py-2 px-4 text-xs uppercase tracking-widest text-ink-soft font-normal">Despesa</th>
                <th className="text-right py-2 pl-4 text-xs uppercase tracking-widest text-ink-soft font-normal">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {yearSummary.map((m) => {
                const result = m.revenue.totalNetCents - m.expenses.totalCents;
                const isSelected = m.month === selectedMonth;
                return (
                  <tr
                    key={m.month}
                    className={`border-b border-ink/5 transition-colors cursor-pointer hover:bg-ink/3 ${isSelected ? "bg-terracotta/5" : ""}`}
                  >
                    <td className="py-2.5 pr-4">
                      <a
                        href={`/admin/dre?ano=${year}&mes=${m.month}`}
                        className={`font-body text-sm ${isSelected ? "text-terracotta font-medium" : "text-ink"}`}
                      >
                        {MONTHS[m.month - 1]}
                      </a>
                    </td>
                    <td className="text-right px-4 text-terracotta">
                      {m.revenue.totalNetCents > 0 ? formatBRL(m.revenue.totalNetCents) : "—"}
                    </td>
                    <td className="text-right px-4 text-ink-soft">
                      {m.expenses.totalCents > 0 ? formatBRL(m.expenses.totalCents) : "—"}
                    </td>
                    <td className={`text-right pl-4 font-medium ${result > 0 ? "text-sage-deep" : result < 0 ? "text-red-600" : "text-ink-soft"}`}>
                      {result !== 0 ? formatBRL(result) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detalhe do mês selecionado */}
      <section>
        <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-4">
          {MONTHS[selectedMonth - 1]} {year} — Detalhe
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Receita */}
          <div>
            <p className="font-body text-[10px] uppercase tracking-widest text-ink-soft mb-2">Receita líquida</p>
            <div className="bg-cream rounded-card px-4 py-4 border border-ink/10 space-y-2">
              {Object.entries(monthDetail.revenue.byMethod).length === 0 ? (
                <p className="font-body text-sm text-ink-soft">Nenhum recebimento liquidado.</p>
              ) : (
                <>
                  {Object.entries(monthDetail.revenue.byMethod).map(([method, amount]) => (
                    <div key={method} className="flex justify-between font-body text-sm">
                      <span className="text-ink-soft">{METHOD_LABELS[method] ?? method}</span>
                      <span className="text-ink">{formatBRL(amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-body text-sm font-medium border-t border-ink/10 pt-2">
                    <span className="text-ink">Total líquido</span>
                    <span className="text-terracotta">{formatBRL(monthDetail.revenue.totalNetCents)}</span>
                  </div>
                  {monthDetail.pendingSettlementCents > 0 && (
                    <div className="flex items-center gap-1 font-body text-xs text-gold">
                      <IconClock size={10} />
                      + {formatBRL(monthDetail.pendingSettlementCents)} aguardando liquidação
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Despesas */}
          <div>
            <p className="font-body text-[10px] uppercase tracking-widest text-ink-soft mb-2">Despesas</p>
            <div className="bg-cream rounded-card px-4 py-4 border border-ink/10 space-y-2">
              {monthDetail.expenses.byCategory.length === 0 ? (
                <p className="font-body text-sm text-ink-soft">Nenhuma despesa no mês.</p>
              ) : (
                <>
                  {monthDetail.expenses.byCategory.map(({ name, totalCents }) => (
                    <div key={name} className="flex justify-between font-body text-sm">
                      <span className="text-ink-soft">{name}</span>
                      <span className="text-ink">{formatBRL(totalCents)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-body text-sm font-medium border-t border-ink/10 pt-2">
                    <span className="text-ink">Total</span>
                    <span className="text-ink">{formatBRL(monthDetail.expenses.totalCents)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Resultado do mês */}
        <div className={`mt-4 rounded-card px-4 py-4 border ${monthDetail.resultCents >= 0 ? "bg-sage/10 border-sage/20" : "bg-red-50 border-red-100"}`}>
          <div className="flex justify-between items-center">
            <span className="font-body text-sm text-ink-soft">Resultado de {MONTHS[selectedMonth - 1]}</span>
            <span className={`font-display text-2xl ${monthDetail.resultCents >= 0 ? "text-sage-deep" : "text-red-600"}`}>
              {formatBRL(monthDetail.resultCents)}
            </span>
          </div>
          {monthDetail.pendingSettlementCents > 0 && (
            <p className="font-body text-xs text-ink-soft mt-1">
              Desconsiderando {formatBRL(monthDetail.pendingSettlementCents)} aguardando liquidação de cartões.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
