"use client";

import { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentSchema, type PaymentInput } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { calcFeeCents, calcNetCents, resolveFeePercent } from "@/lib/fees";
import { formatBRL } from "@/lib/format";
import type { CardMachineWithRates } from "@/server/queries/settings";

const METHODS = [
  { value: "pix", label: "Pix" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "debit_card", label: "Cartão de débito" },
  { value: "cash", label: "Dinheiro" },
  { value: "transfer", label: "Transferência" },
] as const;

const BRANDS = ["Visa", "Mastercard", "Elo", "Hipercard", "Amex", "Outro"];

interface PaymentFormProps {
  defaultValues?: Partial<PaymentInput>;
  feeConfigs?: Record<string, number>;
  machines?: CardMachineWithRates[];
  onSubmit: (data: PaymentInput) => Promise<{ error?: unknown } | undefined>;
  submitLabel?: string;
  onCancel?: () => void;
}

export function PaymentForm({ defaultValues, feeConfigs = {}, machines = [], onSubmit, submitLabel = "Registrar pagamento", onCancel }: PaymentFormProps) {
  const initialMethod = (defaultValues?.method ?? "pix") as string;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      method: "pix" as const,
      installments: 1,
      feePercent: feeConfigs[initialMethod] ?? 0,
      feeCents: 0,
      netCents: 0,
      grossCents: 0,
      paidAt: new Date().toISOString().slice(0, 10),
      // Maquininha marcada como padrão em /admin/maquininhas, pré-selecionada.
      machineId: machines.find((m) => m.isDefault)?.id ?? "",
      anticipated: true,
      ...defaultValues,
    },
  });

  const grossCents = watch("grossCents");
  const feePercent = watch("feePercent");
  const method = watch("method");
  const machineId = watch("machineId");
  const anticipated = watch("anticipated");
  const installments = watch("installments");
  const isCard = method === "credit_card" || method === "debit_card";
  const canDefer = method === "credit_card"; // débito não parcela/antecipa
  const selectedMachine = machines.find((m) => m.id === machineId) ?? null;

  // Reset card-only fields for non-card methods. machineId NÃO é limpo aqui:
  // o select só aparece quando isCard, e o servidor já força machineId=null
  // para métodos não-cartão — limpar no cliente só apagaria a maquininha
  // padrão pré-selecionada antes do usuário trocar para cartão.
  useEffect(() => {
    if (!isCard) {
      setValue("brand", "");
      setValue("installments", 1);
      setValue("anticipated", true);
    } else if (!canDefer) {
      setValue("anticipated", true);
    }
  }, [isCard, canDefer, setValue]);

  // Taxa segue a mesma resolução usada no servidor: maquininha (antecipada
  // ou não) > taxa padrão do método. É só preview — o servidor recalcula.
  useEffect(() => {
    const resolved = resolveFeePercent(
      method,
      canDefer ? anticipated : true,
      canDefer ? installments : 1,
      selectedMachine,
      feeConfigs
    );
    setValue("feePercent", resolved);
  }, [method, anticipated, canDefer, installments, selectedMachine, feeConfigs, setValue]);

  useEffect(() => {
    if (grossCents && feePercent !== undefined) {
      setValue("feeCents", calcFeeCents(grossCents, feePercent));
      setValue("netCents", calcNetCents(grossCents, feePercent));
    }
  }, [grossCents, feePercent, setValue]);

  const busy = useRef(false);

  async function onValid(data: PaymentInput) {
    // ponytail: disabled={isSubmitting} depende de re-render; um duplo clique rápido
    // ou o submit implícito do Enter escapa. Ref bloqueia sincronamente.
    if (busy.current) return;
    busy.current = true;
    try {
      await onSubmit(data);
    } finally {
      busy.current = false;
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onValid)}
      onKeyDown={(e) => {
        // ponytail: Enter em input de texto/data não deve registrar o pagamento —
        // só o clique no botão "Registrar pagamento" deve submeter o form.
        const el = e.target as HTMLElement;
        if (e.key === "Enter" && el.tagName !== "TEXTAREA" && (el as HTMLButtonElement).type !== "submit") {
          e.preventDefault();
        }
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-body text-xs uppercase tracking-widest text-ink-soft mb-1">
            Método
          </label>
          <select
            {...register("method")}
            className="w-full rounded border border-ink/20 bg-cream px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink"
          >
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          {errors.method && (
            <p className="font-body text-xs text-red-600 mt-0.5">{errors.method.message}</p>
          )}
        </div>

        <Controller
          control={control}
          name="grossCents"
          render={({ field }) => (
            <Input
              id="grossCents"
              label="Valor bruto"
              placeholder="R$ 0,00"
              inputMode="numeric"
              value={
                field.value
                  ? (field.value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  : ""
              }
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                field.onChange(digits === "" ? 0 : parseInt(digits, 10));
              }}
              error={errors.grossCents?.message}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {selectedMachine ? (
          <div>
            <p className="font-body text-xs uppercase tracking-widest text-ink-soft mb-1">Taxa (%)</p>
            <p className="font-body text-sm text-ink-soft py-2">{feePercent ?? 0}%</p>
          </div>
        ) : (
          <Input
            id="feePercent"
            label="Taxa (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="0"
            {...register("feePercent", { valueAsNumber: true })}
            error={errors.feePercent?.message}
          />
        )}
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-ink-soft mb-1">Taxa (R$)</p>
          <p className="font-body text-sm text-ink-soft py-2">
            {grossCents && feePercent ? formatBRL(calcFeeCents(grossCents, feePercent)) : "—"}
          </p>
        </div>
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-ink-soft mb-1">Líquido</p>
          <p className="font-body text-sm font-medium text-ink py-2">
            {grossCents ? formatBRL(calcNetCents(grossCents, feePercent ?? 0)) : "—"}
          </p>
        </div>
      </div>

      {(method === "credit_card" || method === "debit_card") && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-xs uppercase tracking-widest text-ink-soft mb-1">
              Bandeira
            </label>
            <select
              {...register("brand")}
              className="w-full rounded border border-ink/20 bg-cream px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink"
            >
              <option value="">Selecione...</option>
              {BRANDS.map((b) => (
                <option key={b} value={b.toLowerCase()}>{b}</option>
              ))}
            </select>
          </div>
          <Input
            id="installments"
            label="Parcelas"
            type="number"
            min="1"
            max="24"
            {...register("installments", { valueAsNumber: true })}
          />
          <div>
            <label className="block font-body text-xs uppercase tracking-widest text-ink-soft mb-1">
              Maquininha
            </label>
            <select
              {...register("machineId")}
              className="w-full rounded border border-ink/20 bg-cream px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink"
            >
              <option value="">Sem maquininha (taxa padrão)</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          {canDefer && (
            <label className="flex items-center gap-2 font-body text-sm text-ink pt-6">
              <input type="checkbox" {...register("anticipated")} className="w-4 h-4 rounded border-ink/20 accent-terracotta" />
              Antecipado
            </label>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="paidAt"
          label="Data do pagamento"
          type="date"
          {...register("paidAt")}
          error={errors.paidAt?.message}
        />
        {!(canDefer && !anticipated && installments > 1) && (
          <Input
            id="settledAt"
            label="Liquidação (caiu na conta)"
            type="date"
            {...register("settledAt")}
          />
        )}
      </div>

      <Input
        id="reference"
        label="Referência / Link de pagamento (opcional)"
        placeholder="ID da transação, URL..."
        {...register("reference")}
      />

      <Textarea
        id="notes"
        label="Observações"
        rows={2}
        {...register("notes")}
      />

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
