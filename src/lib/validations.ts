import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

export const productSchema = z.object({
  slug: z.string().min(1, "Slug obrigatório").regex(/^[a-z0-9-]+$/, "Apenas letras, números e hífens"),
  name: z.string().min(1, "Nome obrigatório"),
  color: z.string().min(1, "Cor obrigatória"),
  priceCents: z.number().int().positive("Preço inválido"),
  tag: z.string().optional(),
  description: z.string().min(1, "Descrição obrigatória"),
  composition: z.string().optional(),
  origin: z.string().optional(),
  fallbackGradient: z.string().optional(),
  featured: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number(),
  categoryIds: z.array(z.string().uuid()),
});

export const categorySchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  sortOrder: z.number().int(),
  active: z.boolean(),
});

export const serviceSchema = z.object({
  name: z.string().min(1),
  subtitle: z.string().min(1),
  heroGradient: z.string().min(1),
  lead: z.string().min(1),
  deliverable: z.string().min(1),
  duration: z.string().min(1),
  sortOrder: z.number().int(),
  active: z.boolean(),
});

export const serviceStepSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  sortOrder: z.number().int().default(0),
});

export const curadoriaContentSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  titleEm: z.string().optional(),
  leadParagraph1: z.string().min(1),
  leadParagraph2: z.string().optional(),
  quoteText: z.string().min(1),
  quoteSignature: z.string().optional(),
  ctaLabel: z.string().min(1),
  ctaSubtext: z.string().optional(),
});

// Aceita 10-11 dígitos (DDD + número, sem código do país)
// ou 12-13 dígitos (55 + DDD + número), apenas dígitos
const brPhoneRegex = /^(55)?[1-9]{2}9?[0-9]{8}$/;

function phoneMsg(field: string) {
  return `${field} inválido — informe DDD + número (ex: 81999998888)`;
}

export const wishlistSubmitSchema = z.object({
  wisherName: z.string().min(2, "Nome obrigatório"),
  wisherPhone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(brPhoneRegex, phoneMsg("Seu WhatsApp"))),
  gifterName: z.string().min(2, "Nome obrigatório"),
  gifterPhone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(brPhoneRegex, phoneMsg("WhatsApp do presenteador"))),
  gifterRelation: z.string().min(1, "Informe a relação (ex: namorado, marido, amiga)"),
  note: z.string().optional(),
  occasion: z.string().optional(),
  productIds: z.array(z.string().uuid()).min(1, "Adicione pelo menos um produto"),
});

export type WishlistSubmitInput = z.infer<typeof wishlistSubmitSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type CuradoriaContentInput = z.infer<typeof curadoriaContentSchema>;
