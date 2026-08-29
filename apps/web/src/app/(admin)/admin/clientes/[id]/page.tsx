import { getCustomerById } from "@/server/queries/customers";
import { deleteCustomer } from "@/server/actions/customers";
import { deleteAddress, setDefaultAddress } from "@/server/actions/addresses";
import { getCustomerCreditBalance, getCustomerCreditHistory } from "@/server/queries/loyalty";
import { formatPhone, formatDate, formatCEP, formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { IconUsers, IconMapPin, IconReceipt, IconPlus } from "@/components/ui/icons";
import { LoyaltyAdjustForm } from "@/components/admin/LoyaltyAdjustForm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Cliente · BK Admin" } };

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Rascunho", cls: "bg-ink/10 text-ink-soft" },
  sent: { label: "Enviado", cls: "bg-gold/20 text-gold" },
  returned: { label: "Devolvido", cls: "bg-terracotta/20 text-terracotta" },
  paid: { label: "Pago", cls: "bg-sage/20 text-sage-deep" },
  cancelled: { label: "Cancelado", cls: "bg-red-100 text-red-600" },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClienteDetailPage({ params }: Props) {
  const { id } = await params;
  const [customer, creditBalance, creditHistory] = await Promise.all([
    getCustomerById(id),
    getCustomerCreditBalance(id),
    getCustomerCreditHistory(id),
  ]);
  if (!customer) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/clientes" className="text-ink-soft hover:text-ink transition-colors font-body text-xs uppercase tracking-widest flex items-center gap-1">
          <IconUsers size={14} />
          Clientes
        </Link>
        <span className="text-ink-soft">/</span>
        <h1 className="font-display font-400 text-3xl text-ink">{customer.name}</h1>
      </div>

      {/* Dados do cliente */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft">Dados</h2>
          <div className="flex gap-3">
            <Link
              href={`/admin/clientes/${id}/editar`}
              className="font-body text-xs text-ink-soft hover:text-ink transition-colors"
            >
              Editar
            </Link>
            <form
              action={async () => {
                "use server";
                const result = await deleteCustomer(id);
                if ("success" in result) redirect("/admin/clientes");
              }}
            >
              <button
                type="submit"
                className="font-body text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Excluir
              </button>
            </form>
          </div>
        </div>

        <div className="bg-cream rounded-card px-4 py-3 border border-ink/10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-body text-xs text-ink-soft w-24">Telefone</span>
            <span className="font-body text-sm text-ink">{formatPhone(customer.phone)}</span>
          </div>
          {customer.email && (
            <div className="flex items-center gap-2">
              <span className="font-body text-xs text-ink-soft w-24">Email</span>
              <span className="font-body text-sm text-ink">{customer.email}</span>
            </div>
          )}
          {customer.document && (
            <div className="flex items-center gap-2">
              <span className="font-body text-xs text-ink-soft w-24">Documento</span>
              <span className="font-body text-sm text-ink">{customer.document}</span>
            </div>
          )}
          {customer.notes && (
            <div className="flex items-start gap-2">
              <span className="font-body text-xs text-ink-soft w-24 mt-0.5">Obs.</span>
              <span className="font-body text-sm text-ink">{customer.notes}</span>
            </div>
          )}
        </div>
      </section>

      {/* Endereços */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft flex items-center gap-1.5">
            <IconMapPin size={12} />
            Endereços
          </h2>
          <Link
            href={`/admin/clientes/${id}/endereco/novo`}
            className="inline-flex items-center gap-1 font-body text-xs text-ink-soft hover:text-ink transition-colors"
          >
            <IconPlus size={12} />
            Adicionar
          </Link>
        </div>

        {customer.addresses.length === 0 ? (
          <p className="font-body text-xs text-ink-soft">Nenhum endereço cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {customer.addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-cream rounded-card px-4 py-3 border border-ink/10 flex items-start justify-between gap-4"
              >
                <div>
                  {addr.label && (
                    <p className="font-body text-xs uppercase tracking-widest text-ink-soft mb-0.5">
                      {addr.label}
                      {addr.isDefault && (
                        <span className="ml-2 bg-sage/20 text-sage-deep px-1.5 rounded text-[9px]">padrão</span>
                      )}
                    </p>
                  )}
                  <p className="font-body text-sm text-ink">
                    {addr.street}, {addr.number}
                    {addr.complement ? `, ${addr.complement}` : ""}
                  </p>
                  <p className="font-body text-xs text-ink-soft">
                    {addr.neighborhood} · {addr.city}/{addr.state} · {formatCEP(addr.cep)}
                  </p>
                </div>
                <div className="flex gap-3 shrink-0 items-center">
                  <Link
                    href={`/admin/clientes/${id}/endereco/${addr.id}/editar`}
                    className="font-body text-[10px] text-ink-soft hover:text-ink transition-colors uppercase tracking-widest"
                  >
                    Editar
                  </Link>
                  {!addr.isDefault && (
                    <form action={async () => { "use server"; await setDefaultAddress(addr.id, id); }}>
                      <button type="submit" className="font-body text-[10px] text-ink-soft hover:text-ink transition-colors uppercase tracking-widest">
                        Padrão
                      </button>
                    </form>
                  )}
                  <form action={async () => { "use server"; await deleteAddress(addr.id, id); }}>
                    <button type="submit" className="font-body text-[10px] text-red-400 hover:text-red-600 transition-colors">
                      Excluir
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Crédito de Fidelidade */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft">
            Crédito de Fidelidade
          </h2>
          <span className={`font-body text-sm font-medium ${creditBalance > 0 ? "text-sage-deep" : "text-ink-soft"}`}>
            {formatBRL(creditBalance)} disponível
          </span>
        </div>

        {creditHistory.length > 0 ? (
          <div className="bg-cream rounded-card border border-ink/10 overflow-hidden mb-3">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink/10">
                  <th className="font-body text-[10px] uppercase tracking-widest text-ink-soft px-4 py-2">Data</th>
                  <th className="font-body text-[10px] uppercase tracking-widest text-ink-soft px-4 py-2">Tipo</th>
                  <th className="font-body text-[10px] uppercase tracking-widest text-ink-soft px-4 py-2 text-right">Valor</th>
                  <th className="font-body text-[10px] uppercase tracking-widest text-ink-soft px-4 py-2">Validade</th>
                </tr>
              </thead>
              <tbody>
                {creditHistory.map((row) => (
                  <tr key={row.id} className="border-b border-ink/5 last:border-0">
                    <td className="font-body text-xs text-ink-soft px-4 py-2">{formatDate(row.createdAt)}</td>
                    <td className="font-body text-xs px-4 py-2">
                      {row.kind === "earn" && (
                        <span className={row.isExpired ? "text-ink-soft/50 line-through" : "text-sage-deep"}>
                          {row.isExpired ? "Expirado" : "Ganho"}
                        </span>
                      )}
                      {row.kind === "redeem" && <span className="text-terracotta">Usado</span>}
                      {row.kind === "adjust" && <span className="text-gold">Ajuste</span>}
                    </td>
                    <td className={`font-body text-xs px-4 py-2 text-right font-medium ${row.amountCents > 0 ? "text-sage-deep" : "text-terracotta"}`}>
                      {row.amountCents > 0 ? "+" : ""}{formatBRL(row.amountCents)}
                    </td>
                    <td className="font-body text-xs text-ink-soft px-4 py-2">
                      {row.expiresAt ? formatDate(row.expiresAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="font-body text-xs text-ink-soft mb-3">Nenhuma transação de crédito.</p>
        )}

        <LoyaltyAdjustForm customerId={id} />
      </section>

      {/* Pedidos recentes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft flex items-center gap-1.5">
            <IconReceipt size={12} />
            Pedidos recentes
          </h2>
          <Link
            href={`/admin/pedidos/novo?customerId=${id}`}
            className="inline-flex items-center gap-1 font-body text-xs text-ink-soft hover:text-ink transition-colors"
          >
            <IconPlus size={12} />
            Novo pedido
          </Link>
        </div>

        {customer.recentOrders.length === 0 ? (
          <p className="font-body text-xs text-ink-soft">Nenhum pedido.</p>
        ) : (
          <div className="space-y-2">
            {customer.recentOrders.map((order) => {
              const s = STATUS_LABELS[order.status] ?? STATUS_LABELS.draft;
              return (
                <Link
                  key={order.id}
                  href={`/admin/pedidos/${order.id}`}
                  className="flex items-center justify-between bg-cream rounded-card px-4 py-3 border border-ink/10 hover:border-ink/30 transition-colors"
                >
                  <span className="font-body text-sm text-ink">
                    Pedido de {formatDate(order.soldAt)}
                  </span>
                  <span className={`font-body text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm ${s.cls}`}>
                    {s.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
