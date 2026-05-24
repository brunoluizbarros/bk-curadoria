import { getAllCustomers } from "@/server/queries/customers";
import Link from "next/link";
import { IconUsers, IconPlus, IconSearch } from "@/components/ui/icons";
import { formatPhone } from "@/lib/format";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Clientes · BK Admin" } };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const customers = await getAllCustomers(q);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <IconUsers size={22} className="text-terracotta" />
          <h1 className="font-display font-400 text-3xl text-ink">Clientes</h1>
        </div>
        <Link
          href="/admin/clientes/novo"
          className="inline-flex items-center gap-2 bg-terracotta text-cream px-4 py-2 rounded-btn font-body text-xs uppercase tracking-widest hover:bg-terracotta-soft transition-colors"
        >
          <IconPlus size={14} />
          Novo cliente
        </Link>
      </div>

      <form method="get" className="mb-4 flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome ou telefone..."
            className="w-full pl-8 pr-3 py-2 rounded border border-ink/20 bg-cream font-body text-sm text-ink focus:outline-none focus:border-ink"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded border border-ink/20 font-body text-sm text-ink hover:bg-ink/5 transition-colors"
        >
          Buscar
        </button>
      </form>

      {customers.length === 0 ? (
        <p className="font-body text-sm text-ink-soft">
          {q ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
        </p>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/admin/clientes/${c.id}`}
              className="flex items-center gap-4 bg-cream rounded-card px-4 py-3 border border-ink/10 hover:border-ink/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-display font-400 text-sm text-ink truncate">{c.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="font-body text-xs text-ink-soft">{formatPhone(c.phone)}</span>
                  {c.email && (
                    <>
                      <span className="font-body text-xs text-ink-soft">·</span>
                      <span className="font-body text-xs text-ink-soft">{c.email}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
