import { getCategoryBySlug, getActiveCategories } from "@/server/queries/categories";
import { getActiveProducts } from "@/server/queries/products";
import { ProductGrid } from "@/components/site/ProductGrid";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbSchema, buildCollectionSchema } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 3600;
export const dynamicParams = true;

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bkcuradoria.com.br";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const categories = await getActiveCategories();
    return categories.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return {};

  const title = cat.metaTitle ?? cat.label;
  const description =
    cat.metaDescription ??
    cat.description ??
    `Explore ${cat.label} na BK Curadoria — peças selecionadas por Rebeka Fragoso em Recife.`;

  return buildMetadata({ title, description, path: `/categorias/${slug}` });
}

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params;

  const [cat, products] = await Promise.all([
    getCategoryBySlug(slug),
    getActiveProducts(slug),
  ]);

  if (!cat) notFound();

  const breadcrumbs = [
    { name: "Início", url: BASE },
    { name: "Categorias", url: `${BASE}/categorias` },
    { name: cat.label, url: `${BASE}/categorias/${slug}` },
  ];

  const collectionSchema = buildCollectionSchema({
    name: cat.label,
    description: cat.description,
    url: `${BASE}/categorias/${slug}`,
    products: products.map((p) => ({ name: p.name, url: `${BASE}/produtos/${p.slug}` })),
  });

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema(breadcrumbs)} />
      <JsonLd data={collectionSchema} />

      <div className="max-w-[480px] md:max-w-screen-xl mx-auto px-5 py-6">
        <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Categorias", href: "/categorias" }, { label: cat.label }]} />

        <h1 className="font-display font-300 text-4xl text-ink mt-4 mb-1">{cat.label}</h1>
        {cat.description && (
          <p className="font-body text-sm text-ink-soft mb-8 max-w-xl">{cat.description}</p>
        )}
        {!cat.description && <div className="mb-8" />}

        {products.length === 0 ? (
          <p className="font-body text-sm text-ink-soft">Nenhuma peça disponível nesta categoria no momento.</p>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </>
  );
}
