import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { getSiteConfig } from "@/server/queries/site-config";

export default async function SiteLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const config = await getSiteConfig();

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {children}
        {modal}
      </main>
      <Footer signature={config.footer_sig} />
    </>
  );
}
