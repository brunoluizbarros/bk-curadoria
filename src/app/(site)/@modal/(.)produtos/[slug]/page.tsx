import { getProductBySlug } from "@/server/queries/products";
import { getSiteConfig } from "@/server/queries/site-config";
import { ProductModal } from "@/components/site/ProductModal";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProductModalPage({ params }: Props) {
  const { slug } = await params;
  const [product, config] = await Promise.all([
    getProductBySlug(slug),
    getSiteConfig(),
  ]);

  if (!product) notFound();

  return (
    <ProductModal
      product={product}
      phone={config.whatsapp_number ?? "5581999999999"}
    />
  );
}
