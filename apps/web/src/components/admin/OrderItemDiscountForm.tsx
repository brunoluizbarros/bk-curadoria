"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setItemDiscountCents } from "@/server/actions/loyalty";
import { formatBRL } from "@/lib/format";

interface Props {
  itemId: string;
  orderId: string;
  unitPriceCents: number;
  currentDiscountCents: number;
}

export function OrderItemDiscountForm({ itemId, orderId, unitPriceCents, currentDiscountCents }: Props) {
  const [editing, setEditing] = useState(false);
  const [valueReais, setValueReais] = useState(
    currentDiscountCents > 0 ? (currentDiscountCents / 100).toFixed(2) : ""
  );
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const reais = parseFloat(valueReais.replace(",", ".")) || 0;
    const cents = Math.round(reais * 100);
    if (cents >= unitPriceCents) {
      toast.error("Desconto não pode ser maior ou igual ao preço da peça.");
      return;
    }
    startTransition(async () => {
      const result = await setItemDiscountCents(itemId, orderId, cents);
      if (result && "error" in result) {
        toast.error(result.error as string);
      } else {
        toast.success(cents > 0 ? "Desconto aplicado." : "Desconto removido.");
        setEditing(false);
      }
    });
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="font-body text-[10px] text-ink-soft hover:text-terracotta transition-colors"
      >
        {currentDiscountCents > 0
          ? `desconto: −${formatBRL(currentDiscountCents)}/peça ✎`
          : "add desconto/peça"}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5 mt-1">
      <span className="font-body text-[10px] text-ink-soft">−R$</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={valueReais}
        onChange={(e) => setValueReais(e.target.value)}
        placeholder="0,00"
        className="w-20 border border-ink/20 bg-cream rounded px-2 py-0.5 font-body text-xs text-ink focus:outline-none focus:border-ink"
        autoFocus
      />
      <span className="font-body text-[10px] text-ink-soft">/peça</span>
      <button type="submit" disabled={pending} className="font-body text-[10px] text-sage-deep hover:text-sage-deep/80 uppercase tracking-widest">
        {pending ? "..." : "OK"}
      </button>
      <button type="button" onClick={() => setEditing(false)} className="font-body text-[10px] text-ink-soft hover:text-ink uppercase tracking-widest">
        ✕
      </button>
    </form>
  );
}
