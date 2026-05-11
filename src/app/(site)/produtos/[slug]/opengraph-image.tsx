import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/server/queries/products";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function OgImage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bkcuradoria.com.br";
  const rawUrl = product?.images?.[0]?.url ?? null;
  const imageUrl = rawUrl?.startsWith("http") ? rawUrl : rawUrl ? `${BASE}${rawUrl}` : null;

  const name = product?.name ?? "BK Curadoria";
  const price = product
    ? `R$ ${(product.priceCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : "";
  const color = product?.color ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#EFE8DC",
        }}
      >
        {/* foto do produto */}
        <div style={{ display: "flex", width: 480, height: 630, flexShrink: 0, overflow: "hidden" }}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: product?.fallbackGradient ?? "#D5C9B8" }} />
          )}
        </div>

        {/* info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "60px 56px",
            background: "#2A2722",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <span style={{ fontFamily: "serif", fontSize: 13, letterSpacing: 6, color: "#C9A063", textTransform: "uppercase" }}>
              BK CURADORIA
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontFamily: "serif", fontSize: 42, color: "#EFE8DC", lineHeight: 1.15, fontWeight: 300 }}>
              {name}
            </span>
            {color && (
              <span style={{ fontSize: 14, color: "#A09880", fontFamily: "sans-serif", letterSpacing: 1 }}>
                {color}
              </span>
            )}
            {price && (
              <span style={{ fontSize: 28, color: "#D88068", fontFamily: "sans-serif", marginTop: 8 }}>
                {price}
              </span>
            )}
          </div>

          <span style={{ fontSize: 12, color: "#5C564E", fontFamily: "sans-serif", letterSpacing: 2 }}>
            rebeka fragoso · recife
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
