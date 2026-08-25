import { getWishlistByIdAdmin } from "@/server/queries/wishlists";
import { getSiteConfig } from "@/server/queries/site-config";
import { deleteWishlist, updateWishlistStatus } from "@/server/actions/wishlists";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatBRL } from "@/lib/format";
import { pickFallbackGradient } from "@/lib/gradients";
import { Button } from "@/components/ui/Button";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { IconBrandWhatsapp, IconArrowLeft, IconHeart } from "@/components/ui/icons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Lista de Desejos · BK Admin" } };

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

const STATUS_OPTIONS = [
  { value: "pending", label: "Nova" },
  { value: "contacted", label: "Contatada" },
  { value: "closed", label: "Fechada" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gold/20 text-gold",
  contacted: "bg-sage/20 text-sage-deep",
  closed: "bg-ink/10 text-ink-soft",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WishlistDetailPage({ params }: Props) {
  const { id } = await params;
  const [list, config] = await Promise.all([
    getWishlistByIdAdmin(id),
    getSiteConfig(),
  ]);

  if (!list) notFound();

  const phone = config.whatsapp_number ?? "5581999999999";
  const token = list.token;

  const contactGifterLink = buildWhatsAppLink(
    {
      kind: "wishlist-store-to-gifter",
      wisherName: list.wisherName,
      gifterName: list.gifterName,
      gifterRelation: list.gifterRelation,
      token,
    },
    list.gifterPhone
  );

  const contactWisherLink = buildWhatsAppLink(
    { kind: "default" },
    list.wisherPhone
  );

  return (
    <div className="max-w-xl">
      {/* Voltar */}
      <Link
        href="/admin/wishlists"
        className="inline-flex items-center gap-1 text-xs font-body text-ink-soft hover:text-ink uppercase tracking-widest mb-6"
      >
        <IconArrowLeft size={14} />
        Todas as listas
      </Link>

      {/* Cabeçalho */}
      <div className="flex items-center gap-2 mb-4">
        <IconHeart size={20} className="text-terracotta" />
        <h1 className="font-display font-400 text-2xl text-ink">{list.wisherName}</h1>
        <span className={`ml-auto font-body text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm ${STATUS_STYLES[list.status] ?? STATUS_STYLES.pending}`}>
          {STATUS_OPTIONS.find((s) => s.value === list.status)?.label ?? list.status}
        </span>
      </div>

      {/* Contatos */}
      <div className="bg-cream rounded-card px-4 py-4 border border-ink/10 mb-6 space-y-3">
        <div>
          <p className="font-body text-[10px] tracking-widest uppercase text-ink-soft">Quem fez a lista</p>
          <p className="font-body text-sm text-ink">{list.wisherName}</p>
          <p className="font-body text-xs text-ink-soft">{list.wisherPhone}</p>
        </div>
        <div className="border-t border-ink/10 pt-3">
          <p className="font-body text-[10px] tracking-widest uppercase text-ink-soft">Para quem presentear</p>
          <p className="font-body text-sm text-ink">{list.gifterName}</p>
          <p className="font-body text-xs text-ink-soft">{list.gifterPhone} · {list.gifterRelation}</p>
        </div>
        {list.note && (
          <div className="border-t border-ink/10 pt-3">
            <p className="font-body text-[10px] tracking-widest uppercase text-ink-soft">Recadinho</p>
            <p className="font-body text-sm text-ink italic">"{list.note}"</p>
          </div>
        )}
        <div className="border-t border-ink/10 pt-3">
          <p className="font-body text-[10px] tracking-widest uppercase text-ink-soft">Ocasião</p>
          <p className="font-body text-sm text-ink capitalize">{list.occasion}</p>
        </div>
      </div>

      {/* Produtos */}
      <p className="font-body text-[10px] tracking-widest uppercase text-ink-soft mb-2">
        Produtos na lista ({list.items.length})
      </p>
      <div className="space-y-2 mb-6">
        {list.items.map((item) => (
          <a
            key={item.id}
            href={`${BASE}/produtos/${item.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-cream rounded-card px-3 py-2.5 border border-ink/10 hover:border-ink/30 transition-colors"
          >
            <div
              className="w-10 h-12 rounded shrink-0 overflow-hidden"
              style={{ background: item.firstImage ? undefined : item.fallbackGradient ?? pickFallbackGradient(item.id) }}
            >
              {item.firstImage && (
                <Image
                  src={item.firstImage.url}
                  alt={item.name}
                  width={40}
                  height={48}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-400 text-sm text-ink truncate">{item.name}</p>
              <p className="font-body text-xs text-terracotta">{formatBRL(item.priceCents)}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Ações WhatsApp */}
      <div className="space-y-2 mb-6">
        <a
          href={contactGifterLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-btn font-body text-xs tracking-[0.15em] uppercase bg-terracotta text-cream hover:bg-terracotta-soft transition-colors"
        >
          <IconBrandWhatsapp size={14} />
          Contatar {list.gifterName.split(" ")[0]} (presenteador)
        </a>
        <a
          href={contactWisherLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-btn font-body text-xs tracking-[0.15em] uppercase border border-ink/20 text-ink hover:bg-cream-soft transition-colors"
        >
          <IconBrandWhatsapp size={14} />
          Contatar {list.wisherName.split(" ")[0]} (cliente)
        </a>
        <a
          href={`${BASE}/lista/${token}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-btn font-body text-xs tracking-[0.15em] uppercase border border-ink/20 text-ink hover:bg-cream-soft transition-colors"
        >
          Ver lista pública ↗
        </a>
      </div>

      {/* Status + deletar */}
      <div className="border-t border-ink/10 pt-4 flex items-center gap-3">
        <form
          action={async (formData: FormData) => {
            "use server";
            const newStatus = formData.get("status") as string;
            await updateWishlistStatus(id, newStatus);
          }}
          className="flex items-center gap-2"
        >
          <select
            name="status"
            defaultValue={list.status}
            className="border border-ink/20 bg-cream-soft px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink rounded-btn"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <Button type="submit" variant="ghost" size="sm">Salvar status</Button>
        </form>

        <form
          action={async () => {
            "use server";
            await deleteWishlist(id);
            redirect("/admin/wishlists");
          }}
          className="ml-auto"
        >
          <Button type="submit" variant="danger" size="sm">Deletar</Button>
        </form>
      </div>
    </div>
  );
}
