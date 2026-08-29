import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { formatBRL, formatDate, formatPhone } from "@/format";
import type { OrderDetail } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  returned: "Devolvido",
  paid: "Pago",
  cancelled: "Cancelado",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  cash: "Dinheiro",
  transfer: "Transferência",
};

export default function PedidoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api<OrderDetail>(`/api/mobile/orders/${id}`),
  });

  if (isLoading || !order) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  const whatsappUrl = `https://wa.me/${order.customer.phone.replace(/\D/g, "")}`;

  return (
    <ScrollView className="flex-1 bg-cream px-4 pt-4">
      <View className="bg-white rounded-lg border border-ink/10 p-4 mb-4">
        <Text className="font-bold text-lg text-ink">{order.customer.name}</Text>
        <Pressable onPress={() => Linking.openURL(whatsappUrl)}>
          <Text className="text-terracotta mt-1">{formatPhone(order.customer.phone)}</Text>
        </Pressable>
        {order.address && (
          <Text className="text-ink-soft text-sm mt-2">
            {order.address.street}, {order.address.number}
            {order.address.complement ? ` — ${order.address.complement}` : ""}
            {"\n"}
            {order.address.neighborhood}, {order.address.city}/{order.address.state}
          </Text>
        )}
        <View className="flex-row justify-between mt-3 pt-3 border-t border-ink/5">
          <Text className="text-ink-soft">{formatDate(order.soldAt)}</Text>
          <Text className="text-ink font-medium">{STATUS_LABELS[order.status] ?? order.status}</Text>
        </View>
      </View>

      <Text className="text-ink-soft text-xs uppercase mb-2">Itens</Text>
      <View className="bg-white rounded-lg border border-ink/10 mb-4">
        {order.items.map((item, idx) => (
          <View
            key={item.id}
            className={`flex-row justify-between items-center p-4 ${idx > 0 ? "border-t border-ink/5" : ""}`}
          >
            <View className="flex-1 mr-2">
              <Text className="text-ink font-medium">{item.product.name}</Text>
              <Text className="text-ink-soft text-xs">
                {item.product.color} · qtd {item.quantity}
                {item.status === "returned" ? " · devolvido" : ""}
              </Text>
            </View>
            <Text className={item.status === "returned" ? "text-ink-soft line-through" : "text-ink"}>
              {formatBRL(item.unitPriceCents * item.quantity - item.discountCents)}
            </Text>
          </View>
        ))}
      </View>

      <Text className="text-ink-soft text-xs uppercase mb-2">Pagamentos</Text>
      <View className="bg-white rounded-lg border border-ink/10 mb-4">
        {order.payments.length === 0 ? (
          <Text className="text-ink-soft p-4">Nenhum pagamento registrado.</Text>
        ) : (
          order.payments.map((p, idx) => (
            <View
              key={p.id}
              className={`flex-row justify-between items-center p-4 ${idx > 0 ? "border-t border-ink/5" : ""}`}
            >
              <View>
                <Text className="text-ink">{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</Text>
                <Text className="text-ink-soft text-xs">
                  {formatDate(p.paidAt)} · {p.settledAt ? "liquidado" : "a liquidar"}
                </Text>
              </View>
              <Text className="text-ink font-medium">{formatBRL(p.netCents)}</Text>
            </View>
          ))
        )}
      </View>

      <View className="bg-white rounded-lg border border-ink/10 p-4 mb-8 flex-row justify-between">
        <Text className="font-semibold text-ink text-lg">Total</Text>
        <Text className="font-semibold text-terracotta text-lg">{formatBRL(order.total)}</Text>
      </View>
    </ScrollView>
  );
}
