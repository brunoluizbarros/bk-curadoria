"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, type AddressInput } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { lookupCepAction } from "@/server/actions/addresses";
import { formatCEP } from "@/lib/format";

interface AddressFormProps {
  defaultValues?: Partial<AddressInput>;
  onSubmit: (data: AddressInput) => Promise<{ error?: unknown } | undefined>;
  submitLabel?: string;
  onCancel?: () => void;
}

export function AddressForm({ defaultValues, onSubmit, submitLabel = "Salvar endereço", onCancel }: AddressFormProps) {
  const [cepLoading, setCepLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: { isDefault: false as boolean, ...defaultValues },
  });

  async function handleCepBlur(e: React.FocusEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length !== 8) return;
    setCepLoading(true);
    const result = await lookupCepAction(raw);
    setCepLoading(false);
    if (result) {
      setValue("street", result.street);
      setValue("neighborhood", result.neighborhood);
      setValue("city", result.city);
      setValue("state", result.state);
    }
  }

  async function onValid(data: AddressInput) {
    await onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="label"
          label="Rótulo (ex: Casa)"
          placeholder="Casa, Trabalho..."
          {...register("label")}
        />
        <Input
          id="cep"
          label="CEP"
          placeholder="00000-000"
          inputMode="numeric"
          {...register("cep")}
          onChange={(e) => {
            e.target.value = formatCEP(e.target.value);
            register("cep").onChange(e);
          }}
          onBlur={handleCepBlur}
          error={errors.cep?.message}
        />
      </div>

      {cepLoading && (
        <p className="font-body text-xs text-ink-soft">Buscando CEP...</p>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Input
            id="street"
            label="Logradouro"
            {...register("street")}
            error={errors.street?.message}
          />
        </div>
        <Input
          id="number"
          label="Número"
          {...register("number")}
          error={errors.number?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="complement"
          label="Complemento"
          placeholder="Apto, bloco..."
          {...register("complement")}
        />
        <Input
          id="neighborhood"
          label="Bairro"
          {...register("neighborhood")}
          error={errors.neighborhood?.message}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Input
            id="city"
            label="Cidade"
            {...register("city")}
            error={errors.city?.message}
          />
        </div>
        <Input
          id="state"
          label="UF"
          maxLength={2}
          style={{ textTransform: "uppercase" }}
          {...register("state")}
          error={errors.state?.message}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" {...register("isDefault")} className="rounded" />
        <span className="font-body text-sm text-ink">Endereço padrão</span>
      </label>

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
