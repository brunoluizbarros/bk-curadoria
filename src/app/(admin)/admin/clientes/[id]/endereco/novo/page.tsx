"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { AddressForm } from "@/components/admin/AddressForm";
import { createAddress } from "@/server/actions/addresses";
import { IconMapPin } from "@/components/ui/icons";
import Link from "next/link";
import type { AddressInput } from "@/lib/validations";

export default function NovoEnderecoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  async function handleSubmit(data: AddressInput) {
    const result = await createAddress(id, data);
    if ("error" in result && result.error) return result;
    router.push(`/admin/clientes/${id}`);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/clientes/${id}`} className="text-ink-soft hover:text-ink transition-colors font-body text-xs uppercase tracking-widest flex items-center gap-1">
          <IconMapPin size={14} />
          Voltar ao cliente
        </Link>
        <span className="text-ink-soft">/</span>
        <h1 className="font-display font-400 text-3xl text-ink">Novo endereço</h1>
      </div>
      <AddressForm
        onSubmit={handleSubmit}
        submitLabel="Salvar endereço"
        onCancel={() => router.push(`/admin/clientes/${id}`)}
      />
    </div>
  );
}
