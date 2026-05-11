import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bkcuradoria.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "BK Curadoria · Rebeka Fragoso · Recife",
    template: "%s · BK Curadoria",
  },
  description:
    "Curadoria autoral de moda feminina de alto padrão. Cada peça selecionada com intenção. Consultoria de imagem e personal shopper em Recife.",
  keywords: ["curadoria de moda", "consultoria de imagem", "personal shopper", "moda feminina", "Recife", "BK Curadoria", "Rebeka Fragoso"],
  authors: [{ name: "Rebeka Fragoso" }],
  creator: "BK Curadoria",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: BASE,
    siteName: "BK Curadoria",
    title: "BK Curadoria · Rebeka Fragoso",
    description: "Curadoria autoral de moda feminina de alto padrão. Vestir-se com intenção.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BK Curadoria · Rebeka Fragoso",
    description: "Curadoria autoral de moda feminina de alto padrão. Vestir-se com intenção.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Admin pages use absolute titles to bypass the template above

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${jost.variable}`}>
      <body className="min-h-screen bg-cream text-ink antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
