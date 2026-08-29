import { getAllExpenses, getExpenseCategories } from "@/server/queries/expenses";
import { DespesasClient } from "@/components/admin/DespesasClient";
import { IconCoin } from "@/components/ui/icons";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Despesas · BK Admin" } };

export default async function DespesasPage() {
  const [categories, { items: expensesList }] = await Promise.all([
    getExpenseCategories(),
    getAllExpenses(),
  ]);

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
    </div>
  );
}
