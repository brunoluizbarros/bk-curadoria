"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductInput } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { GradientPicker } from "@/components/admin/GradientPicker";
import { Category } from "@/db/schema";
import { slugify } from "@/lib/slug";
import { toast } from "sonner";

interface ProductFormProps {
  defaultValues?: Partial<ProductInput>;
  categories: Category[];
  onSubmit: (data: ProductInput) => Promise<{ error?: unknown } | undefined>;
  submitLabel?: string;
}

export function ProductForm({ defaultValues, categories, onSubmit, submitLabel = "Salvar produto" }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      featured: false,
      active: true,
      sortOrder: 0,
      categoryIds: [],
      ...defaultValues,
    },
  });

  const name = watch("name");
  const priceCents = watch("priceCents");
  const costCents = watch("costCents");
  const staticMarginPercent =
    priceCents && costCents != null ? ((priceCents - costCents) / priceCents) * 100 : null;

  function autoSlug() {
    if (!watch("slug")) {
      setValue("slug", slugify(name ?? ""));
    }
  }

  async function onValid(data: ProductInput) {
    const result = await onSubmit(data);
    if (result?.error) {
      const msg = typeof result.error === "string"
        ? result.error
        : "Verifique os campos destacados e tente novamente.";
      toast.error(msg);
      if (typeof result.error === "string" && result.error.includes("slug")) {
        setError("slug", { message: "Este slug já está em uso. Escolha outro." });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="name"
          label="Nome"
          {...register("name")}
          onBlur={autoSlug}
          error={errors.name?.message}
        />
        <Input
          id="slug"
          label="Slug"
          {...register("slug")}
          error={errors.slug?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Input
            id="color"
            label="Cor / Material"
            placeholder="Terracota, Tricô italiano"
            {...register("color")}
            error={errors.color?.message}
          />
          <p className="text-[10px] text-ink-soft/70 font-body">Separe os valores por vírgula — no site aparecerão com · entre eles.</p>
        </div>
        <Controller
          control={control}
          name="priceCents"
          render={({ field }) => (
            <Input
              id="priceCents"
              label="Preço"
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
              error={errors.priceCents?.message}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Controller
            control={control}
            name="costCents"
            render={({ field }) => (
              <Input
                id="costCents"
                label="Custo (opcional)"
                placeholder="R$ 0,00"
                inputMode="numeric"
                value={
                  field.value
                    ? (field.value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                    : ""
                }
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  field.onChange(digits === "" ? null : parseInt(digits, 10));
                }}
                error={errors.costCents?.message}
              />
            )}
          />
          {staticMarginPercent !== null && (
            <p className="text-[10px] text-ink-soft/70 font-body">
              Margem sem taxa de cartão: {staticMarginPercent.toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      <Input
        id="tag"
        label="Tag (ex: Novidades)"
        {...register("tag")}
      />

      <Textarea
        id="description"
        label="Descrição"
        rows={4}
        {...register("description")}
        error={errors.description?.message}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Input
            id="composition"
            label="Composição"
            placeholder="70% lã merino, 30% caxemira"
            {...register("composition")}
          />
          <p className="text-[10px] text-ink-soft/70 font-body">Separe os valores por vírgula — no site aparecerão com · entre eles.</p>
        </div>
      </div>

      <Controller
        control={control}
        name="fallbackGradient"
        render={({ field }) => (
          <GradientPicker value={field.value ?? undefined} onChange={field.onChange} />
        )}
      />

      {/* Categorias */}
      {categories.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-soft mb-2 font-body">Categorias</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const ids = watch("categoryIds") ?? [];
              const checked = ids.includes(cat.id);
              return (
                <label
                  key={cat.id}
                  className={`cursor-pointer px-3 py-1.5 rounded-full border text-xs font-body transition-colors ${
                    checked
                      ? "bg-ink text-cream border-ink"
                      : "bg-transparent text-ink border-ink/30 hover:border-ink"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) => {
                      const curr = watch("categoryIds") ?? [];
                      if (e.target.checked) {
                        setValue("categoryIds", [...curr, cat.id]);
                      } else {
                        setValue("categoryIds", curr.filter((id) => id !== cat.id));
                      }
                    }}
                  />
                  {cat.label}
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register("active")} className="rounded" />
          <span className="font-body text-sm text-ink">Ativo</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register("featured")} className="rounded" />
          <span className="font-body text-sm text-ink">Destaque</span>
        </label>
      </div>

      <Input
        id="sortOrder"
        label="Ordem (ex: 1, 2.5, 10)"
        type="number"
        step="0.1"
        {...register("sortOrder", { valueAsNumber: true })}
      />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
