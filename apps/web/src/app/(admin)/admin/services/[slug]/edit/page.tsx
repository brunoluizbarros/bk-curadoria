import { getServiceBySlug } from "@/server/queries/services";
import { updateService, upsertServiceStep, deleteServiceStep } from "@/server/actions/services";
import { notFound, redirect } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}

export const metadata: Metadata = { title: { absolute: "Editar serviço · BK Admin" } };

export default async function EditServicePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { saved, error } = await searchParams;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";
    const result = await updateService(slug, {
      name: formData.get("name"),
      subtitle: formData.get("subtitle"),
      heroGradient: formData.get("heroGradient"),
      lead: formData.get("lead"),
      deliverable: formData.get("deliverable"),
      duration: formData.get("duration"),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      active: formData.get("active") === "on",
    });
    if (result?.error) {
      redirect(`/admin/services/${slug}/edit?error=1`);
    }
    redirect(`/admin/services/${slug}/edit?saved=1`);
  }

  async function handleAddStep(formData: FormData) {
    "use server";
    await upsertServiceStep(slug, {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      sortOrder: service!.steps.length,
    });
    redirect(`/admin/services/${slug}/edit`);
  }

  return (
    <div>
      <h1 className="font-display font-400 text-3xl text-ink mb-2">
        {service.number}. {service.name}
      </h1>

      {saved === "1" && (
        <p className="text-sm text-sage-deep bg-sage/10 px-3 py-2 rounded mb-4">Serviço salvo com sucesso.</p>
      )}
      {error === "1" && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">Erro ao salvar. Verifique os campos obrigatórios.</p>
      )}

      {/* Form principal */}
      <form action={handleUpdate} className="space-y-4 mb-10">
        <input type="hidden" name="sortOrder" value={service.sortOrder} />
        <div className="grid grid-cols-2 gap-4">
          <Input id="name" name="name" label="Nome" defaultValue={service.name} required />
          <Input id="subtitle" name="subtitle" label="Subtítulo" defaultValue={service.subtitle} required />
        </div>
        <Textarea id="heroGradient" name="heroGradient" label="Gradiente hero (CSS)" rows={2} defaultValue={service.heroGradient} />
        <Textarea id="lead" name="lead" label="Parágrafo de abertura" rows={4} defaultValue={service.lead} />
        <Textarea id="deliverable" name="deliverable" label="O que você recebe" rows={3} defaultValue={service.deliverable} />
        <Input id="duration" name="duration" label="Duração" defaultValue={service.duration} />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="active" defaultChecked={service.active} />
          <span className="font-body text-sm">Ativo</span>
        </label>
        <Button type="submit">Salvar serviço</Button>
      </form>

      {/* Etapas */}
      <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-3">Etapas</h2>
      <div className="space-y-3 mb-5">
        {service.steps.map((step, i) => (
          <div key={step.id} className="bg-cream rounded-card px-4 py-3 border border-ink/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-body text-sm font-400 text-ink">{i + 1}. {step.title}</p>
                <p className="font-body text-xs text-ink-soft mt-0.5">{step.description}</p>
              </div>
              <form action={async () => {
                "use server";
                await deleteServiceStep(step.id, slug);
                redirect(`/admin/services/${slug}/edit`);
              }}>
                <Button variant="danger" size="sm" type="submit">✕</Button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <form action={handleAddStep} className="space-y-3 bg-cream-soft rounded-card p-4">
        <p className="font-body text-xs uppercase tracking-widest text-ink-soft">Nova etapa</p>
        <Input id="title" name="title" label="Título" required />
        <Textarea id="description" name="description" label="Descrição" rows={2} />
        <Button type="submit" variant="secondary" size="sm">Adicionar etapa</Button>
      </form>
    </div>
  );
}
