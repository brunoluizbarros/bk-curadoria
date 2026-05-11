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
    remotePatterns: [
      // hostname dinâmico extraído de STORAGE_PUBLIC_BASE
      ...(storageHost
        ? [{ protocol: "https" as const, hostname: storageHost }]
        : []),
      // CDN / domínio personalizado (opcional)
      { protocol: "https", hostname: "cdn.bkcuradoria.com.br" },
    ],
  },
};

export default nextConfig;
