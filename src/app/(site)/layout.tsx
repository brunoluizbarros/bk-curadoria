import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { getSiteConfig } from "@/server/queries/site-config";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getSiteConfig();

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer signature={config.footer_sig} />
    </>
  );
}
