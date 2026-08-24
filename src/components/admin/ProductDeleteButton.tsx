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
    await deleteProduct(productId);
    setPending(false);
    toast.success("Produto excluído");
    router.refresh();
  }

  return (
    <Button variant="danger" size="sm" onClick={handleDelete} disabled={pending}>
      Deletar
    </Button>
  );
}
