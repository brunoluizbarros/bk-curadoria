"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { wishlistSubmitSchema } from "@/lib/validations";
import type { z } from "zod";
import { submitWishlist } from "@/server/actions/wishlists";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { WishlistCartItem } from "@/lib/wishlist-cart";
import { IconBrandWhatsapp } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";

function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function PhoneInput({
  id,
  label,
  placeholder,
  error,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  error?: string;
  value: string;
  onChange: (raw: string) => void;
}) {
  return (
    <Input
      id={id}
      label={label}
      placeholder={placeholder}
      inputMode="numeric"
      error={error}
      value={maskPhone(value)}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
    />
  );
}

type FormValues = z.infer<typeof wishlistSubmitSchema>;

const RELATION_OPTIONS = [
  "namorado",
  "namorada",
  "marido",
  "esposa",
  "noivo",
  "noiva",
  "amigo",
  "amiga",
  "familiar",
  "outro",
];

interface WishlistFormProps {
  items: WishlistCartItem[];
  onSubmitSuccess: () => void;
}

export function WishlistForm({ items, onSubmitSuccess }: WishlistFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(wishlistSubmitSchema),
    defaultValues: {
      occasion: "namorados",
      productIds: items.map((i) => i.id),
    },
  });

  async function onSubmit(data: FormValues) {
    setServerError(null);
    const result = await submitWishlist({ ...data, productIds: items.map((i) => i.id) });
    if ("error" in result) {
      setServerError("Ocorreu um erro ao enviar sua lista. Tente novamente.");
      return;
    }
    onSubmitSuccess();
    router.push(`/lista/${result.token}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Dados da pessoa que fez a lista */}
      <div>
        <p className="font-display font-400 text-lg text-ink mb-3">Seus dados</p>
        <div className="space-y-3">
          <Input
            id="wisherName"
            label="Seu nome *"
            placeholder="Como você se chama?"
            error={errors.wisherName?.message}
            {...register("wisherName")}
          />
          <Controller
            control={control}
            name="wisherPhone"
            render={({ field }) => (
              <PhoneInput
                id="wisherPhone"
                label="Seu WhatsApp *"
                placeholder="(81) 99999-9999"
                error={errors.wisherPhone?.message}
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      {/* Dados do presenteador */}
      <div>
        <p className="font-display font-400 text-lg text-ink mb-1">Quem você quer que te presenteie?</p>
        <p className="font-body text-xs text-ink-soft mb-3">
          A loja vai entrar em contato com essa pessoa e mostrar sua lista 💕
        </p>
        <div className="space-y-3">
          <Input
            id="gifterName"
            label="Nome *"
            placeholder="Nome de quem vai te presentear"
            error={errors.gifterName?.message}
            {...register("gifterName")}
          />
          <Controller
            control={control}
            name="gifterPhone"
            render={({ field }) => (
              <PhoneInput
                id="gifterPhone"
                label="WhatsApp *"
                placeholder="(81) 99999-9999"
                error={errors.gifterPhone?.message}
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          />
          <div className="flex flex-col gap-1">
            <label
              htmlFor="gifterRelation"
              className="text-xs uppercase tracking-widest text-ink-soft font-body"
            >
              Relação *
            </label>
            <select
              id="gifterRelation"
              className="w-full border border-ink/20 bg-cream-soft px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink rounded-btn"
              {...register("gifterRelation")}
            >
              <option value="">Selecione...</option>
              {RELATION_OPTIONS.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
            {errors.gifterRelation && (
              <span className="text-xs text-red-600">{errors.gifterRelation.message}</span>
            )}
          </div>
        </div>
      </div>

      {/* Recadinho opcional */}
      <div>
        <Textarea
          id="note"
          label="Recadinho para a loja (opcional)"
          rows={3}
          placeholder="Ex: Pode ser qualquer uma dessas peças, ele adora azul…"
          {...register("note")}
        />
      </div>

      {serverError && (
        <p className="text-sm text-red-600 text-center">{serverError}</p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || items.length === 0}
        className="w-full gap-2"
      >
        <IconBrandWhatsapp size={16} />
        {isSubmitting ? "Enviando…" : "Enviar lista de desejos"}
      </Button>

      <p className="font-body text-[10px] text-ink-soft text-center">
        Ao enviar, você autoriza a BK Curadoria a entrar em contato com você e com a pessoa indicada por WhatsApp.
      </p>
    </form>
  );
}
