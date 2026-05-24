"use client";

import { useRouter } from "next/navigation";
import { AddressForm } from "@/components/admin/AddressForm";
import { updateAddress } from "@/server/actions/addresses";
import type { AddressInput } from "@/lib/validations";

interface Props {
  customerId: string;
  addrId: string;
  defaultValues: Partial<AddressInput>;
}

export function EditarEnderecoClient({ customerId, addrId, defaultValues }: Props) {
  const router = useRouter();

  async function handleSubmit(data: AddressInput) {
    const result = await updateAddress(addrId, customerId, data);
    if ("error" in result && result.error) return result;
    router.push(`/admin/clientes/${customerId}`);
  }

  return (
    <AddressForm
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel="Salvar alterações"
      onCancel={() => router.push(`/admin/clientes/${customerId}`)}
    />
  );
}
