import { useState } from "react";
import { View, Text, FlatList, TextInput, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { api } from "@/api";
import { useAuth } from "@/auth";
import { formatBRL, formatDate } from "@/format";
import type { OrdersResponse, OrderListItem, OrderStatus } from "@/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  returned: "Devolvido",
  paid: "Pago",
  cancelled: "Cancelado",
};

const STATUS_FILTERS: { value: OrderStatus | undefined; label: string }[] = [
  { value: undefined, label: "Todos" },
  { value: "draft", label: "Rascunho" },
  { value: "sent", label: "Enviado" },
  { value: "paid", label: "Pago" },
  { value: "returned", label: "Devolvido" },
  { value: "cancelled", label: "Cancelado" },
];

export default function PedidosScreen() {
  const { logout } = useAuth();
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const [search, setSearch] = useState("");

  const { data, isLoading, isRefetching, refetch, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["orders", status, search],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam) });
      if (status) params.set("status", status);
      if (search) params.set("q", search);
      return api<OrdersResponse>(`/api/mobile/orders?${params.toString()}`);
    },
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.limit;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });

  const orders = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
        <Text className="font-bold text-2xl text-ink">Pedidos</Text>
        <Pressable onPress={logout}>
          <Text className="text-terracotta">Sair</Text>
        </Pressable>
      </View>

      <TextInput
        className="mx-4 mb-3 bg-white rounded-lg px-4 py-2 border border-ink/10 text-ink"
        placeholder="Buscar por cliente…"
        placeholderTextColor="#5C564E"
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={STATUS_FILTERS}
        keyExtractor={(f) => f.label}
        contentContainerClassName="px-4 gap-2 mb-2"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setStatus(item.value)}
            className={`px-3 py-1.5 rounded-full border ${
              status === item.value ? "bg-terracotta border-terracotta" : "bg-white border-ink/10"
            }`}
          >
            <Text className={status === item.value ? "text-white" : "text-ink"}>{item.label}</Text>
          </Pressable>
        )}
      />

      {isLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          contentContainerClassName="px-4 pb-6"
          ListEmptyComponent={<Text className="text-ink-soft text-center mt-8">Nenhum pedido encontrado.</Text>}
          renderItem={({ item }: { item: OrderListItem }) => (
            <Pressable
              onPress={() => router.push(`/pedido/${item.id}`)}
              className="bg-white rounded-lg p-4 mb-2 border border-ink/10"
            >
              <View className="flex-row justify-between items-start">
                <Text className="font-semibold text-ink flex-1 mr-2">{item.customer.name}</Text>
                <Text className="text-terracotta font-semibold">{formatBRL(item.total)}</Text>
              </View>
              <View className="flex-row justify-between items-center mt-1">
                <Text className="text-ink-soft text-xs">{formatDate(item.soldAt)}</Text>
                <Text className="text-ink-soft text-xs">{STATUS_LABELS[item.status]}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
