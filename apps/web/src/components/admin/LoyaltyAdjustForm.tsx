"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { adjustCustomerCredit } from "@/server/actions/loyalty";
import { Button } from "@/components/ui/Button";

interface Props {
  customerId: string;
}

export function LoyaltyAdjustForm({ customerId }: Props) {
  const [open, setOpen] = useState(false);
  const [amountReais, setAmountReais] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const reais = parseFloat(amountReais.replace(",", "."));
    if (!reais || isNaN(reais) || reais === 0) {
      toast.error("Informe um valor diferente de zero.");
      return;
    }
    const cents = Math.round(reais * 100);
    startTransition(async () => {
      const result = await adjustCustomerCredit(customerId, cents, notes);
      if (result && "error" in result) {
        toast.error(result.error as string);
      } else {
        toast.success(cents > 0 ? "Crédito adicionado." : "Crédito removido.");
        setAmountReais("");
        setNotes("");
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-body text-xs text-ink-soft hover:text-ink transition-colors uppercase tracking-widest"
      >
        + Ajuste manual
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-cream rounded-card border border-ink/10 px-4 py-3 space-y-3">
      <p className="font-body text-xs text-ink-soft uppercase tracking-widest">Ajuste manual de crédito</p>
      <p className="font-body text-[10px] text-ink-soft">
        Use valores positivos para adicionar crédito e negativos para remover (ex: −10).
      </p>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-xs text-ink-soft">R$</span>
          <input
            type="number"
            step="0.01"
            value={amountReais}
            onChange={(e) => setAmountReais(e.target.value)}
            placeholder="0,00"
            required
            className="w-full pl-8 pr-3 py-1.5 border border-ink/20 bg-cream rounded font-body text-sm text-ink focus:outline-none focus:border-ink"
          />
        </div>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Motivo (opcional)"
          className="flex-[2] px-3 py-1.5 border border-ink/20 bg-cream rounded font-body text-sm text-ink focus:outline-none focus:border-ink"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando..." : "Confirmar ajuste"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
