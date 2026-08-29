"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderForm } from "@/components/admin/OrderForm";
import { createOrder } from "@/server/actions/orders";
import { toast } from "sonner";
import type { OrderInput } from "@/lib/validations";
import type { Product, Address } from "@/db/schema";

interface ProductWithImage extends Product {
  firstImage: null;
}

interface Props {
  products: ProductWithImage[];
  defaultCustomerId?: string;
  defaultCustomerName?: string;
  defaultAddresses?: Address[];
}

export function NovoPedidoClient({ products, defaultCustomerId, defaultCustomerName, defaultAddresses = [] }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function handleSubmit(data: OrderInput) {
    const result = await createOrder(data);
    if ("error" in result) {
      const err = (result as { error: unknown }).error;
      const msg = typeof err === "string" ? err : "Erro ao criar pedido. Verifique os dados.";
      setMessage(msg);
      toast.error(msg);
      return result;
    }
    if ("id" in result) {
      router.push(`/admin/pedidos/${result.id}`);
    }
  }

  return (
    <>
      {message && (
        <div className="mb-4 px-4 py-2 bg-red-50 text-red-700 rounded font-body text-sm">{message}</div>
      )}
      <OrderForm
        products={products}
        defaultCustomerId={defaultCustomerId}
        defaultCustomerName={defaultCustomerName}
        addresses={defaultAddresses}
        onSubmit={handleSubmit}
      />
    </>
  );
}
