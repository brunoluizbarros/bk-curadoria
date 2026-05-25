import { ImageResponse } from "next/og";
import { getServiceBySlug } from "@/server/queries/services";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function OgImage({ params }: Props) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  const name = service?.name ?? "Consultoria";
  const subtitle = service?.subtitle ?? "BK Curadoria · Rebeka Fragoso";
  const gradient = service?.heroGradient ?? "linear-gradient(135deg,#6A7256,#4F5841)";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#2A2722",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
        }}
      >
        {/* faixa colorida topo */}
        <div style={{ display: "flex", width: "100%", height: 6, background: gradient, borderRadius: 3 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span style={{ fontFamily: "serif", fontSize: 13, letterSpacing: 6, color: "#C9A063", textTransform: "uppercase" }}>
            BK CURADORIA · CONSULTORIA
          </span>
          <span style={{ fontFamily: "serif", fontSize: 56, color: "#EFE8DC", lineHeight: 1.1, fontWeight: 300, maxWidth: 700 }}>
            {name}
          </span>
          {subtitle && (
            <span style={{ fontSize: 16, color: "#A09880", fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase" }}>
              {subtitle}
            </span>
          )}
        </div>

        <span style={{ fontSize: 13, color: "#5C564E", fontFamily: "sans-serif", letterSpacing: 2 }}>
          rebeka fragoso · recife
        </span>
      </div>
    ),
    { ...size }
  );
}
