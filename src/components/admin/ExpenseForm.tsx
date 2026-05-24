"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, type ExpenseInput } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { ExpenseCategory } from "@/db/schema";

interface ExpenseFormProps {
  categories: ExpenseCategory[];
  defaultValues?: Partial<ExpenseInput>;
  onSubmit: (data: ExpenseInput) => Promise<{ error?: unknown } | undefined>;
  submitLabel?: string;
  onCancel?: () => void;
}

export function ExpenseForm({ categories, defaultValues, onSubmit, submitLabel = "Registrar despesa", onCancel }: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      paidAt: new Date().toISOString().slice(0, 10),
      ...defaultValues,
    },
  });

  async function onValid(data: ExpenseInput) {
    await onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-body text-xs uppercase tracking-widest text-ink-soft mb-1">
            Categoria
          </label>
          <select
            {...register("categoryId")}
            className="w-full rounded border border-ink/20 bg-cream px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink"
          >
            <option value="">Selecione...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="font-body text-xs text-red-600 mt-0.5">{errors.categoryId.message}</p>
          )}
        </div>

        <Controller
          control={control}
          name="amountCents"
          render={({ field }) => (
            <Input
              id="amountCents"
              label="Valor"
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
              error={errors.amountCents?.message}
            />
          )}
        />
      </div>

      <Input
        id="description"
        label="Descrição"
        placeholder="Aluguel, fornecedor, material..."
        {...register("description")}
        error={errors.description?.message}
      />

      <Input
        id="paidAt"
        label="Data do pagamento"
        type="date"
        {...register("paidAt")}
        error={errors.paidAt?.message}
      />

      <Textarea
        id="notes"
        label="Observações (opcional)"
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
