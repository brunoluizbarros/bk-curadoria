"use client";

import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderSchema, type OrderInput } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { formatBRL, formatPhone } from "@/lib/format";
import { searchCustomersAction, getCustomerByIdAction } from "@/server/actions/customers";
import { IconSearch, IconX, IconPlus } from "@/components/ui/icons";
import type { Product, Address } from "@/db/schema";

function defaultAddressId(addrs: Address[]): string {
  if (addrs.length === 0) return "";
  const def = addrs.find((a) => a.isDefault);
  return (def ?? addrs[0]).id;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
}

interface ProductWithImage extends Product {
  firstImage?: { url: string } | null;
}

interface OrderFormProps {
  products: ProductWithImage[];
  defaultCustomerId?: string;
  defaultCustomerName?: string;
  addresses?: Address[];
  onSubmit: (data: OrderInput) => Promise<{ error?: unknown } | undefined>;
  submitLabel?: string;
}

export function OrderForm({
  products,
  defaultCustomerId,
  defaultCustomerName,
  addresses = [],
  onSubmit,
  submitLabel = "Criar pedido",
}: OrderFormProps) {
  const [customerSearch, setCustomerSearch] = useState(defaultCustomerName ?? "");
  const [customerResults, setCustomerResults] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(
    defaultCustomerId ? { id: defaultCustomerId, name: defaultCustomerName ?? "", phone: "" } : null
  );
  const [selectedAddresses, setSelectedAddresses] = useState<Address[]>(addresses);
  const [productSearch, setProductSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<{ product: ProductWithImage; quantity: number }[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: defaultCustomerId ?? "",
      addressId: defaultAddressId(addresses),
      soldAt: new Date().toISOString().slice(0, 10),
      discountCents: 0 as number,
      shippingCents: 0 as number,
      items: [] as OrderInput["items"],
    },
  });

  const searchCustomersFn = useCallback(async (q: string) => {
    if (q.length < 2) { setCustomerResults([]); return; }
    const results = await searchCustomersAction(q);
    setCustomerResults(results);
  }, []);

  function selectCustomer(c: CustomerOption) {
    setSelectedCustomer(c);
    setValue("customerId", c.id);
    setCustomerResults([]);
    setCustomerSearch(c.name);
    // Load addresses for this customer and pre-select default
    getCustomerByIdAction(c.id).then((data) => {
      if (data) {
        setSelectedAddresses(data.addresses);
        setValue("addressId", defaultAddressId(data.addresses));
      }
    });
  }

  function addItem(product: ProductWithImage) {
    const exists = selectedItems.find((i) => i.product.id === product.id);
    const updated = exists
      ? selectedItems.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...selectedItems, { product, quantity: 1 }];
    setSelectedItems(updated);
    setValue("items", updated.map((i) => ({
      productId: i.product.id,
      unitPriceCents: i.product.priceCents,
      quantity: i.quantity,
    })));
  }

  function removeItem(productId: string) {
    const updated = selectedItems.filter((i) => i.product.id !== productId);
    setSelectedItems(updated);
    setValue("items", updated.map((i) => ({
      productId: i.product.id,
      unitPriceCents: i.product.priceCents,
      quantity: i.quantity,
    })));
  }

  function changeQty(productId: string, delta: number) {
    const updated = selectedItems
      .map((i) => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
      .filter((i) => i.quantity > 0);
    setSelectedItems(updated);
    setValue("items", updated.map((i) => ({
      productId: i.product.id,
      unitPriceCents: i.product.priceCents,
      quantity: i.quantity,
    })));
  }

  const discountCents = watch("discountCents") ?? 0;
  const shippingCents = watch("shippingCents") ?? 0;
  const itemsTotal = selectedItems.reduce((acc, i) => acc + i.product.priceCents * i.quantity, 0);
  const orderTotal = Math.max(0, itemsTotal + shippingCents - discountCents);

  const filteredProducts = productSearch
    ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  async function onValid(data: OrderInput) {
    await onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-6">
      {/* Cliente */}
      <section>
        <h3 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-3">Cliente</h3>
        <div className="relative">
          <div className="flex items-center gap-2 border border-ink/20 rounded bg-cream px-3 py-2">
            <IconSearch size={14} className="text-ink-soft shrink-0" />
            <input
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                searchCustomersFn(e.target.value);
                if (selectedCustomer) {
                  setSelectedCustomer(null);
                  setValue("customerId", "");
                }
              }}
              placeholder="Buscar cliente por nome ou telefone..."
              className="flex-1 bg-transparent font-body text-sm text-ink focus:outline-none"
            />
            {selectedCustomer && (
              <span className="font-body text-[10px] bg-sage/20 text-sage-deep px-2 py-0.5 rounded-sm">
                selecionado
              </span>
            )}
          </div>
          {customerResults.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-cream border border-ink/20 rounded shadow-sm">
              {customerResults.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => selectCustomer(c)}
                    className="w-full text-left px-4 py-2.5 hover:bg-ink/5 transition-colors"
                  >
                    <span className="font-body text-sm text-ink">{c.name}</span>
                    <span className="font-body text-xs text-ink-soft ml-2">{formatPhone(c.phone)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {errors.customerId && (
          <p className="font-body text-xs text-red-600 mt-1">{errors.customerId.message}</p>
        )}

        {selectedAddresses.length > 0 && (
          <div className="mt-3">
            <label className="block font-body text-xs uppercase tracking-widest text-ink-soft mb-1">
              Endereço de envio (opcional)
            </label>
            <select
              {...register("addressId")}
              className="w-full rounded border border-ink/20 bg-cream px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink"
            >
              <option value="">Sem endereço</option>
              {selectedAddresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label ? `${a.label} — ` : ""}{a.street}, {a.number} · {a.city}/{a.state}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* Produtos */}
      <section>
        <h3 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-3">
          Produtos da malinha
        </h3>
        <input
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          placeholder="Buscar produto..."
          className="w-full border border-ink/20 rounded bg-cream px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink mb-3"
        />

        <div className="max-h-56 overflow-y-auto space-y-1 border border-ink/10 rounded p-2">
          {filteredProducts.map((p) => {
            const inCart = selectedItems.find((i) => i.product.id === p.id);
            return (
              <div key={p.id} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-ink/5 transition-colors">
                <div className="flex-1 min-w-0">
                  <span className="font-body text-sm text-ink truncate block">{p.name}</span>
                  <span className="font-body text-xs text-terracotta">{formatBRL(p.priceCents)}</span>
                </div>
                {inCart ? (
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => changeQty(p.id, -1)} className="w-6 h-6 flex items-center justify-center rounded border border-ink/20 text-ink-soft hover:border-ink hover:text-ink transition-colors font-body text-sm leading-none">−</button>
                    <span className="font-body text-xs text-ink w-5 text-center">{inCart.quantity}</span>
                    <button type="button" onClick={() => changeQty(p.id, +1)} className="w-6 h-6 flex items-center justify-center rounded border border-ink/20 text-ink-soft hover:border-ink hover:text-ink transition-colors font-body text-sm leading-none">+</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => addItem(p)}
                    className="text-ink-soft hover:text-ink transition-colors"
                  >
                    <IconPlus size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {selectedItems.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="font-body text-xs uppercase tracking-widest text-ink-soft mb-2">Na malinha</p>
            {selectedItems.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center justify-between bg-cream rounded px-3 py-2 border border-ink/10">
                <span className="font-body text-sm text-ink flex-1 min-w-0 truncate">{product.name}</span>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button type="button" onClick={() => changeQty(product.id, -1)} className="w-5 h-5 flex items-center justify-center rounded border border-ink/20 text-ink-soft hover:border-ink hover:text-ink transition-colors font-body text-xs leading-none">−</button>
                  <span className="font-body text-xs text-ink w-4 text-center">{quantity}</span>
                  <button type="button" onClick={() => changeQty(product.id, +1)} className="w-5 h-5 flex items-center justify-center rounded border border-ink/20 text-ink-soft hover:border-ink hover:text-ink transition-colors font-body text-xs leading-none">+</button>
                  <span className="font-body text-xs text-ink-soft w-16 text-right">{formatBRL(product.priceCents * quantity)}</span>
                  <button type="button" onClick={() => removeItem(product.id)} className="text-red-400 hover:text-red-600">
                    <IconX size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {errors.items && (
          <p className="font-body text-xs text-red-600 mt-1">{errors.items.message}</p>
        )}
      </section>

      {/* Datas e ajustes */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          id="soldAt"
          label="Data do envio"
          type="date"
          {...register("soldAt")}
          error={errors.soldAt?.message}
        />
        <Controller
          control={control}
          name="shippingCents"
          render={({ field }) => (
            <Input
              id="shippingCents"
              label="Frete (R$)"
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
            />
          )}
        />
        <Controller
          control={control}
          name="discountCents"
          render={({ field }) => (
            <Input
              id="discountCents"
              label="Desconto (R$)"
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
            />
          )}
        />
      </section>

      <Textarea
        id="notes"
        label="Observações"
        rows={2}
        {...register("notes")}
      />

      {/* Resumo */}
      {selectedItems.length > 0 && (
        <div className="bg-cream rounded-card px-4 py-3 border border-ink/10 space-y-1">
          <p className="font-body text-xs uppercase tracking-widest text-ink-soft mb-2">Resumo</p>
          <div className="flex justify-between font-body text-sm text-ink-soft">
            <span>Subtotal</span><span>{formatBRL(itemsTotal)}</span>
          </div>
          {shippingCents > 0 && (
            <div className="flex justify-between font-body text-sm text-ink-soft">
              <span>Frete</span><span>+ {formatBRL(shippingCents)}</span>
            </div>
          )}
          {discountCents > 0 && (
            <div className="flex justify-between font-body text-sm text-ink-soft">
              <span>Desconto</span><span>− {formatBRL(discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between font-body text-sm font-medium text-ink border-t border-ink/10 pt-1">
            <span>Total (malinha completa)</span><span>{formatBRL(orderTotal)}</span>
          </div>
          <p className="font-body text-[10px] text-ink-soft">
            * O valor cobrado será apenas dos itens marcados como &ldquo;ficou&rdquo; após devolução da malinha.
          </p>
        </div>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Criando..." : submitLabel}
      </Button>
    </form>
  );
}
