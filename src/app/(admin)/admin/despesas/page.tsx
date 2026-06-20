import { getAllExpenses, getExpenseCategories } from "@/server/queries/expenses";
import { DespesasClient } from "@/components/admin/DespesasClient";
import { Pagination } from "@/components/admin/Pagination";
import { IconCoin } from "@/components/ui/icons";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Despesas · BK Admin" } };

const LIMIT = 20;

export default async function DespesasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const [categories, { items: expensesList, total }] = await Promise.all([
    getExpenseCategories(),
    getAllExpenses(undefined, { page, limit: LIMIT }),
  ]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <IconCoin size={22} className="text-terracotta" />
          <h1 className="font-display font-400 text-3xl text-ink">Despesas</h1>
        </div>
        <Link
          href="/admin/despesas/categorias"
          className="font-body text-xs text-ink-soft hover:text-ink transition-colors uppercase tracking-widest"
        >
          Categorias
        </Link>
      </div>

      <DespesasClient
        categories={categories}
        initialExpenses={expensesList}
      />

      <Pagination page={page} totalPages={totalPages} baseHref="/admin/despesas" />
    </div>
  );
}
