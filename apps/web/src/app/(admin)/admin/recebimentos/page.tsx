import { getPendingSettlements, getRecentSettlements } from "@/server/queries/payments";
import { markReceivableSettled } from "@/server/actions/payments";
import { Button } from "@/components/ui/Button";
import { formatBRL, formatDate } from "@/lib/format";
import { IconCashBanknote, IconCircleCheck, IconClock } from "@/components/ui/icons";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Recebimentos · BK Admin" } };

const METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  cash: "Dinheiro",
  transfer: "Transferência",
};

export default async function RecebimentosPage() {
  const [pending, recent] = await Promise.all([
    getPendingSettlements(),
    getRecentSettlements(60),
  ]);

  const pendingTotal = pending.reduce((acc, p) => acc + p.netCents, 0);
  const installmentLabel = (p: (typeof pending)[number]) =>
    p.payment.installments > 1 ? `${p.installmentNumber}/${p.payment.installments}` : null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <IconCashBanknote size={22} className="text-terracotta" />
        <h1 className="font-display font-400 text-3xl text-ink">Recebimentos</h1>
      </div>

      {/* A receber */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft flex items-center gap-1.5">
            <IconClock size={12} />
            A liquidar ({pending.length})
          </h2>
          {pendingTotal > 0 && (
            <span className="font-body text-sm text-gold font-medium">{formatBRL(pendingTotal)} aguardando</span>
          )}
        </div>

        {pending.length === 0 ? (
          <p className="font-body text-sm text-ink-soft">Nenhum recebimento pendente.</p>
        ) : (
          <div className="space-y-2">
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 bg-cream rounded-card px-4 py-3 border border-gold/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-ink truncate">{p.customer.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-body text-xs text-ink-soft">{METHOD_LABELS[p.payment.method] ?? p.payment.method}</span>
                    {installmentLabel(p) && (
                      <span className="font-body text-xs text-ink-soft">· {installmentLabel(p)}</span>
                    )}
                    <span className="font-body text-xs text-ink-soft">· previsto {formatDate(p.expectedAt)}</span>
                  </div>
                  {p.payment.reference && (
                    <p className="font-body text-[10px] text-ink-soft mt-0.5 truncate">{p.payment.reference}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-body text-sm text-terracotta font-medium">{formatBRL(p.netCents)}</p>
                </div>
                <form action={async () => { "use server"; await markReceivableSettled(p.id, p.order.id); }}>
                  <Button type="submit" variant="ghost" size="sm">
                    <IconCircleCheck size={12} />
                    Liquidar
                  </Button>
                </form>
                <Link
                  href={`/admin/pedidos/${p.order.id}`}
                  className="font-body text-[10px] text-ink-soft hover:text-ink uppercase tracking-widest"
                >
                  Ver pedido
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Liquidados recentes */}
      <section>
        <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft flex items-center gap-1.5 mb-3">
          <IconCircleCheck size={12} />
          Liquidados (últimos 60 dias)
        </h2>

        {recent.length === 0 ? (
          <p className="font-body text-sm text-ink-soft">Nenhum recebimento liquidado no período.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 bg-cream rounded-card px-4 py-3 border border-ink/10 opacity-80"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-ink truncate">{p.customer.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-body text-xs text-ink-soft">{METHOD_LABELS[p.payment.method] ?? p.payment.method}</span>
                    {installmentLabel(p) && (
                      <span className="font-body text-xs text-ink-soft">· {installmentLabel(p)}</span>
                    )}
                    {p.settledAt && (
                      <span className="font-body text-xs text-ink-soft">· liquidado {formatDate(p.settledAt)}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-body text-sm text-ink">{formatBRL(p.netCents)}</p>
                </div>
                <Link
                  href={`/admin/pedidos/${p.order.id}`}
                  className="font-body text-[10px] text-ink-soft hover:text-ink uppercase tracking-widest"
                >
                  Ver
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
