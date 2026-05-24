import { db } from "@/db/client";
import { addresses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { EditarEnderecoClient } from "./EditarEnderecoClient";
import { IconMapPin } from "@/components/ui/icons";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Editar Endereço · BK Admin" } };

interface Props {
  params: Promise<{ id: string; addrId: string }>;
}

export default async function EditarEnderecoPage({ params }: Props) {
  const { id, addrId } = await params;

  const [addr] = await db
    .select()
    .from(addresses)
    .where(eq(addresses.id, addrId));

  if (!addr) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/admin/clientes/${id}`}
          className="text-ink-soft hover:text-ink transition-colors font-body text-xs uppercase tracking-widest flex items-center gap-1"
        >
          <IconMapPin size={14} />
          Voltar ao cliente
        </Link>
        <span className="text-ink-soft">/</span>
        <h1 className="font-display font-400 text-3xl text-ink">Editar endereço</h1>
      </div>
      <EditarEnderecoClient
        customerId={id}
        addrId={addrId}
        defaultValues={{
          label: addr.label ?? "",
          cep: addr.cep,
          street: addr.street,
          number: addr.number,
          complement: addr.complement ?? "",
          neighborhood: addr.neighborhood,
          city: addr.city,
          state: addr.state,
          isDefault: addr.isDefault,
        }}
      />
    </div>
  );
}
