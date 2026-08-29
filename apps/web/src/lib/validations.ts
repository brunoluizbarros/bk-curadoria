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
  name: z.string().trim().min(1, "Nome obrigatório"),
  color: z.string().trim().min(1, "Cor obrigatória"),
  priceCents: z.number().int().positive("Preço inválido"),
  tag: z.string().trim().optional(),
  description: z.string().trim().min(1, "Descrição obrigatória"),
  composition: z.string().trim().optional(),
  origin: z.string().trim().optional(),
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

// ─── Customers & Addresses ───────────────────────────────────────────────────

export const customerSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(brPhoneRegex, "Telefone inválido — informe DDD + número")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  document: z.string().optional(),
  notes: z.string().optional(),
});

export const addressSchema = z.object({
  label: z.string().optional(),
  cep: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().length(8, "CEP deve ter 8 dígitos")),
  street: z.string().min(1, "Logradouro obrigatório"),
  number: z.string().min(1, "Número obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro obrigatório"),
  city: z.string().min(1, "Cidade obrigatória"),
  state: z.string().length(2, "UF deve ter 2 letras"),
  isDefault: z.boolean(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type AddressInput = z.infer<typeof addressSchema>;

// ─── Orders ──────────────────────────────────────────────────────────────────

export const orderItemSchema = z.object({
  productId: z.string().uuid("Produto inválido"),
  unitPriceCents: z.number().int().positive("Preço inválido"),
  discountCents: z.number().int().min(0),
  quantity: z.number().int().positive(),
});

export const orderSchema = z.object({
  customerId: z.string().uuid("Cliente obrigatório"),
  // select nativo manda "" quando não há endereço selecionado — trata como ausência
  addressId: z.union([z.literal(""), z.string().uuid()]).optional().nullable(),
  soldAt: z.string().min(1, "Data da venda obrigatória"),
  discountCents: z.number().int().min(0),
  shippingCents: z.number().int().min(0),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "Adicione pelo menos um produto"),
});

export type OrderInput = z.infer<typeof orderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;

// ─── Loyalty / Fidelidade ─────────────────────────────────────────────────────

export const loyaltyConfigSchema = z.object({
  enabled: z.boolean(),
  percent: z.number().min(0).max(100),
  validityDays: z.number().int().min(1),
  minOrderCents: z.number().int().min(0),
});

export type LoyaltyConfigInput = z.infer<typeof loyaltyConfigSchema>;

// ─── Payments ────────────────────────────────────────────────────────────────

export const paymentSchema = z
  .object({
    method: z.enum(["pix", "credit_card", "debit_card", "cash", "transfer"], {
      required_error: "Método obrigatório",
    }),
    brand: z.string().optional(),
    installments: z.number().int().min(1),
    grossCents: z.number().int().positive("Valor bruto obrigatório"),
    feePercent: z.number().min(0).max(100),
    feeCents: z.number().int().min(0),
    netCents: z.number().int().positive("Valor líquido obrigatório"),
    paidAt: z.string().min(1, "Data do pagamento obrigatória"),
    settledAt: z.string().optional().nullable(),
    reference: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((d) => d.netCents <= d.grossCents, {
    message: "Valor líquido não pode ser maior que o bruto",
    path: ["netCents"],
  });

export type PaymentInput = z.infer<typeof paymentSchema>;

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const expenseCategorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  sortOrder: z.number().int(),
  active: z.boolean(),
});

export const expenseSchema = z.object({
  categoryId: z.string().uuid("Categoria obrigatória"),
  description: z.string().min(1, "Descrição obrigatória"),
  amountCents: z.number().int().positive("Valor obrigatório"),
  paidAt: z.string().min(1, "Data obrigatória"),
  notes: z.string().optional(),
  installments: z.number().int().min(1).max(24),
});

export type ExpenseCategoryInput = z.infer<typeof expenseCategorySchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
