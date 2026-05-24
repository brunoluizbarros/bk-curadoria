"use client";

import { useState } from "react";
import { PaymentForm } from "@/components/admin/PaymentForm";
import { createPayment } from "@/server/actions/payments";
import { Button } from "@/components/ui/Button";
import { formatBRL } from "@/lib/format";
import { IconPlus } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import type { PaymentInput } from "@/lib/validations";

interface PaymentFormInlineProps {
  orderId: string;
  orderTotal: number;
  feeConfigs?: Record<string, number>;
}

export function PaymentFormInline({ orderId, orderTotal, feeConfigs }: PaymentFormInlineProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleSubmit(data: PaymentInput) {
    const result = await createPayment(orderId, data);
    if ("error" in result && result.error) return result;
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <IconPlus size={12} />
        Registrar pagamento
        {orderTotal > 0 && (
          <span className="ml-1 font-body text-[10px] text-ink-soft normal-case tracking-normal">
            ({formatBRL(orderTotal)})
          </span>
        )}
      </Button>
    );
  }

  return (
    <div className="bg-cream rounded-card px-4 py-4 border border-ink/10">
      <p className="font-body text-xs uppercase tracking-widest text-ink-soft mb-4">Registrar pagamento</p>
      <PaymentForm
        onSubmit={handleSubmit}
        onCancel={() => setOpen(false)}
        feeConfigs={feeConfigs}
        defaultValues={{
          grossCents: orderTotal,
          paidAt: new Date().toISOString().slice(0, 10),
        }}
      />
    </div>
  );
}
