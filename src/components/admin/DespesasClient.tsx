"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExpenseForm } from "@/components/admin/ExpenseForm";
import { createExpense, deleteExpense } from "@/server/actions/expenses";
import { formatBRL, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import Link from "next/link";
import type { ExpenseInput } from "@/lib/validations";
import type { ExpenseCategory } from "@/db/schema";

interface ExpenseRow {
  id: string;
  description: string;
  amountCents: number;
  paidAt: Date;
  notes: string | null;
  category: ExpenseCategory;
}

interface Props {
  categories: ExpenseCategory[];
  initialExpenses: ExpenseRow[];
}

export function DespesasClient({ categories, initialExpenses }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseRow[]>(initialExpenses);
  const [deleting, setDeleting] = useState<string | null>(null);

  const total = expenses.reduce((acc, e) => acc + e.amountCents, 0);

  async function handleSubmit(data: ExpenseInput) {
    const result = await createExpense(data);
    if ("error" in result && result.error) return result;
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta despesa?")) return;
    setDeleting(id);
    await deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setDeleting(null);
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <IconPlus size={12} />
          Nova despesa
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 bg-cream rounded-card px-4 py-4 border border-ink/10">
          <p className="font-body text-xs uppercase tracking-widest text-ink-soft mb-4">Nova despesa</p>
          {categories.length === 0 ? (
            <p className="font-body text-sm text-ink-soft">
              Crie ao menos uma{" "}
              <Link href="/admin/despesas/categorias" className="underline">categoria</Link>{" "}
              antes de registrar despesas.
            </p>
          ) : (
            <ExpenseForm
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
            />
          )}
        </div>
      )}

      {expenses.length === 0 ? (
        <p className="font-body text-sm text-ink-soft">Nenhuma despesa registrada.</p>
      ) : (
        <>
          <div className="space-y-2">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center gap-4 bg-cream rounded-card px-4 py-3 border border-ink/10"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-ink truncate">{exp.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-body text-xs text-ink-soft bg-ink/5 px-2 py-0.5 rounded-sm">
                      {exp.category.name}
                    </span>
                    <span className="font-body text-xs text-ink-soft">{formatDate(exp.paidAt)}</span>
                  </div>
                </div>
                <span className="font-body text-sm text-ink font-medium shrink-0">{formatBRL(exp.amountCents)}</span>
                <button
                  onClick={() => handleDelete(exp.id)}
                  disabled={deleting === exp.id}
                  className="text-red-300 hover:text-red-500 transition-colors shrink-0 disabled:opacity-40"
                >
                  <IconTrash size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <span className="font-body text-sm text-ink-soft">
              Total: <span className="text-ink font-medium">{formatBRL(total)}</span>
            </span>
          </div>
        </>
      )}
    </>
  );
}
