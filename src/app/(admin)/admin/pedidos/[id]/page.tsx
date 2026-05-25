import { getOrderById } from "@/server/queries/orders";
import { getPaymentFeeConfigs } from "@/server/queries/settings";
import {
  setOrderStatus,
  updateOrderItemStatus,
  addOrderItem,
  removeOrderItem,
  deleteOrder,
} from "@/server/actions/orders";
import { deletePayment, markPaymentSettled } from "@/server/actions/payments";
import { getAllProductsAdmin } from "@/server/queries/products";
import { formatBRL, formatDate, formatPhone, formatCEP } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { IconReceipt, IconMapPin, IconCashBanknote, IconCircleCheck, IconClock, IconTrash, IconPlus, IconBrandWhatsapp } from "@/components/ui/icons";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PaymentFormInline } from "@/components/admin/PaymentFormInline";
import { WaOrderButtons } from "@/components/admin/WaOrderButtons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Pedido · BK Admin" } };

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Rascunho", cls: "bg-ink/10 text-ink-soft" },
  sent: { label: "Enviado", cls: "bg-gold/20 text-gold" },
  returned: { label: "Devolvido", cls: "bg-terracotta/20 text-terracotta" },
  paid: { label: "Pago", cls: "bg-sage/20 text-sage-deep" },
  cancelled: { label: "Cancelado", cls: "bg-red-100 text-red-600" },
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho" },
  { value: "sent", label: "Enviado" },
  { value: "returned", label: "Devolvido" },
  { value: "paid", label: "Pago" },
  { value: "cancelled", label: "Cancelado" },
] as const;

const METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  cash: "Dinheiro",
  transfer: "Transferência",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PedidoDetailPage({ params }: Props) {
  const { id } = await params;
  const [order, allProducts, feeConfigs] = await Promise.all([
    getOrderById(id),
    getAllProductsAdmin(),
    getPaymentFeeConfigs(),
  ]);

  if (!order) notFound();

  const s = STATUS_LABELS[order.status] ?? STATUS_LABELS.draft;
  const keptItems = order.items.filter((i) => i.status === "kept");
  const returnedItems = order.items.filter((i) => i.status === "returned");
  const totalPaid = order.payments.reduce((acc, p) => acc + p.grossCents, 0);
  const totalPending = order.payments.reduce(
    (acc, p) => (p.settledAt ? acc : acc + p.netCents),
    0
  );

  return (
    <div className="max-w-2xl">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/admin/pedidos" className="font-body text-xs text-ink-soft hover:text-ink uppercase tracking-widest flex items-center gap-1 mb-2">
            <IconReceipt size={12} />
            Pedidos
          </Link>
          <h1 className="font-display font-400 text-3xl text-ink">{order.customer.name}</h1>
          <p className="font-body text-sm text-ink-soft mt-0.5">
            Envio em {formatDate(order.soldAt)} · {formatPhone(order.customer.phone)}
          </p>
        </div>
        <span className={`font-body text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm mt-1 ${s.cls}`}>
          {s.label}
        </span>
      </div>

      {/* Endereço */}
      {order.address && (
        <div className="bg-cream rounded-card px-4 py-3 border border-ink/10 mb-6 flex items-start gap-2">
          <IconMapPin size={14} className="text-ink-soft mt-0.5 shrink-0" />
          <div>
            <p className="font-body text-sm text-ink">
              {order.address.street}, {order.address.number}
              {order.address.complement ? `, ${order.address.complement}` : ""}
            </p>
            <p className="font-body text-xs text-ink-soft">
              {order.address.neighborhood} · {order.address.city}/{order.address.state} · CEP {formatCEP(order.address.cep)}
            </p>
          </div>
        </div>
      )}

      {/* Itens */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft">Itens da malinha</h2>
          {/* Adicionar produto */}
          <form
            action={async (fd: FormData) => {
              "use server";
              const productId = fd.get("productId") as string;
              if (productId) await addOrderItem(id, productId);
            }}
            className="flex items-center gap-2"
          >
            <select
              name="productId"
              className="border border-ink/20 bg-cream px-2 py-1 font-body text-xs text-ink rounded focus:outline-none focus:border-ink"
            >
              <option value="">+ Adicionar produto</option>
              {allProducts
                .filter((p) => !order.items.find((i) => i.productId === p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {formatBRL(p.priceCents)}</option>
                ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center gap-1 font-body text-xs text-ink-soft hover:text-ink transition-colors"
            >
              <IconPlus size={12} />
            </button>
          </form>
        </div>

        <div className="space-y-2">
          {order.items.map((item) => {
            const isKept = item.status === "kept";
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-card px-4 py-3 border transition-colors ${
                  isKept
                    ? "bg-cream border-ink/10"
                    : "bg-ink/5 border-ink/5 opacity-60"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`font-body text-sm truncate ${isKept ? "text-ink" : "text-ink-soft line-through"}`}>
                    {item.product.name}
                  </p>
                  <p className="font-body text-xs text-terracotta">
                    {item.quantity}× {formatBRL(item.unitPriceCents)}
                    {item.quantity > 1 && ` = ${formatBRL(item.unitPriceCents * item.quantity)}`}
                  </p>
                </div>

                <form
                  action={async () => {
                    "use server";
                    await updateOrderItemStatus(item.id, id, isKept ? "returned" : "kept");
                  }}
                >
                  <button
                    type="submit"
                    className={`font-body text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm border transition-colors ${
                      isKept
                        ? "border-sage/40 text-sage-deep hover:bg-ink/5"
                        : "border-terracotta/40 text-terracotta hover:bg-cream"
                    }`}
                  >
                    {isKept ? "Ficou" : "Devolveu"}
                  </button>
                </form>

                <form
                  action={async () => {
                    "use server";
                    await removeOrderItem(item.id, id);
                  }}
                >
                  <button type="submit" className="text-red-300 hover:text-red-500 transition-colors">
                    <IconTrash size={12} />
                  </button>
                </form>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-4 bg-cream rounded-card px-4 py-3 border border-ink/10 space-y-1">
          {keptItems.length > 0 && (
            <div className="flex justify-between font-body text-sm text-ink-soft">
              <span>Peças escolhidas ({keptItems.length})</span>
              <span>{formatBRL(keptItems.reduce((a, i) => a + i.unitPriceCents * i.quantity, 0))}</span>
            </div>
          )}
          {returnedItems.length > 0 && (
            <div className="flex justify-between font-body text-xs text-ink-soft/60">
              <span>Devolvidas ({returnedItems.length})</span>
              <span>—</span>
            </div>
          )}
          {order.shippingCents > 0 && (
            <div className="flex justify-between font-body text-sm text-ink-soft">
              <span>Frete</span><span>+ {formatBRL(order.shippingCents)}</span>
            </div>
          )}
          {order.discountCents > 0 && (
            <div className="flex justify-between font-body text-sm text-ink-soft">
              <span>Desconto</span><span>− {formatBRL(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between font-body text-sm font-medium text-ink border-t border-ink/10 pt-2">
            <span>Total a cobrar</span>
            <span className="text-terracotta">{formatBRL(order.total)}</span>
          </div>
        </div>
      </section>

      {/* Pagamentos */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <IconCashBanknote size={14} className="text-ink-soft" />
          <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft">Pagamentos</h2>
        </div>

        {order.payments.length === 0 ? (
          <p className="font-body text-xs text-ink-soft mb-3">Nenhum pagamento registrado.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {order.payments.map((p) => (
              <div key={p.id} className="bg-cream rounded-card px-4 py-3 border border-ink/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm text-ink font-medium">{formatBRL(p.grossCents)}</span>
                      <span className="font-body text-xs text-ink-soft">via {METHOD_LABELS[p.method] ?? p.method}</span>
                      {p.brand && <span className="font-body text-xs text-ink-soft">({p.brand})</span>}
                      {p.installments > 1 && (
                        <span className="font-body text-xs text-ink-soft">{p.installments}×</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {p.feePercent > 0 && (
                        <span className="font-body text-xs text-ink-soft">
                          taxa {p.feePercent}% = {formatBRL(p.feeCents)} · líquido {formatBRL(p.netCents)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-body text-xs text-ink-soft">pago em {formatDate(p.paidAt)}</span>
                      {p.settledAt ? (
                        <span className="inline-flex items-center gap-1 font-body text-[10px] text-sage-deep">
                          <IconCircleCheck size={10} />
                          liquidado em {formatDate(p.settledAt)}
                        </span>
                      ) : (
                        <form action={async () => { "use server"; await markPaymentSettled(p.id, id); }}>
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 font-body text-[10px] text-gold hover:text-ink transition-colors uppercase tracking-widest"
                          >
                            <IconClock size={10} />
                            Marcar como liquidado
                          </button>
                        </form>
                      )}
                    </div>
                    {p.reference && (
                      <p className="font-body text-[10px] text-ink-soft mt-0.5 truncate">{p.reference}</p>
                    )}
                  </div>
                  <form action={async () => { "use server"; await deletePayment(p.id, id); }}>
                    <button type="submit" className="text-red-300 hover:text-red-500 transition-colors shrink-0">
                      <IconTrash size={12} />
                    </button>
                  </form>
                </div>
              </div>
            ))}

            <div className="bg-cream rounded-card px-4 py-2 border border-ink/10 flex justify-between font-body text-sm">
              <span className="text-ink-soft">Total pago</span>
              <span className={totalPaid >= order.total ? "text-sage-deep" : "text-terracotta"}>
                {formatBRL(totalPaid)} / {formatBRL(order.total)}
              </span>
            </div>
            {totalPending > 0 && (
              <p className="font-body text-xs text-gold flex items-center gap-1">
                <IconClock size={10} />
                {formatBRL(totalPending)} ainda não liquidado
              </p>
            )}
          </div>
        )}

        {/* Formulário de novo pagamento */}
        <PaymentFormInline orderId={id} orderTotal={order.total} feeConfigs={feeConfigs} />
      </section>

      {/* Notificações WhatsApp */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <IconBrandWhatsapp size={14} className="text-sage-deep" />
          <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft">WhatsApp</h2>
          <span className="font-body text-[10px] text-ink-soft/60">(enviado automaticamente ao mudar status)</span>
        </div>

        <WaOrderButtons orderId={id} />
      </section>

      {/* Status + ações */}
      <div className="border-t border-ink/10 pt-4 flex items-center gap-3 flex-wrap">
        <form
          action={async (fd: FormData) => {
            "use server";
            const newStatus = fd.get("status") as "draft" | "sent" | "returned" | "paid" | "cancelled";
            await setOrderStatus(id, newStatus);
          }}
          className="flex items-center gap-2"
        >
          <select
            name="status"
            defaultValue={order.status}
            className="border border-ink/20 bg-cream-soft px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink rounded-btn font-body"
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
            await deleteOrder(id);
            redirect("/admin/pedidos");
          }}
          className="ml-auto"
        >
          <Button type="submit" variant="danger" size="sm">Excluir pedido</Button>
        </form>
      </div>
    </div>
  );
}
