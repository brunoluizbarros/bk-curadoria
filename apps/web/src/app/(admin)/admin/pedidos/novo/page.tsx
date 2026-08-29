import { getAllProductsAdmin } from "@/server/queries/products";
import { getCustomerById } from "@/server/queries/customers";
import { NovoPedidoClient } from "@/components/admin/NovoPedidoClient";
import { IconReceipt } from "@/components/ui/icons";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Novo Pedido · BK Admin" } };

interface Props {
  searchParams: Promise<{ customerId?: string }>;
}

export default async function NovoPedidoPage({ searchParams }: Props) {
  const { customerId } = await searchParams;

  const [allProducts, customer] = await Promise.all([
    getAllProductsAdmin(),
    customerId ? getCustomerById(customerId) : Promise.resolve(null),
  ]);

  const products = allProducts.map((p) => ({ ...p, firstImage: null as null }));

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/pedidos" className="text-ink-soft hover:text-ink transition-colors font-body text-xs uppercase tracking-widest flex items-center gap-1">
          <IconReceipt size={14} />
          Pedidos
        </Link>
        <span className="text-ink-soft">/</span>
        <h1 className="font-display font-400 text-3xl text-ink">Novo pedido</h1>
      </div>

      <NovoPedidoClient
        products={products}
        defaultCustomerId={customerId}
        defaultCustomerName={customer?.name}
        defaultAddresses={customer?.addresses ?? []}
      />
    </div>
  );
}
