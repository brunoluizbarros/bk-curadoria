import { getProductByIdAdmin } from "@/server/queries/products";
import { getAllCategories } from "@/server/queries/categories";
import { updateProduct } from "@/server/actions/products";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductImagesUploader } from "@/components/admin/ProductImagesUploader";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: { absolute: "Editar produto · BK Admin" } };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductByIdAdmin(id),
    getAllCategories(),
  ]);

  if (!product) notFound();

  async function handleUpdate(data: Parameters<typeof updateProduct>[1]) {
    "use server";
    const result = await updateProduct(id, data);
    if ("success" in (result ?? {})) {
      redirect("/admin/products");
    }
    return result;
  }

  return (
    <div>
      <h1 className="font-display font-400 text-3xl text-ink mb-6">
        Editar: {product.name}
      </h1>

      <div className="mb-8">
        <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-3">Imagens</h2>
        <ProductImagesUploader productId={id} images={product.images} />
      </div>

      <ProductForm
        categories={categories}
        defaultValues={{
          ...product,
          categoryIds: product.categoryIds,
          tag: product.tag ?? undefined,
          composition: product.composition ?? undefined,
          origin: product.origin ?? undefined,
          fallbackGradient: product.fallbackGradient ?? undefined,
        }}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
