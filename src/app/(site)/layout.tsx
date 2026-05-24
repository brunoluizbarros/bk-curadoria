// Todas as páginas do site lêem o banco (config, produtos, serviços).
// postgres.railway.internal só existe em runtime — nunca em build.
export const dynamic = "force-dynamic";

import Script from "next/script";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { WishlistFloatingButton } from "@/components/site/WishlistFloatingButton";
import { getSiteConfig } from "@/server/queries/site-config";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getSiteConfig().catch(() => ({} as Record<string, string>));
  const gaId = config.ga_measurement_id?.trim();

  return (
    <>
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      )}
      <Navbar />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer signature={config.footer_sig} />
      <WishlistFloatingButton />
    </>
  );
}
