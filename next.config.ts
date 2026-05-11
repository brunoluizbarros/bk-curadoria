import type { NextConfig } from "next";

function storageHostname(): string | null {
  const base = process.env.STORAGE_PUBLIC_BASE;
  if (!base) return null;
  try {
    return new URL(base).hostname;
  } catch {
    return null;
  }
}

const storageHost = storageHostname();

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 ano — chaves únicas (UUID) nunca mudam
    deviceSizes: [390, 640, 828, 1080, 1280, 1920],
    imageSizes: [64, 128, 256, 384],
    remotePatterns: [
      ...(storageHost
        ? [{ protocol: "https" as const, hostname: storageHost }]
        : []),
      { protocol: "https", hostname: "cdn.bkcuradoria.com.br" },
    ],
  },
};

export default nextConfig;
