import Link from "next/link";
import { formatBRL, formatDate } from "@/lib/format";
import type { ReportDetailRow } from "@/server/queries/report-detail";

// Overlay 100% server-renderizado — nenhum client JS. O estado (aberto/qual
// item) vive na própria URL via searchParams; fechar é só um link de volta
// pra URL sem os params de detalhe. O `<a>` de fundo cobre a tela inteira e
// fica ATRÁS do card no DOM: clique fora do card cai nele e fecha, clique
// dentro do card é capturado pelo card (que é pintado por cima).
export function ReportDetailOverlay({
  title,
  rows,
  closeHref,
}: {
  title: string;
  rows: ReportDetailRow[];
  closeHref: string;
}) {
  const totalCents = rows.reduce((acc, r) => acc + r.amountCents, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <Link href={closeHref} aria-label="Fechar" className="absolute inset-0 bg-ink/40" />
      <div className="relative bg-cream rounded-card border border-ink/10 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/10">
          <h2 className="font-body text-sm font-medium text-ink">{title}</h2>
          <Link href={closeHref} className="font-body text-xs text-ink-soft hover:text-ink uppercase tracking-widest">
            Fechar
          </Link>
        </div>

        <div className="overflow-y-auto px-5 py-3">
          {rows.length === 0 ? (
            <p className="font-body text-sm text-ink-soft py-4">Nenhum item no período.</p>
          ) : (
            <table className="w-full font-body text-sm">
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-ink/5">
                    <td className="py-2 pr-3 text-ink-soft tabular-nums whitespace-nowrap">{formatDate(r.date)}</td>
                    <td className="py-2 px-3">
                      <Link href={r.href} className="text-ink hover:text-terracotta">
                        {r.label}
                      </Link>
                      <span className="block text-xs text-ink-soft">{r.sublabel}</span>
                    </td>
                    <td className="py-2 pl-3 text-right text-ink font-medium tabular-nums whitespace-nowrap">
                      {formatBRL(r.amountCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-between px-5 py-3 border-t border-ink/10 font-body text-sm font-medium">
          <span className="text-ink-soft">Total ({rows.length} {rows.length === 1 ? "item" : "itens"})</span>
          <span className="text-ink">{formatBRL(totalCents)}</span>
        </div>
      </div>
    </div>
  );
}
