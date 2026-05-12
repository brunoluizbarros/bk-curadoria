import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    deviceSizes: [390, 640, 828, 1080, 1280, 1920],
    imageSizes: [64, 128, 256, 384],
    remotePatterns: [
      // Tigris (S3-compatible) — bucket de produção
      { protocol: "https", hostname: "t3.storageapi.dev" },
      // CDN custom opcional
      { protocol: "https", hostname: "cdn.bkcuradoria.com.br" },
    ],
  },
};

export default nextConfig;
