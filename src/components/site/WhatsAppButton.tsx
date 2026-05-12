import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { IconBrandWhatsapp } from "@tabler/icons-react";

type WaCtx =
  | { kind: "default" }
  | { kind: "curadoria" }
  | { kind: "product"; name: string; price: string; slug: string }
  | { kind: "service"; name: string };

interface WhatsAppButtonProps {
  ctx: WaCtx;
  phone: string;
  label?: string;
  className?: string;
  variant?: "terracotta" | "sage" | "cream";
}

const variants = {
  terracotta: "bg-terracotta text-cream hover:bg-terracotta-soft",
  sage: "bg-sage-deep text-cream hover:bg-sage",
  cream: "bg-cream text-ink hover:bg-cream-soft border border-ink/20",
};

export function WhatsAppButton({
  ctx,
  phone,
  label = "Falar no WhatsApp",
  className,
  variant = "terracotta",
}: WhatsAppButtonProps) {
  const href = buildWhatsAppLink(ctx, phone);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-btn",
        "font-body text-xs tracking-[0.2em] uppercase transition-colors",
        variants[variant],
        className
      )}
    >
      <IconBrandWhatsapp size={16} />
      {label}
    </a>
  );
}
