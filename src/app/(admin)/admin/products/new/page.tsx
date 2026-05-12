import { getAllCategories } from "@/server/queries/categories";
import { createProduct } from "@/server/actions/products";
import { ProductForm } from "@/components/admin/ProductForm";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Novo produto · BK Admin" } };

export default async function NewProductPage() {
  const categories = await getAllCategories();

  async function handleCreate(data: Parameters<typeof createProduct>[0]) {
    "use server";
    const result = await createProduct(data);
    if (result && "id" in result) {
      redirect(`/admin/products/${result.id}/edit`);
    }
    return result;
  }

  return (
    <div>
      <h1 className="font-display font-400 text-3xl text-ink mb-6">Novo produto</h1>
      <p className="text-xs text-ink-soft mb-6">Preencha as informações do produto. Após salvar, você será redirecionado para adicionar as fotos.</p>
      <ProductForm categories={categories} onSubmit={handleCreate} submitLabel="Salvar e adicionar fotos →" />
    </div>
  );
}
