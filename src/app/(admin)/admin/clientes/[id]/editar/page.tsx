import { getCustomerById } from "@/server/queries/customers";
import { EditarClienteClient } from "@/components/admin/EditarClienteClient";
import { IconUsers } from "@/components/ui/icons";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Editar Cliente · BK Admin" } };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarClientePage({ params }: Props) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/clientes/${id}`} className="text-ink-soft hover:text-ink transition-colors font-body text-xs uppercase tracking-widest flex items-center gap-1">
          <IconUsers size={14} />
          Voltar ao cliente
        </Link>
        <span className="text-ink-soft">/</span>
        <h1 className="font-display font-400 text-3xl text-ink">Editar dados</h1>
      </div>
      <EditarClienteClient
        id={id}
        defaultValues={{
          name: customer.name,
          phone: customer.phone,
          email: customer.email ?? "",
          document: customer.document ?? "",
          notes: customer.notes ?? "",
        }}
      />
    </div>
  );
}
