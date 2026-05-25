"use client";

import { useRouter } from "next/navigation";
import { CustomerForm } from "@/components/admin/CustomerForm";
import { updateCustomer } from "@/server/actions/customers";
import { toast } from "sonner";
import type { CustomerInput } from "@/lib/validations";

interface Props {
  id: string;
  defaultValues: Partial<CustomerInput>;
}

export function EditarClienteClient({ id, defaultValues }: Props) {
  const router = useRouter();

  async function handleSubmit(data: CustomerInput) {
    const result = await updateCustomer(id, data);
    if ("error" in result) {
      const err = (result as { error: unknown }).error;
      toast.error(typeof err === "string" ? err : "Erro ao salvar cliente");
      return result;
    }
    router.push(`/admin/clientes/${id}`);
  }

  return (
    <CustomerForm
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel="Salvar alterações"
      onCancel={() => router.push(`/admin/clientes/${id}`)}
    />
  );
}
