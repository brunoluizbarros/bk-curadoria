export const dynamic = "force-dynamic";

import { getActiveProducts } from "@/server/queries/products";
import { getActiveServices } from "@/server/queries/services";
import { getActiveCategories } from "@/server/queries/categories";
import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bkcuradoria.com.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, services, categories] = await Promise.all([
    getActiveProducts(),
    getActiveServices(),
    getActiveCategories(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/curadoria`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/consultoria`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/categorias`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE}/categorias/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const serviceRoutes: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${BASE}/servicos/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE}/produtos/${p.slug}`,
    lastModified: p.updatedAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...serviceRoutes, ...productRoutes];
}
