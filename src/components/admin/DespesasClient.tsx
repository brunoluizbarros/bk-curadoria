"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExpenseForm } from "@/components/admin/ExpenseForm";
import {
  createExpense,
  updateExpense,
  updateExpenseGroup,
  deleteExpense,
  deleteExpenseGroup,
} from "@/server/actions/expenses";
import { formatBRL, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconChevronDown,
} from "@/components/ui/icons";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ExpenseInput } from "@/lib/validations";
import type { ExpenseCategory } from "@/db/schema";

const PAGE_SIZE = 50;

interface ExpenseRow {
  id: string;
  description: string;
  amountCents: number;
  paidAt: Date;
  notes: string | null;
  installmentGroupId: string | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
  category: ExpenseCategory;
}

type SingleItem = {
  type: "single";
  key: string;
  expense: ExpenseRow;
};

type GroupItem = {
  type: "group";
  key: string;
  groupId: string;
  description: string;
  category: ExpenseCategory;
  totalAmountCents: number;
  visibleAmountCents: number;
  installments: ExpenseRow[];
  visibleInstallmentIds: Set<string>;
};

type DisplayItem = SingleItem | GroupItem;

function buildDisplayItems(
  rows: ExpenseRow[],
  month: string,
  categoryId: string
): DisplayItem[] {
  const groupMap = new Map<string, ExpenseRow[]>();
  const singles: ExpenseRow[] = [];

  for (const row of rows) {
    if (row.installmentGroupId) {
      const arr = groupMap.get(row.installmentGroupId) ?? [];
      arr.push(row);
      groupMap.set(row.installmentGroupId, arr);
    } else {
      singles.push(row);
    }
  }

  const items: DisplayItem[] = [];

  for (const [groupId, installments] of groupMap) {
    installments.sort((a, b) => (a.installmentNumber ?? 0) - (b.installmentNumber ?? 0));

    if (categoryId && installments[0].category.id !== categoryId) continue;

    const visibleInstallments = installments.filter((inst) => {
      if (!month) return true;
      return new Date(inst.paidAt).toISOString().slice(0, 7) === month;
    });

    if (visibleInstallments.length === 0) continue;

    items.push({
      type: "group",
      key: groupId,
      groupId,
      description: installments[0].description,
      category: installments[0].category,
      totalAmountCents: installments.reduce((s, i) => s + i.amountCents, 0),
      visibleAmountCents: visibleInstallments.reduce((s, i) => s + i.amountCents, 0),
      installments,
      visibleInstallmentIds: new Set(visibleInstallments.map((i) => i.id)),
    });
  }

  for (const exp of singles) {
    if (categoryId && exp.category.id !== categoryId) continue;
    if (month && new Date(exp.paidAt).toISOString().slice(0, 7) !== month) continue;
    items.push({ type: "single", key: exp.id, expense: exp });
  }

  items.sort((a, b) => {
    const dateA =
      a.type === "group"
        ? new Date(a.installments[0].paidAt)
        : new Date(a.expense.paidAt);
    const dateB =
      b.type === "group"
        ? new Date(b.installments[0].paidAt)
        : new Date(b.expense.paidAt);
    return dateB.getTime() - dateA.getTime();
  });

  return items;
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
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [page, setPage] = useState(1);

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    for (const e of expenses) {
      months.add(new Date(e.paidAt).toISOString().slice(0, 7));
    }
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [expenses]);

  const allItems = useMemo(
    () => buildDisplayItems(expenses, filterMonth, filterCategory),
    [expenses, filterMonth, filterCategory]
  );

  const totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = allItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const visibleTotal = useMemo(
    () =>
      allItems.reduce(
        (acc, item) =>
          acc +
          (item.type === "single"
            ? item.expense.amountCents
            : item.visibleAmountCents),
        0
      ),
    [allItems]
  );

  function toggleGroup(groupId: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  async function handleSubmit(data: ExpenseInput) {
    const result = await createExpense(data);
    if ("error" in result) {
      const err = (result as { error: unknown }).error;
      toast.error(typeof err === "string" ? err : "Erro ao salvar despesa");
      return result;
    }
    toast.success(
      (data.installments ?? 1) > 1
        ? `${data.installments} parcelas registradas`
        : "Despesa registrada"
    );
    setShowForm(false);
    router.refresh();
  }

  async function handleSaveSingle(id: string, data: ExpenseInput) {
    const result = await updateExpense(id, data);
    if (result && "error" in result) {
      toast.error("Erro ao atualizar despesa");
      return result;
    }
    toast.success("Despesa atualizada");
    setEditingKey(null);
    router.refresh();
  }

  async function handleSaveGroup(groupId: string, data: ExpenseInput) {
    const result = await updateExpenseGroup(groupId, data);
    if (result && "error" in result) {
      toast.error("Erro ao atualizar despesas");
      return result;
    }
    toast.success("Parcelas atualizadas");
    setEditingKey(null);
    router.refresh();
  }

  async function handleDeleteSingle(exp: ExpenseRow) {
    if (!confirm(`Excluir "${exp.description}"?`)) return;
    setDeleting(exp.id);
    await deleteExpense(exp.id);
    setExpenses((prev) => prev.filter((e) => e.id !== exp.id));
    setDeleting(null);
    toast.success("Despesa excluída");
  }

  async function handleDeleteInstallment(inst: ExpenseRow) {
    if (!confirm(`Excluir parcela ${inst.installmentNumber}/${inst.totalInstallments}?`)) return;
    setDeleting(inst.id);
    await deleteExpense(inst.id);
    setExpenses((prev) => prev.filter((e) => e.id !== inst.id));
    setDeleting(null);
    toast.success("Parcela excluída");
  }

  async function handleDeleteGroup(item: GroupItem) {
    if (
      !confirm(
        `Excluir todas as ${item.installments.length} parcelas de "${item.description}"?`
      )
    )
      return;
    setDeleting(item.groupId);
    await deleteExpenseGroup(item.groupId);
    setExpenses((prev) => prev.filter((e) => e.installmentGroupId !== item.groupId));
    setDeleting(null);
    toast.success(`${item.installments.length} parcelas excluídas`);
  }

  function formatMonthLabel(ym: string) {
    const [year, mon] = ym.split("-");
    const date = new Date(Number(year), Number(mon) - 1);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }

  const selectCls =
    "rounded border border-ink/20 bg-cream px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink";

  const iconBtnCls = "transition-colors shrink-0 disabled:opacity-40";

  return (
    <>
      {/* Nova despesa */}
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
              <Link href="/admin/despesas/categorias" className="underline">
                categoria
              </Link>{" "}
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

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={filterMonth}
          onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }}
          className={selectCls}
        >
          <option value="">Todos os meses</option>
          {monthOptions.map((m) => (
            <option key={m} value={m}>{formatMonthLabel(m)}</option>
          ))}
        </select>

        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
          className={selectCls}
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {(filterMonth || filterCategory) && (
          <button
            onClick={() => { setFilterMonth(""); setFilterCategory(""); setPage(1); }}
            className="font-body text-xs text-ink-soft hover:text-ink underline"
          >
            Limpar filtros
          </button>
        )}

        <span className="ml-auto font-body text-xs text-ink-soft">
          {allItems.length} {allItems.length === 1 ? "item" : "itens"}
        </span>
      </div>

      {/* Lista */}
      {pageItems.length === 0 ? (
        <p className="font-body text-sm text-ink-soft">
          {allItems.length === 0 && expenses.length > 0
            ? "Nenhum resultado para os filtros selecionados."
            : "Nenhuma despesa registrada."}
        </p>
      ) : (
        <div className="space-y-2">
          {pageItems.map((item) => {
            /* ── SINGLE ── */
            if (item.type === "single") {
              const exp = item.expense;

              if (editingKey === item.key) {
                return (
                  <div key={exp.id} className="bg-cream rounded-card border border-terracotta/30 px-4 py-4">
                    <p className="font-body text-xs uppercase tracking-widest text-ink-soft mb-4">Editar despesa</p>
                    <ExpenseForm
                      categories={categories}
                      defaultValues={{
                        description: exp.description,
                        categoryId: exp.category.id,
                        amountCents: exp.amountCents,
                        paidAt: new Date(exp.paidAt).toISOString().slice(0, 10),
                        notes: exp.notes ?? undefined,
                        installments: 1,
                      }}
                      onSubmit={(data) => handleSaveSingle(exp.id, data)}
                      submitLabel="Salvar alterações"
                      onCancel={() => setEditingKey(null)}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={exp.id}
                  className="flex items-center gap-4 bg-cream rounded-card px-4 py-3 border border-ink/10"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-ink truncate">{exp.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-body text-xs bg-ink/5 text-ink-soft px-2 py-0.5 rounded-sm">
                        {exp.category.name}
                      </span>
                      <span className="font-body text-xs text-ink-soft">{formatDate(exp.paidAt)}</span>
                    </div>
                  </div>
                  <span className="font-body text-sm text-ink font-medium shrink-0">
                    {formatBRL(exp.amountCents)}
                  </span>
                  <button
                    onClick={() => setEditingKey(item.key)}
                    className={cn(iconBtnCls, "text-ink-soft hover:text-ink")}
                  >
                    <IconEdit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteSingle(exp)}
                    disabled={deleting === exp.id}
                    className={cn(iconBtnCls, "text-red-300 hover:text-red-500")}
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              );
            }

            /* ── GROUP ── */
            const isOpen = openGroups.has(item.groupId);
            const isFilteredByMonth = filterMonth !== "";

            if (editingKey === item.key) {
              return (
                <div key={item.groupId} className="bg-cream rounded-card border border-terracotta/30 px-4 py-4">
                  <p className="font-body text-xs uppercase tracking-widest text-ink-soft mb-1">
                    Editar grupo de parcelas
                  </p>
                  <p className="font-body text-xs text-ink-soft mb-4">
                    {item.installments.length} parcelas · alterações aplicadas a todas
                  </p>
                  <ExpenseForm
                    categories={categories}
                    defaultValues={{
                      description: item.description,
                      categoryId: item.category.id,
                      amountCents: item.totalAmountCents,
                      paidAt: new Date(item.installments[0].paidAt).toISOString().slice(0, 10),
                      notes: item.installments[0].notes ?? undefined,
                      installments: item.installments.length,
                    }}
                    onSubmit={(data) => handleSaveGroup(item.groupId, data)}
                    submitLabel="Salvar alterações"
                    onCancel={() => setEditingKey(null)}
                  />
                </div>
              );
            }

            return (
              <div key={item.groupId} className="bg-cream rounded-card border border-ink/10 overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-ink/5 transition-colors select-none"
                  onClick={() => toggleGroup(item.groupId)}
                >
                  <IconChevronDown
                    size={14}
                    className={cn(
                      "text-ink-soft shrink-0 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-ink truncate">{item.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-body text-xs bg-ink/5 text-ink-soft px-2 py-0.5 rounded-sm">
                        {item.category.name}
                      </span>
                      <span className="font-body text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-sm">
                        {item.installments.length}x
                      </span>
                      {isFilteredByMonth && item.visibleInstallmentIds.size < item.installments.length && (
                        <span className="font-body text-xs text-ink-soft">
                          {item.visibleInstallmentIds.size}/{item.installments.length} neste mês
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {isFilteredByMonth && item.visibleAmountCents !== item.totalAmountCents ? (
                      <>
                        <p className="font-body text-sm text-ink font-medium">
                          {formatBRL(item.visibleAmountCents)}
                        </p>
                        <p className="font-body text-xs text-ink-soft">
                          de {formatBRL(item.totalAmountCents)}
                        </p>
                      </>
                    ) : (
                      <p className="font-body text-sm text-ink font-medium">
                        {formatBRL(item.totalAmountCents)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingKey(item.key); }}
                    className={cn(iconBtnCls, "text-ink-soft hover:text-ink ml-1")}
                  >
                    <IconEdit size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteGroup(item); }}
                    disabled={deleting === item.groupId}
                    className={cn(iconBtnCls, "text-red-300 hover:text-red-500")}
                  >
                    <IconTrash size={14} />
                  </button>
                </div>

                {/* Parcelas */}
                {isOpen && (
                  <div className="border-t border-ink/10 divide-y divide-ink/5">
                    {item.installments.map((inst) => {
                      const isVisible = !isFilteredByMonth || item.visibleInstallmentIds.has(inst.id);
                      return (
                        <div
                          key={inst.id}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 pl-9",
                            !isVisible && "opacity-40"
                          )}
                        >
                          <span className="font-body text-xs text-ink-soft w-8 shrink-0 tabular-nums">
                            {inst.installmentNumber}/{inst.totalInstallments}
                          </span>
                          <span className="font-body text-xs text-ink-soft flex-1">
                            {formatDate(inst.paidAt)}
                          </span>
                          <span className="font-body text-xs text-ink font-medium tabular-nums">
                            {formatBRL(inst.amountCents)}
                          </span>
                          <button
                            onClick={() => handleDeleteInstallment(inst)}
                            disabled={deleting === inst.id}
                            className={cn(iconBtnCls, "text-red-200 hover:text-red-500")}
                          >
                            <IconTrash size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="font-body text-xs uppercase tracking-widest px-3 py-1.5 rounded-btn border transition-colors border-ink/20 text-ink-soft hover:border-ink hover:text-ink disabled:border-ink/10 disabled:text-ink/30 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <span className="font-body text-xs text-ink-soft">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="font-body text-xs uppercase tracking-widest px-3 py-1.5 rounded-btn border transition-colors border-ink/20 text-ink-soft hover:border-ink hover:text-ink disabled:border-ink/10 disabled:text-ink/30 disabled:cursor-not-allowed"
          >
            Próxima →
          </button>
        </div>
      )}

      {/* Total */}
      {allItems.length > 0 && (
        <div className="mt-4 flex justify-end">
          <span className="font-body text-sm text-ink-soft">
            {filterMonth || filterCategory ? "Total filtrado: " : "Total: "}
            <span className="text-ink font-medium">{formatBRL(visibleTotal)}</span>
          </span>
        </div>
      )}
    </>
  );
}
