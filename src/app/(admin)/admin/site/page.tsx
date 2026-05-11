import { getSiteConfig, getHomeDifferentials } from "@/server/queries/site-config";
import { updateSiteConfig, upsertDifferential, deleteDifferential } from "@/server/actions/site-config";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Configurações · BK Admin" } };

const SECTIONS: Array<{ label: string; keys: Array<{ key: string; label: string; placeholder?: string }> }> = [
  {
    label: "WhatsApp",
    keys: [
      { key: "whatsapp_number", label: "Número (só dígitos, com DDI)", placeholder: "5581999999999" },
    ],
  },
  {
    label: "Hero da Home",
    keys: [
      { key: "hero_tag", label: "Eyebrow" },
      { key: "hero_title", label: "Título" },
      { key: "hero_title_em", label: "Título ênfase (itálico)" },
      { key: "hero_body", label: "Subtítulo" },
    ],
  },
  {
    label: "Banner Curadoria",
    keys: [
      { key: "banner_cur_tag", label: "Tag" },
      { key: "banner_cur_title", label: "Título" },
      { key: "banner_cur_title_em", label: "Título ênfase" },
      { key: "banner_cur_cta", label: "Texto do botão" },
    ],
  },
  {
    label: "Sobre",
    keys: [
      { key: "about_tag", label: "Eyebrow" },
      { key: "about_quote", label: "Quote" },
      { key: "about_body", label: "Corpo do texto" },
    ],
  },
  {
    label: "Serviços (home)",
    keys: [
      { key: "svc_tag", label: "Eyebrow" },
      { key: "svc_title", label: "Título" },
      { key: "svc_title_em", label: "Título ênfase" },
      { key: "svc_subtitle", label: "Subtítulo" },
    ],
  },
  {
    label: "CTA Final",
    keys: [
      { key: "cta_title", label: "Título" },
      { key: "cta_title_em", label: "Título ênfase" },
      { key: "cta_subtitle", label: "Subtítulo" },
      { key: "cta_label", label: "Texto do botão" },
    ],
  },
  {
    label: "Footer",
    keys: [
      { key: "footer_sig", label: "Assinatura do footer" },
    ],
  },
];

interface Props {
  searchParams: Promise<{ saved?: string }>;
}

export default async function SiteConfigPage({ searchParams }: Props) {
  const [config, differentials] = await Promise.all([
    getSiteConfig(),
    getHomeDifferentials(),
  ]);
  const { saved } = await searchParams;

  async function handleUpdate(formData: FormData) {
    "use server";
    const data: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") data[key] = value;
    }
    await updateSiteConfig(data);
    redirect("/admin/site?saved=1");
  }

  return (
    <div>
      <h1 className="font-display font-400 text-3xl text-ink mb-4">Configurações do site</h1>

      {saved === "1" && (
        <p className="text-sm text-sage-deep bg-sage/10 px-3 py-2 rounded mb-4">Configurações salvas com sucesso.</p>
      )}

      <form action={handleUpdate} className="space-y-8">
        {SECTIONS.map((section) => (
          <div key={section.label} className="bg-cream rounded-card p-5 border border-ink/10">
            <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-4">{section.label}</h2>
            <div className="space-y-3">
              {section.keys.map(({ key, label, placeholder }) => (
                <Input
                  key={key}
                  id={key}
                  name={key}
                  label={label}
                  defaultValue={config[key] ?? ""}
                  placeholder={placeholder}
                />
              ))}
            </div>
          </div>
        ))}

        <Button type="submit">Salvar configurações</Button>
      </form>

      {/* Diferenciais */}
      <div className="mt-10">
        <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-3">Diferenciais da home</h2>
        <div className="space-y-2 mb-4">
          {differentials.map((d) => (
            <div key={d.id} className="flex items-center gap-3 bg-cream rounded-card px-4 py-3 border border-ink/10">
              <span className="font-body text-xs text-gold">{d.iconName}</span>
              <div className="flex-1">
                <p className="font-body text-sm text-ink">{d.title}</p>
                <p className="font-body text-xs text-ink-soft">{d.description}</p>
              </div>
              <form action={async () => { "use server"; await deleteDifferential(d.id); redirect("/admin/site"); }}>
                <Button variant="danger" size="sm">✕</Button>
              </form>
            </div>
          ))}
        </div>
        <form action={async (fd: FormData) => {
          "use server";
          await upsertDifferential({ iconName: String(fd.get("iconName")), title: String(fd.get("title")), description: String(fd.get("description")), sortOrder: differentials.length });
          redirect("/admin/site");
        }} className="space-y-3 bg-cream-soft rounded-card p-4">
          <p className="font-body text-xs uppercase tracking-widest text-ink-soft">Novo diferencial</p>
          <div className="grid grid-cols-2 gap-3">
            <Input id="iconName" name="iconName" label="Ícone (ex: eye, star, user, refresh)" />
            <Input id="diff-title" name="title" label="Título" required />
          </div>
          <Input id="diff-desc" name="description" label="Descrição" required />
          <Button type="submit" size="sm" variant="secondary">Adicionar</Button>
        </form>
      </div>
    </div>
  );
}
