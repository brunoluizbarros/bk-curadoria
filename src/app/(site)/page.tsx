import { Suspense } from "react";
import { getSiteConfig, getHomeDifferentials } from "@/server/queries/site-config";
import { getActiveProducts } from "@/server/queries/products";
import { getActiveServices } from "@/server/queries/services";
import { getActiveCategories } from "@/server/queries/categories";
import { HeroSection } from "@/components/site/HeroSection";
import { BannerCuradoria } from "@/components/site/BannerCuradoria";
import { CategoryFilter } from "@/components/site/CategoryFilter";
import { ProductGrid } from "@/components/site/ProductGrid";
import { AboutSection } from "@/components/site/AboutSection";
import { DifferentialsGrid } from "@/components/site/DifferentialsGrid";
import { ServicesList } from "@/components/site/ServicesList";
import { FinalCTA } from "@/components/site/FinalCTA";

interface HomeProps {
  searchParams: Promise<{ cat?: string }>;
}

export default async function HomePage({ searchParams }: HomeProps) {
  const { cat } = await searchParams;

  const [config, differentials, categories, services] = await Promise.all([
    getSiteConfig(),
    getHomeDifferentials(),
    getActiveCategories(),
    getActiveServices(),
  ]);

  const activeSlug = cat ?? "all";
  const products = await getActiveProducts(activeSlug === "all" ? undefined : activeSlug);

  return (
    <>
      <HeroSection
        tag={config.hero_tag}
        title={config.hero_title ?? "Vestir-se com"}
        titleEm={config.hero_title_em ?? "intenção."}
        body={config.hero_body}
      />

      <BannerCuradoria
        tag={config.banner_cur_tag}
        title={config.banner_cur_title}
        titleEm={config.banner_cur_title_em}
        cta={config.banner_cur_cta}
      />

      <Suspense>
        <CategoryFilter categories={categories} activeSlug={activeSlug} />
      </Suspense>

      <ProductGrid products={products} />

      <AboutSection
        tag={config.about_tag}
        quote={config.about_quote}
        body={config.about_body}
      />

      <DifferentialsGrid items={differentials} />

      <ServicesList
        services={services}
        tag={config.svc_tag}
        title={config.svc_title}
        titleEm={config.svc_title_em}
        subtitle={config.svc_subtitle}
      />

      <FinalCTA
        title={config.cta_title}
        titleEm={config.cta_title_em}
        subtitle={config.cta_subtitle}
        ctaLabel={config.cta_label}
        phone={config.whatsapp_number ?? "5581999999999"}
      />
    </>
  );
}
