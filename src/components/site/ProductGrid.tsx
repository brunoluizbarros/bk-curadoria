import { Product, ProductImage } from "@/db/schema";
import { ProductCard } from "./ProductCard";

interface ProductWithImage extends Product {
  firstImage: ProductImage | null;
}

interface ProductGridProps {
  products: ProductWithImage[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="px-5 py-16 text-center">
        <p className="font-body text-sm text-ink-soft">Nenhuma peça encontrada nesta categoria.</p>
      </div>
    );
  }

  return (
    <section className="px-4 py-4 md:py-6">
      <div className="max-w-screen-xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} firstImage={p.firstImage} />
        ))}
      </div>
    </section>
  );
}
