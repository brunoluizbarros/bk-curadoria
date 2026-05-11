import { db } from "@/db/client";
import { products } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Dashboard · BK Admin" } };

export default async function AdminDashboard() {
  const [total] = await db.select({ count: count() }).from(products);
  const [active] = await db.select({ count: count() }).from(products).where(eq(products.active, true));

  return (
    <div>
      <h1 className="font-display font-400 text-3xl text-ink mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-cream rounded-card p-5 border border-ink/10">
          <p className="font-body text-xs uppercase tracking-widest text-ink-soft mb-1">Total produtos</p>
          <p className="font-display text-4xl text-ink">{total?.count ?? 0}</p>
        </div>
        <div className="bg-cream rounded-card p-5 border border-ink/10">
          <p className="font-body text-xs uppercase tracking-widest text-ink-soft mb-1">Ativos</p>
          <p className="font-display text-4xl text-terracotta">{active?.count ?? 0}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/products/new">
          <Button>Novo produto</Button>
        </Link>
        <Link href="/admin/site">
          <Button variant="secondary">Configurações do site</Button>
        </Link>
        <Link href="/admin/curadoria">
          <Button variant="ghost">Editar curadoria</Button>
        </Link>
        <Link href="/" target="_blank">
          <Button variant="ghost">Ver site ↗</Button>
        </Link>
      </div>
    </div>
  );
}
