"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { deleteProduct } from "@/server/actions/products";

export function ProductDeleteButton({ productId, productName }: { productId: string; productName: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Excluir "${productName}"?`)) return;
    setPending(true);
    try {
      await deleteProduct(productId);
      toast.success("Produto excluído");
      router.refresh();
    } catch {
      toast.error("Erro ao excluir produto. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="danger" size="sm" onClick={handleDelete} disabled={pending}>
      Deletar
    </Button>
  );
}
