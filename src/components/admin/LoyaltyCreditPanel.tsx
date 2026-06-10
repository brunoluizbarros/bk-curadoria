"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { applyCreditToOrder, removeCreditFromOrder } from "@/server/actions/loyalty";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/Button";

interface Props {
  orderId: string;
  customerId: string;
  balanceCents: number;
  creditAppliedCents: number;
  orderStatus: string;
}

export function LoyaltyCreditPanel({
  orderId,
  customerId: _customerId,
  balanceCents,
  creditAppliedCents,
  orderStatus,
}: Props) {
  const [amountReais, setAmountReais] = useState("");
  const [pending, startTransition] = useTransition();

  const canEdit = orderStatus !== "paid" && orderStatus !== "cancelled";
  const maxReais = (Math.min(balanceCents, 99_999_999) / 100).toFixed(2);

  function handleApply() {
    const reais = parseFloat(amountReais.replace(",", "."));
    if (!reais || isNaN(reais) || reais <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    const cents = Math.round(reais * 100);
    startTransition(async () => {
      const result = await applyCreditToOrder(orderId, cents);
      if (result && "error" in result) {
        toast.error(result.error as string);
      } else {
        toast.success("Crédito aplicado ao pedido.");
        setAmountReais("");
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeCreditFromOrder(orderId);
      if (result && "error" in result) {
        toast.error(result.error as string);
      } else {
        toast.success("Crédito removido do pedido.");
      }
    });
  }

  return (
    <div className="bg-cream-soft rounded-card border border-ink/10 px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-body text-xs uppercase tracking-widest text-ink-soft">
          Crédito de Fidelidade
        </p>
        <span className="font-body text-sm font-medium text-sage-deep">
          Saldo: {formatBRL(balanceCents)}
        </span>
      </div>

      {creditAppliedCents > 0 && (
        <div className="flex items-center justify-between bg-sage/10 border border-sage/20 rounded px-3 py-2">
          <span className="font-body text-sm text-sage-deep">
            Crédito aplicado: −{formatBRL(creditAppliedCents)}
          </span>
          {canEdit && (
            <button
              onClick={handleRemove}
              disabled={pending}
              className="font-body text-[10px] uppercase tracking-widest text-terracotta hover:text-terracotta/80 transition-colors"
            >
              Remover
            </button>
          )}
        </div>
      )}

      {canEdit && creditAppliedCents === 0 && balanceCents > 0 && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-xs text-ink-soft">R$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={maxReais}
              value={amountReais}
              onChange={(e) => setAmountReais(e.target.value)}
              placeholder="0,00"
              className="w-full pl-8 pr-3 py-1.5 border border-ink/20 bg-cream rounded font-body text-sm text-ink focus:outline-none focus:border-ink"
            />
          </div>
          <Button size="sm" onClick={handleApply} disabled={pending}>
            {pending ? "Aplicando..." : "Usar crédito"}
          </Button>
        </div>
      )}

      {balanceCents === 0 && creditAppliedCents === 0 && (
        <p className="font-body text-xs text-ink-soft">
          Cliente sem saldo de crédito disponível.
        </p>
      )}

      {!canEdit && (
        <p className="font-body text-xs text-ink-soft">
          Pedido finalizado — crédito não pode ser alterado.
        </p>
      )}
    </div>
  );
}
