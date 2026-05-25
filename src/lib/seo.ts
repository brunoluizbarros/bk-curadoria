import type { Metadata } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bkcuradoria.com.br";

interface BuildMetadataInput {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
}

export function buildMetadata({ title, description, path, image, type = "website" }: BuildMetadataInput): Metadata {
  const url = `${BASE}${path}`;
  const ogImage = image ?? `${BASE}/og-default.png`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type, images: [{ url: ogImage, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}
