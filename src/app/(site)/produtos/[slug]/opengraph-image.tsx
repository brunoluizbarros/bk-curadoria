import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/server/queries/products";
import { formatBRL } from "@/lib/format";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  const BASE =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://bkcuradoria.com.br";

  const rawUrl = product?.images?.[0]?.url ?? null;
  const imageUrl =
    rawUrl && rawUrl.startsWith("http") ? rawUrl : rawUrl ? `${BASE}${rawUrl}` : null;

  const hasImage = Boolean(imageUrl);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#4F5841",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* produto foto — ocupa metade esquerda */}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "55%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* gradiente de transição */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: hasImage
              ? "linear-gradient(to right, transparent 30%, #2A2722 55%)"
              : "linear-gradient(135deg, #4F5841 0%, #2A2722 100%)",
          }}
        />

        {/* conteúdo direito */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: hasImage ? "52%" : "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: hasImage ? "60px 72px 60px 60px" : "60px 80px",
          }}
        >
          {/* eyebrow */}
          <p
            style={{
              color: "#C9A063",
              fontSize: 13,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              margin: "0 0 20px",
              fontFamily: "serif",
            }}
          >
            BK CURADORIA
          </p>

          {/* nome */}
          <p
            style={{
              color: "#EFE8DC",
              fontSize: product && product.name.length > 28 ? 44 : 58,
              fontWeight: 300,
              margin: "0 0 8px",
              lineHeight: 1.1,
              fontFamily: "serif",
            }}
          >
            {product?.name ?? "BK Curadoria"}
          </p>

          {/* cor */}
          {product?.color && (
            <p
              style={{
                color: "rgba(239,232,220,0.55)",
                fontSize: 18,
                margin: "0 0 28px",
                fontFamily: "sans-serif",
                fontWeight: 300,
              }}
            >
              {product.color}
            </p>
          )}

          {/* preço */}
          {product?.priceCents && (
            <p
              style={{
                color: "#C9A063",
                fontSize: 34,
                margin: 0,
                fontFamily: "serif",
                fontWeight: 400,
              }}
            >
              {formatBRL(product.priceCents)}
            </p>
          )}

          {/* rodapé */}
          <p
            style={{
              position: "absolute",
              bottom: 48,
              color: "rgba(239,232,220,0.3)",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontFamily: "sans-serif",
              margin: 0,
            }}
          >
            rebeka fragoso · recife
          </p>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
