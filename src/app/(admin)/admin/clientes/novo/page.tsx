"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerForm } from "@/components/admin/CustomerForm";
import { AddressForm } from "@/components/admin/AddressForm";
import { createCustomer } from "@/server/actions/customers";
import { createAddress } from "@/server/actions/addresses";
import type { CustomerInput, AddressInput } from "@/lib/validations";
import { IconUsers } from "@/components/ui/icons";
import Link from "next/link";

export default function NovoClientePage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function handleCustomer(data: CustomerInput) {
    const result = await createCustomer(data);
    if ("error" in result && result.error) {
      setMessage("Erro ao cadastrar cliente. Verifique os dados.");
      return result;
    }
    if ("id" in result) {
      setCustomerId(result.id);
      setMessage("Cliente cadastrado! Adicione um endereço ou finalize.");
    }
  }

  async function handleAddress(data: AddressInput) {
    if (!customerId) return;
    const result = await createAddress(customerId, data);
    if ("error" in result && result.error) {
      setMessage("Erro ao cadastrar endereço.");
      return result;
    }
    router.push(`/admin/clientes/${customerId}`);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/clientes" className="text-ink-soft hover:text-ink transition-colors">
          <IconUsers size={20} />
        </Link>
        <span className="text-ink-soft">/</span>
        <h1 className="font-display font-400 text-3xl text-ink">Novo cliente</h1>
      </div>

      {message && (
        <div className="mb-4 px-4 py-2 bg-sage/20 text-sage-deep rounded font-body text-sm">
          {message}
        </div>
      )}

      {!customerId ? (
        <section>
          <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-4">
            Dados do cliente
          </h2>
          <CustomerForm onSubmit={handleCustomer} />
        </section>
      ) : (
        <section>
          <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-4">
            Endereço (opcional)
          </h2>
          <AddressForm
            onSubmit={handleAddress}
            submitLabel="Salvar endereço e finalizar"
            onCancel={() => router.push(`/admin/clientes/${customerId}`)}
          />
        </section>
      )}
    </div>
  );
}
