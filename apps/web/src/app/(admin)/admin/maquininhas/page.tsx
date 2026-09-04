import { getCardMachines } from "@/server/queries/settings";
import {
  createCardMachine,
  updateCardMachine,
  deleteCardMachine,
  setDefaultCardMachine,
} from "@/server/actions/card-machines";
import { Button } from "@/components/ui/Button";
import { FormWithToast } from "@/components/admin/FormWithToast";
import { IconCreditCard } from "@/components/ui/icons";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Maquininhas · BK Admin" } };

const inputClass =
  "w-full border border-ink/20 rounded bg-cream px-2 py-1.5 font-body text-sm text-ink focus:outline-none focus:border-ink";
const labelClass = "block font-body text-[10px] uppercase tracking-widest text-ink-soft mb-1";

const MAX_RATE_INSTALLMENTS = 12;

function num(fd: FormData, key: string): number {
  return parseFloat((fd.get(key) as string) ?? "0") || 0;
}

// Como num() usa `|| fallback`, um 0 legítimo (ex: liquidação no mesmo dia)
// seria trocado pelo fallback. numOr só cai no fallback quando o campo
// estiver vazio ou não for um número válido.
function numOr(fd: FormData, key: string, fallback: number): number {
  const raw = fd.get(key);
  if (raw === null || raw === "") return fallback;
  const n = parseFloat(raw as string);
  return Number.isFinite(n) ? n : fallback;
}

// Lê a grade de taxas por parcela do form (campos rate_1..rate_12);
// parcelas em branco não geram linha — cai no fallback nonAnticipatedFeePercent.
function readRates(fd: FormData): { installments: number; feePercent: number }[] {
  const rates: { installments: number; feePercent: number }[] = [];
  for (let i = 1; i <= MAX_RATE_INSTALLMENTS; i++) {
    const raw = fd.get(`rate_${i}`);
    if (raw === null || raw === "") continue;
    const n = parseFloat(raw as string);
    if (Number.isFinite(n)) rates.push({ installments: i, feePercent: n });
  }
  return rates;
}

