"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, type CustomerInput } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

interface CustomerFormProps {
  defaultValues?: Partial<CustomerInput>;
  onSubmit: (data: CustomerInput) => Promise<{ error?: unknown } | undefined>;
  submitLabel?: string;
  onCancel?: () => void;
}

export function CustomerForm({ defaultValues, onSubmit, submitLabel = "Salvar cliente", onCancel }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  });

  async function onValid(data: CustomerInput) {
    await onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="name"
          label="Nome completo"
          {...register("name")}
          error={errors.name?.message}
        />
        <Input
          id="phone"
          label="Telefone / WhatsApp"
          placeholder="(81) 99999-9999"
          inputMode="tel"
          {...register("phone")}
          error={errors.phone?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="email"
          label="Email (opcional)"
          type="email"
          {...register("email")}
          error={errors.email?.message}
        />
        <Input
          id="document"
          label="CPF / CNPJ (opcional)"
          placeholder="000.000.000-00"
          {...register("document")}
        />
      </div>

      <Textarea
        id="notes"
        label="Observações (opcional)"
        rows={2}
        placeholder="Preferências, restrições, notas..."
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
