type JsonLdPrimitive = string | number | boolean | null | undefined;
type JsonLdObject = { "@type": string; [key: string]: JsonLdPrimitive | JsonLdObject | JsonLdObject[] | JsonLdPrimitive[] };
type WithContext<T extends JsonLdObject> = T & { "@context": "https://schema.org" };

function ctx<T extends JsonLdObject>(data: T): WithContext<T> {
  return { "@context": "https://schema.org", ...data };
}

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bkcuradoria.com.br";

export function buildOrganizationSchema(sameAs: string[] = []): WithContext<JsonLdObject> {
  return ctx({
    "@type": "Organization",
    name: "BK Curadoria",
    url: BASE,
    founder: { "@type": "Person", name: "Rebeka Fragoso" } as JsonLdObject,
    ...(sameAs.length ? { sameAs } : {}),
  });
}

export function buildWebSiteSchema(): WithContext<JsonLdObject> {
  return ctx({
    "@type": "WebSite",
    name: "BK Curadoria",
    url: BASE,
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE}/?cat={search_term_string}`,
      "query-input": "required name=search_term_string",
    } as unknown as JsonLdObject,
  });
}

export interface LocalBusinessConfig {
  addressStreet?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
  latitude?: string;
  longitude?: string;
  sameAs?: string[];
}

export function buildLocalBusinessSchema(c: LocalBusinessConfig): WithContext<JsonLdObject> | null {
  if (!c.addressStreet && !c.phone) return null;

  const schema: JsonLdObject = {
    "@type": "ProfessionalService",
    name: "BK Curadoria — Rebeka Fragoso",
    url: BASE,
    areaServed: "Recife",
    ...(c.phone ? { telephone: c.phone } : {}),
    ...(c.email ? { email: c.email } : {}),
    ...(c.openingHours ? { openingHours: c.openingHours } : {}),
    ...(c.sameAs?.length ? { sameAs: c.sameAs } : {}),
  };

  if (c.addressStreet) {
    (schema as Record<string, unknown>).address = {
      "@type": "PostalAddress",
      streetAddress: c.addressStreet,
      addressLocality: c.city ?? "Recife",
      addressRegion: c.state ?? "PE",
      postalCode: c.postalCode ?? "",
      addressCountry: "BR",
    };
  }

  if (c.latitude && c.longitude) {
    (schema as Record<string, unknown>).geo = {
      "@type": "GeoCoordinates",
      latitude: c.latitude,
      longitude: c.longitude,
    };
  }

  return ctx(schema);
}

export interface ProductSchemaInput {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  priceCents: number;
  slug: string;
}

export function buildProductSchema(p: ProductSchemaInput): WithContext<JsonLdObject> {
  const price = (p.priceCents / 100).toFixed(2);
  return ctx({
    "@type": "Product",
    name: p.name,
    ...(p.description ? { description: p.description } : {}),
    sku: p.id,
    brand: { "@type": "Brand", name: "BK Curadoria" } as JsonLdObject,
    ...(p.imageUrl ? { image: [p.imageUrl.startsWith("http") ? p.imageUrl : `${BASE}${p.imageUrl}`] } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price,
      availability: "https://schema.org/InStock",
      url: `${BASE}/produtos/${p.slug}`,
    } as unknown as JsonLdObject,
  });
}

export interface ServiceSchemaInput {
  name: string;
  description?: string | null;
  slug: string;
}

export function buildServiceSchema(s: ServiceSchemaInput): WithContext<JsonLdObject> {
  return ctx({
    "@type": "Service",
    name: s.name,
    ...(s.description ? { description: s.description } : {}),
    provider: { "@type": "Organization", name: "BK Curadoria" } as JsonLdObject,
    url: `${BASE}/servicos/${s.slug}`,
  });
}

export interface BreadcrumbItem { name: string; url: string }

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): WithContext<JsonLdObject> {
  return ctx({
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })) as unknown as JsonLdObject[],
  });
}

export interface CollectionSchemaInput {
  name: string;
  description?: string | null;
  url: string;
  products: Array<{ name: string; url: string }>;
}

export function buildCollectionSchema(input: CollectionSchemaInput): WithContext<JsonLdObject> {
  return ctx({
    "@type": "CollectionPage",
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    url: input.url,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: input.products.map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: p.name,
        url: p.url,
      })),
    } as unknown as JsonLdObject,
  });
}
