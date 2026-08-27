import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "60px 64px",
          background: "#2A2722",
        }}
      >
        <span style={{ fontFamily: "serif", fontSize: 13, letterSpacing: 6, color: "#C9A063", textTransform: "uppercase" }}>
          BK CURADORIA
        </span>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ fontFamily: "serif", fontSize: 56, color: "#EFE8DC", lineHeight: 1.15, fontWeight: 300 }}>
            Curadoria de moda feminina
          </span>
          <span style={{ fontSize: 20, color: "#A09880", fontFamily: "sans-serif", letterSpacing: 1 }}>
            Peças selecionadas com intenção · Consultoria de imagem
          </span>
        </div>

        <span style={{ fontSize: 12, color: "#5C564E", fontFamily: "sans-serif", letterSpacing: 2 }}>
          rebeka fragoso · recife
        </span>
      </div>
    ),
    { ...size }
  );
}