function RatesGrid({ rates }: { rates?: { installments: number; feePercent: number }[] }) {
  const byInstallments = new Map((rates ?? []).map((r) => [r.installments, r.feePercent]));
  return (
    <div>
      <label className={labelClass}>Taxa não antecipada por parcela (%)</label>
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: MAX_RATE_INSTALLMENTS }, (_, i) => i + 1).map((n) => (
          <div key={n}>
            <label className="block font-body text-[9px] text-ink-soft text-center mb-0.5">{n}x</label>
            <input
              name={`rate_${n}`}
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="—"
              defaultValue={byInstallments.get(n) ?? ""}
              className={`${inputClass} text-center px-1`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function MaquininhasPage() {
  const machines = await getCardMachines();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <IconCreditCard size={22} className="text-terracotta" />
        <h1 className="font-display font-400 text-3xl text-ink">Maquininhas</h1>
      </div>

      {/* Form criar */}
      <form
        action={async (fd: FormData) => {
          "use server";
          const name = (fd.get("name") as string)?.trim();
          if (name) {
            await createCardMachine({
              name,
              anticipatedFeePercent: num(fd, "anticipatedFeePercent"),
              nonAnticipatedFeePercent: num(fd, "nonAnticipatedFeePercent"),
              anticipationDays: numOr(fd, "anticipationDays", 1),
              active: true,
              rates: readRates(fd),
            });
          }
          redirect("/admin/maquininhas");
        }}
        className="bg-cream rounded-card px-4 py-4 border border-ink/10 mb-8 space-y-3"
      >
        <p className="font-body text-xs uppercase tracking-widest text-ink-soft">Nova maquininha</p>
        <div>
          <label className={labelClass}>Nome</label>
          <input name="name" placeholder="Ex: Stone, Cielo..." className={inputClass} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Taxa antecipada (%)</label>
            <input name="anticipatedFeePercent" type="number" step="0.01" min="0" max="100" defaultValue={0} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Taxa não antecipada padrão (%)</label>
            <input name="nonAnticipatedFeePercent" type="number" step="0.01" min="0" max="100" defaultValue={0} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Prazo antecipado (dias)</label>
            <input name="anticipationDays" type="number" step="1" min="0" defaultValue={1} className={inputClass} />
          </div>
        </div>
        <RatesGrid />
        <Button type="submit" size="sm">Criar</Button>
      </form>

      {machines.length === 0 ? (
        <p className="font-body text-sm text-ink-soft">Nenhuma maquininha cadastrada.</p>
      ) : (
        <div className="space-y-3">
          {machines.map((m) => (
            <div key={m.id} className="bg-cream rounded-card px-4 py-4 border border-ink/10">
              <div className="flex items-center justify-between mb-3">
                <span className="font-body text-sm text-ink font-medium">
                  {m.name}
                  {m.isDefault && <span className="ml-2 font-body text-[10px] text-terracotta uppercase tracking-widest">Padrão</span>}
                  {!m.active && <span className="ml-2 font-body text-[10px] text-ink-soft">(inativa)</span>}
                </span>
                <div className="flex items-center gap-3">
                  {!m.isDefault && (
                    <FormWithToast
                      action={async () => {
                        "use server";
                        return setDefaultCardMachine(m.id);
                      }}
                      successMessage="Maquininha definida como padrão"
                    >
                      <button type="submit" className="font-body text-[10px] text-ink-soft hover:text-ink uppercase tracking-widest transition-colors">
                        Tornar padrão
                      </button>
                    </FormWithToast>
                  )}
                  <FormWithToast
                    action={async () => {
                      "use server";
                      return updateCardMachine(m.id, {
                        name: m.name,
                        anticipatedFeePercent: m.anticipatedFeePercent,
                        nonAnticipatedFeePercent: m.nonAnticipatedFeePercent,
                        anticipationDays: m.anticipationDays,
                        active: !m.active,
                        rates: m.rates,
                      });
                    }}
                    successMessage={m.active ? "Maquininha desativada" : "Maquininha ativada"}
                  >
                    <button type="submit" className="font-body text-[10px] text-ink-soft hover:text-ink uppercase tracking-widest transition-colors">
                      {m.active ? "Desativar" : "Ativar"}
                    </button>
                  </FormWithToast>
                  <FormWithToast
                    action={async () => {
                      "use server";
                      return deleteCardMachine(m.id);
                    }}
                    successMessage="Maquininha excluída"
                  >
                    <button type="submit" className="font-body text-[10px] text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors">
                      Excluir
                    </button>
                  </FormWithToast>
                </div>
              </div>

              <FormWithToast
                action={async (fd: FormData) => {
                  "use server";
                  return updateCardMachine(m.id, {
                    name: (fd.get("name") as string)?.trim() || m.name,
                    anticipatedFeePercent: num(fd, "anticipatedFeePercent"),
                    nonAnticipatedFeePercent: num(fd, "nonAnticipatedFeePercent"),
                    anticipationDays: numOr(fd, "anticipationDays", 1),
                    active: m.active,
                    rates: readRates(fd),
                  });
                }}
                successMessage="Maquininha atualizada"
                className="space-y-3"
              >
                <div>
                  <label className={labelClass}>Nome</label>
                  <input name="name" defaultValue={m.name} className={inputClass} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Taxa antecipada (%)</label>
                    <input name="anticipatedFeePercent" type="number" step="0.01" min="0" max="100" defaultValue={m.anticipatedFeePercent} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Taxa não antecipada padrão (%)</label>
                    <input name="nonAnticipatedFeePercent" type="number" step="0.01" min="0" max="100" defaultValue={m.nonAnticipatedFeePercent} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Prazo antecipado (dias)</label>
                    <input name="anticipationDays" type="number" step="1" min="0" defaultValue={m.anticipationDays} className={inputClass} />
                  </div>
                </div>
                <RatesGrid rates={m.rates} />
                <Button type="submit" variant="ghost" size="sm">Salvar</Button>
              </FormWithToast>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
