import Script from "next/script";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { WishlistFloatingButton } from "@/components/site/WishlistFloatingButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildLocalBusinessSchema } from "@/lib/jsonld";
import { getSiteConfig } from "@/server/queries/site-config";
import { getBusinessConfig } from "@/server/queries/settings";

// ponytail: force-dynamic aqui matava o cache (e o ISR) do site inteiro e tornava
// os revalidatePath("/", "layout") em saveBusinessConfig/etc um no-op. Sem cache, nada pra invalidar.

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [config, biz] = await Promise.all([
    getSiteConfig().catch(() => ({} as Record<string, string>)),
    getBusinessConfig().catch(() => null),
  ]);

  const gaId = config.ga_measurement_id?.trim();
  const metaPixelId = config.meta_pixel_id?.trim();

  const sameAs: string[] = [];
  if (biz?.business_instagram_url) sameAs.push(biz.business_instagram_url);
  if (biz?.business_facebook_url) sameAs.push(biz.business_facebook_url);

  const localBusinessSchema = biz
    ? buildLocalBusinessSchema({
        addressStreet: biz.business_address_street || undefined,
        city: biz.business_city || undefined,
        state: biz.business_state || undefined,
        postalCode: biz.business_postal_code || undefined,
        phone: biz.business_phone || undefined,
        email: biz.business_email || undefined,
        openingHours: biz.business_opening_hours || undefined,
        latitude: biz.business_latitude || undefined,
        longitude: biz.business_longitude || undefined,
        sameAs: sameAs.length ? sameAs : undefined,
      })
    : null;

  return (
    <>
      {localBusinessSchema && <JsonLd data={localBusinessSchema} />}

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

      {metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      )}

      <Navbar />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer
        signature={config.footer_sig}
        bizPhone={biz?.business_phone}
        bizAddress={biz?.business_address_street}
        bizInstagramUrl={biz?.business_instagram_url}
      />
      <WishlistFloatingButton />
    </>
  );
}
