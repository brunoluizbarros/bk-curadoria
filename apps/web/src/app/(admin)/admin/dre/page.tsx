import { getDREYearSummary, getDREByMonth } from "@/server/queries/dre";
import { formatBRL } from "@/lib/format";
import { IconReportMoney } from "@/components/ui/icons";
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
  const parsedYear = params.ano ? parseInt(params.ano, 10) : NaN;
  const year = Number.isInteger(parsedYear) ? parsedYear : now.getFullYear();
  const parsedMonth = params.mes ? parseInt(params.mes, 10) : NaN;
  const selectedMonth = Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : now.getMonth() + 1;

  const [yearSummary, monthDetail] = await Promise.all([
    getDREYearSummary(year),
    getDREByMonth(year, selectedMonth),
  ]);

  const yearRevenue = yearSummary.reduce((acc, m) => acc + m.revenue.totalGrossCents, 0);
  const yearCardFees = yearSummary.reduce((acc, m) => acc + m.cardFeesCents, 0);
  const yearExpenses = yearSummary.reduce((acc, m) => acc + m.expenses.totalCents, 0);
  const yearResult = yearRevenue - yearCardFees - yearExpenses;

  // Coleta todas as categorias que aparecem no ano, ordenadas pelo total anual desc
  const categoryTotalsMap = new Map<string, number>();
  for (const m of yearSummary) {
    for (const c of m.expenses.byCategory) {
      categoryTotalsMap.set(c.name, (categoryTotalsMap.get(c.name) ?? 0) + c.totalCents);
    }
  }
  const allCategories = Array.from(categoryTotalsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <IconReportMoney size={22} className="text-terracotta" />
        <h1 className="font-display font-400 text-3xl text-ink">DRE</h1>
        <span className="font-body text-xs text-ink-soft uppercase tracking-widest">Regime de competência</span>
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
      <div className="grid grid-cols-4 gap-3 mb-8">
        <div className="bg-cream rounded-card px-4 py-4 border border-ink/10">
          <p className="font-body text-[10px] uppercase tracking-widest text-ink-soft mb-1">Receita bruta {year}</p>
          <p className="font-display text-2xl text-terracotta">{formatBRL(yearRevenue)}</p>
        </div>
        <div className="bg-cream rounded-card px-4 py-4 border border-ink/10">
          <p className="font-body text-[10px] uppercase tracking-widest text-ink-soft mb-1">Taxas de cartão {year}</p>
          <p className="font-display text-2xl text-ink-soft">{formatBRL(yearCardFees)}</p>
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
                <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">Mês</th>
                <th className="text-right py-2 px-3 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">Receita bruta</th>
                <th className="text-right py-2 px-3 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">Taxas cartão</th>
                {allCategories.map((cat) => (
                  <th key={cat} className="text-right py-2 px-3 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">
                    {cat}
                  </th>
                ))}
                <th className="text-right py-2 px-3 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">Total desp.</th>
                <th className="text-right py-2 pl-3 text-xs uppercase tracking-widest text-ink-soft font-normal whitespace-nowrap">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {yearSummary.map((m) => {
                const isSelected = m.month === selectedMonth;
                const catByName = Object.fromEntries(
                  m.expenses.byCategory.map((c) => [c.name, c.totalCents])
                );
                return (
                  <tr
                    key={m.month}
                    className={`border-b border-ink/5 transition-colors ${isSelected ? "bg-terracotta/5" : "hover:bg-ink/[0.02]"}`}
                  >
                    <td className="py-2.5 pr-4">
                      <a
                        href={`/admin/dre?ano=${year}&mes=${m.month}`}
                        className={`font-body text-sm ${isSelected ? "text-terracotta font-medium" : "text-ink"}`}
                      >
                        {MONTHS[m.month - 1]}
                      </a>
                    </td>
                    <td className="text-right px-3 text-terracotta tabular-nums">
                      {m.revenue.totalGrossCents > 0 ? formatBRL(m.revenue.totalGrossCents) : "—"}
                    </td>
                    <td className="text-right px-3 text-ink-soft tabular-nums">
                      {m.cardFeesCents > 0 ? formatBRL(m.cardFeesCents) : "—"}
                    </td>
                    {allCategories.map((cat) => {
                      const val = catByName[cat] ?? 0;
                      return (
                        <td key={cat} className="text-right px-3 text-ink-soft tabular-nums">
                          {val > 0 ? formatBRL(val) : "—"}
                        </td>
                      );
                    })}
                    <td className="text-right px-3 text-ink tabular-nums">
                      {m.expenses.totalCents > 0 ? formatBRL(m.expenses.totalCents) : "—"}
                    </td>
                    <td className={`text-right pl-3 font-medium tabular-nums ${m.resultCents > 0 ? "text-sage-deep" : m.resultCents < 0 ? "text-red-600" : "text-ink-soft"}`}>
                      {m.resultCents !== 0 ? formatBRL(m.resultCents) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totais anuais */}
            <tfoot>
              <tr className="border-t-2 border-ink/20">
                <td className="py-2.5 pr-4 font-body text-xs uppercase tracking-widest text-ink-soft">Total</td>
                <td className="text-right px-3 text-terracotta font-medium tabular-nums">
                  {formatBRL(yearRevenue)}
                </td>
                <td className="text-right px-3 text-ink-soft font-medium tabular-nums">
                  {formatBRL(yearCardFees)}
                </td>
                {allCategories.map((cat) => {
                  const total = categoryTotalsMap.get(cat) ?? 0;
                  return (
                    <td key={cat} className="text-right px-3 text-ink-soft font-medium tabular-nums">
                      {total > 0 ? formatBRL(total) : "—"}
                    </td>
                  );
                })}
                <td className="text-right px-3 text-ink font-medium tabular-nums">
                  {formatBRL(yearExpenses)}
                </td>
                <td className={`text-right pl-3 font-medium tabular-nums ${yearResult >= 0 ? "text-sage-deep" : "text-red-600"}`}>
                  {formatBRL(yearResult)}
                </td>
              </tr>
            </tfoot>
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
            <p className="font-body text-[10px] uppercase tracking-widest text-ink-soft mb-2">Receita bruta (vendas do mês)</p>
            <div className="bg-cream rounded-card px-4 py-4 border border-ink/10 space-y-2">
              {Object.entries(monthDetail.revenue.byMethod).length === 0 ? (
                <p className="font-body text-sm text-ink-soft">Nenhuma venda confirmada no mês.</p>
              ) : (
                <>
                  {Object.entries(monthDetail.revenue.byMethod).map(([method, amount]) => (
                    <div key={method} className="flex justify-between font-body text-sm">
                      <span className="text-ink-soft">{METHOD_LABELS[method] ?? method}</span>
                      <span className="text-ink">{formatBRL(amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-body text-sm font-medium border-t border-ink/10 pt-2">
                    <span className="text-ink">Total bruto</span>
                    <span className="text-terracotta">{formatBRL(monthDetail.revenue.totalGrossCents)}</span>
                  </div>
                  {monthDetail.cardFeesCents > 0 && (
                    <div className="flex justify-between font-body text-xs text-ink-soft">
                      <span>(−) Taxas de cartão</span>
                      <span>{formatBRL(monthDetail.cardFeesCents)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Despesas */}
          <div>
            <p className="font-body text-[10px] uppercase tracking-widest text-ink-soft mb-2">Despesas por categoria</p>
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
        </div>
      </section>
    </div>
  );
}
