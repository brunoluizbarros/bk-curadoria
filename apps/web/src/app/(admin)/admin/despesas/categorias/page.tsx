import { getAllExpenseCategories } from "@/server/queries/expenses";
import {
  createExpenseCategory,
  deleteExpenseCategory,
  updateExpenseCategory,
} from "@/server/actions/expense-categories";
import { Button } from "@/components/ui/Button";
import { IconCoin } from "@/components/ui/icons";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Categorias de Despesas · BK Admin" } };

export default async function ExpenseCategoriasPage() {
  const categories = await getAllExpenseCategories();

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/despesas" className="text-ink-soft hover:text-ink transition-colors font-body text-xs uppercase tracking-widest flex items-center gap-1">
          <IconCoin size={14} />
          Despesas
        </Link>
        <span className="text-ink-soft">/</span>
        <h1 className="font-display font-400 text-3xl text-ink">Categorias</h1>
      </div>

      {/* Form criar */}
      <form
        action={async (fd: FormData) => {
          "use server";
          const name = fd.get("name") as string;
          if (name?.trim()) {
            await createExpenseCategory({ name: name.trim(), sortOrder: 0, active: true });
          }
          redirect("/admin/despesas/categorias");
        }}
        className="flex gap-2 mb-6"
      >
        <input
          name="name"
          placeholder="Nome da categoria..."
          className="flex-1 border border-ink/20 rounded bg-cream px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink"
          required
        />
        <Button type="submit" size="sm">Criar</Button>
      </form>

      {categories.length === 0 ? (
        <p className="font-body text-sm text-ink-soft">Nenhuma categoria cadastrada.</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 bg-cream rounded-card px-4 py-3 border border-ink/10"
            >
              <div className="flex-1">
                <span className="font-body text-sm text-ink">{cat.name}</span>
                {!cat.active && (
                  <span className="ml-2 font-body text-[10px] text-ink-soft">(inativa)</span>
                )}
              </div>
              <form
                action={async () => {
                  "use server";
                  await updateExpenseCategory(cat.id, {
                    name: cat.name,
                    sortOrder: cat.sortOrder,
                    active: !cat.active,
                  });
                  redirect("/admin/despesas/categorias");
                }}
              >
                <button type="submit" className="font-body text-[10px] text-ink-soft hover:text-ink uppercase tracking-widest transition-colors">
                  {cat.active ? "Desativar" : "Ativar"}
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await deleteExpenseCategory(cat.id);
                  redirect("/admin/despesas/categorias");
                }}
              >
                <button type="submit" className="font-body text-[10px] text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors">
                  Excluir
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
