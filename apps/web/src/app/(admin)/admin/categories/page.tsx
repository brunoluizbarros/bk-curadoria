import { getAllCategories } from "@/server/queries/categories";
import { createCategory, deleteCategory } from "@/server/actions/categories";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Categorias · BK Admin" } };

interface Props {
  searchParams: Promise<{ saved?: string }>;
}

export default async function CategoriesPage({ searchParams }: Props) {
  const cats = await getAllCategories();
  const { saved } = await searchParams;

  async function handleCreate(formData: FormData) {
    "use server";
    await createCategory({
      slug: String(formData.get("slug") ?? ""),
      label: String(formData.get("label") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? cats.length),
      active: formData.get("active") === "on",
    });
    redirect("/admin/categories?saved=1");
  }

  return (
    <div>
      <h1 className="font-display font-400 text-3xl text-ink mb-4">Categorias</h1>

      {saved === "1" && (
        <p className="text-sm text-sage-deep bg-sage/10 px-3 py-2 rounded mb-4">Categoria criada com sucesso.</p>
      )}

      <div className="space-y-2 mb-8">
        {cats.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3 bg-cream rounded-card px-4 py-3 border border-ink/10">
            <div className="flex-1">
              <span className="font-body text-sm text-ink">{cat.label}</span>
              <span className="font-body text-xs text-ink-soft ml-2">({cat.slug})</span>
            </div>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm ${cat.active ? "bg-sage/20 text-sage-deep" : "bg-ink/10 text-ink-soft"}`}>
              {cat.active ? "Ativa" : "Inativa"}
            </span>
            <form action={async () => {
              "use server";
              await deleteCategory(cat.id);
              redirect("/admin/categories");
            }}>
              <Button variant="danger" size="sm" type="submit">✕</Button>
            </form>
          </div>
        ))}
      </div>

      <form action={handleCreate} className="space-y-3 bg-cream-soft rounded-card p-4">
        <p className="font-body text-xs uppercase tracking-widest text-ink-soft">Nova categoria</p>
        <div className="grid grid-cols-2 gap-3">
          <Input id="label" name="label" label="Nome" placeholder="Novidades" required />
          <Input id="slug" name="slug" label="Slug" placeholder="nova" required />
        </div>
        <div className="flex items-center gap-4">
          <Input id="sortOrder" name="sortOrder" label="Ordem" type="number" defaultValue={cats.length} className="w-24" />
          <label className="flex items-center gap-2 mt-4">
            <input type="checkbox" name="active" defaultChecked />
            <span className="font-body text-sm">Ativa</span>
          </label>
        </div>
        <Button type="submit" size="sm">Criar categoria</Button>
      </form>
    </div>
  );
}
