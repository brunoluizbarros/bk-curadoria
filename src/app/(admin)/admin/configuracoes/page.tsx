import { getPaymentFeeConfigs } from "@/server/queries/settings";
import { savePaymentFeeConfigs } from "@/server/actions/settings";
import { Button } from "@/components/ui/Button";
import { IconSettings } from "@/components/ui/icons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Configurações · BK Admin" } };

const METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  cash: "Dinheiro",
  transfer: "Transferência",
};

const METHODS = ["pix", "credit_card", "debit_card", "cash", "transfer"];

export default async function ConfiguracoesPage() {
  const feeConfigs = await getPaymentFeeConfigs();

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <IconSettings size={22} className="text-terracotta" />
        <h1 className="font-display font-400 text-3xl text-ink">Configurações</h1>
      </div>

      <section>
        <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-1">
          Taxas padrão por método de pagamento
        </h2>
        <p className="font-body text-xs text-ink-soft mb-4">
          Pré-preenche o campo de taxa ao registrar um pagamento.
        </p>

        <form action={savePaymentFeeConfigs} className="space-y-3">
          <div className="bg-cream rounded-card border border-ink/10 divide-y divide-ink/5">
            {METHODS.map((method) => (
              <div key={method} className="flex items-center justify-between px-4 py-3">
                <label
                  htmlFor={`fee-${method}`}
                  className="font-body text-sm text-ink"
                >
                  {METHOD_LABELS[method]}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`fee-${method}`}
                    name={method}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    defaultValue={feeConfigs[method] ?? 0}
                    className="w-20 border border-ink/20 rounded bg-cream-soft px-2 py-1 font-body text-sm text-ink text-right focus:outline-none focus:border-ink"
                  />
                  <span className="font-body text-sm text-ink-soft">%</span>
                </div>
              </div>
            ))}
          </div>

          <Button type="submit">Salvar configurações</Button>
        </form>
      </section>
    </div>
  );
}
