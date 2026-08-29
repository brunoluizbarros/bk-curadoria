import { getCuradoriaContent } from "@/server/queries/curadoria";
import { updateCuradoriaContent, upsertCrivo, deleteCrivo, upsertRelacao, deleteRelacao } from "@/server/actions/curadoria";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Curadoria · BK Admin" } };

interface Props {
  searchParams: Promise<{ saved?: string }>;
}

export default async function CuradoriaAdminPage({ searchParams }: Props) {
  const { content, crivos, relacao } = await getCuradoriaContent();
  const { saved } = await searchParams;

  async function handleUpdateContent(formData: FormData) {
    "use server";
    await updateCuradoriaContent({
      eyebrow: String(formData.get("eyebrow") ?? ""),
      title: String(formData.get("title") ?? ""),
      titleEm: String(formData.get("titleEm") ?? "") || undefined,
      leadParagraph1: String(formData.get("leadParagraph1") ?? ""),
      leadParagraph2: String(formData.get("leadParagraph2") ?? "") || undefined,
      quoteText: String(formData.get("quoteText") ?? ""),
      quoteSignature: String(formData.get("quoteSignature") ?? "") || undefined,
      ctaLabel: String(formData.get("ctaLabel") ?? ""),
      ctaSubtext: String(formData.get("ctaSubtext") ?? "") || undefined,
    });
    redirect("/admin/curadoria?saved=1");
  }

  return (
    <div>
      <h1 className="font-display font-400 text-3xl text-ink mb-4">Página Curadoria</h1>

      {saved === "1" && (
        <p className="text-sm text-sage-deep bg-sage/10 px-3 py-2 rounded mb-4">Conteúdo salvo com sucesso.</p>
      )}

      {/* Conteúdo principal */}
      <form action={handleUpdateContent} className="space-y-4 mb-10">
        <div className="grid grid-cols-2 gap-4">
          <Input id="eyebrow" name="eyebrow" label="Eyebrow" defaultValue={content?.eyebrow} />
          <Input id="title" name="title" label="Título" defaultValue={content?.title} />
        </div>
        <Input id="titleEm" name="titleEm" label="Título ênfase (itálico)" defaultValue={content?.titleEm ?? ""} />
        <Textarea id="leadParagraph1" name="leadParagraph1" label="Parágrafo 1" rows={3} defaultValue={content?.leadParagraph1} />
        <Textarea id="leadParagraph2" name="leadParagraph2" label="Parágrafo 2" rows={3} defaultValue={content?.leadParagraph2 ?? ""} />
        <Textarea id="quoteText" name="quoteText" label="Quote" rows={3} defaultValue={content?.quoteText} />
        <Input id="quoteSignature" name="quoteSignature" label="Assinatura do quote" defaultValue={content?.quoteSignature ?? ""} />
        <div className="grid grid-cols-2 gap-4">
          <Input id="ctaLabel" name="ctaLabel" label="Texto do CTA" defaultValue={content?.ctaLabel} />
          <Input id="ctaSubtext" name="ctaSubtext" label="Subtexto do CTA" defaultValue={content?.ctaSubtext ?? ""} />
        </div>
        <Button type="submit">Salvar conteúdo</Button>
      </form>

      {/* Crivos */}
      <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-3">Crivos</h2>
      <div className="space-y-2 mb-4">
        {crivos.map((crivo) => (
          <div key={crivo.id} className="flex items-start gap-3 bg-cream rounded-card px-4 py-3 border border-ink/10">
            <span className="font-display italic text-xl text-gold">{crivo.number}</span>
            <div className="flex-1">
              <p className="font-body text-sm text-ink">{crivo.title}</p>
              <p className="font-body text-xs text-ink-soft">{crivo.description}</p>
            </div>
            <form action={async () => {
              "use server";
              await deleteCrivo(crivo.id);
              redirect("/admin/curadoria");
            }}>
              <Button variant="danger" size="sm">✕</Button>
            </form>
          </div>
        ))}
      </div>
      <form action={async (fd: FormData) => {
        "use server";
        await upsertCrivo({ number: String(fd.get("number")), title: String(fd.get("title")), description: String(fd.get("description")), sortOrder: crivos.length });
        redirect("/admin/curadoria");
      }} className="space-y-2 bg-cream-soft rounded-card p-4 mb-8">
        <p className="font-body text-xs uppercase tracking-widest text-ink-soft">Novo crivo</p>
        <div className="grid grid-cols-3 gap-3">
          <Input id="crivo-number" name="number" label="Número" placeholder="01" required />
          <Input id="crivo-title" name="title" label="Título" required className="col-span-2" />
        </div>
        <Textarea id="crivo-desc" name="description" label="Descrição" rows={2} />
        <Button type="submit" size="sm" variant="secondary">Adicionar crivo</Button>
      </form>

      {/* Relação */}
      <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-3">Como funciona</h2>
      <div className="space-y-2 mb-4">
        {relacao.map((item) => (
          <div key={item.id} className="flex items-start gap-3 bg-cream rounded-card px-4 py-3 border border-ink/10">
            <div className="flex-1">
              <p className="font-body text-sm text-ink">{item.title}</p>
              <p className="font-body text-xs text-ink-soft">{item.description}</p>
            </div>
            <form action={async () => {
              "use server";
              await deleteRelacao(item.id);
              redirect("/admin/curadoria");
            }}>
              <Button variant="danger" size="sm">✕</Button>
            </form>
          </div>
        ))}
      </div>
      <form action={async (fd: FormData) => {
        "use server";
        await upsertRelacao({ title: String(fd.get("title")), description: String(fd.get("description")), sortOrder: relacao.length });
        redirect("/admin/curadoria");
      }} className="space-y-2 bg-cream-soft rounded-card p-4">
        <p className="font-body text-xs uppercase tracking-widest text-ink-soft">Novo item</p>
        <Input id="rel-title" name="title" label="Título" required />
        <Textarea id="rel-desc" name="description" label="Descrição" rows={2} />
        <Button type="submit" size="sm" variant="secondary">Adicionar item</Button>
      </form>
    </div>
  );
}
