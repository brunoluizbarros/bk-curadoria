import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/api";
import { formatBRL } from "@/format";
import type { DREMonth } from "@/types";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-ink/5">
      <Text className={strong ? "font-semibold text-ink" : "text-ink-soft"}>{label}</Text>
      <Text className={strong ? "font-semibold text-ink" : "text-ink"}>{value}</Text>
    </View>
  );
}

export default function DREScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["dre", year, month],
    queryFn: () => api<DREMonth>(`/api/mobile/dre?ano=${year}&mes=${month}`),
  });

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <View className="px-4 pt-2 pb-3">
        <Text className="font-bold text-2xl text-ink mb-3">DRE</Text>
        <View className="flex-row items-center justify-between bg-white rounded-lg border border-ink/10 px-2 py-2">
          <Pressable onPress={() => shiftMonth(-1)} className="px-3 py-1">
            <Text className="text-terracotta text-lg">‹</Text>
          </Pressable>
          <Text className="text-ink font-medium">{MONTH_NAMES[month - 1]} {year}</Text>
          <Pressable onPress={() => shiftMonth(1)} className="px-3 py-1">
            <Text className="text-terracotta text-lg">›</Text>
          </Pressable>
        </View>
      </View>

      {isLoading || !data ? (
        <ActivityIndicator className="mt-8" />
      ) : (
        <ScrollView
          className="px-4"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
        >
          <View className="bg-white rounded-lg border border-ink/10 p-4 mb-4">
            <Text className="text-ink-soft text-xs uppercase mb-2">Receita líquida</Text>
            <Text className="text-2xl font-bold text-sage-deep mb-2">
              {formatBRL(data.revenue.totalNetCents)}
            </Text>
            {Object.entries(data.revenue.byMethod).map(([method, cents]) => (
              <Row key={method} label={method} value={formatBRL(cents)} />
            ))}
          </View>

          <View className="bg-white rounded-lg border border-ink/10 p-4 mb-4">
            <Text className="text-ink-soft text-xs uppercase mb-2">Despesas</Text>
            <Text className="text-2xl font-bold text-terracotta mb-2">
              {formatBRL(data.expenses.totalCents)}
            </Text>
            {data.expenses.byCategory.map((c) => (
              <Row key={c.name} label={c.name} value={formatBRL(c.totalCents)} />
            ))}
          </View>

          <View className="bg-white rounded-lg border border-ink/10 p-4 mb-4">
            <Row label="Resultado" value={formatBRL(data.resultCents)} strong />
            <Row label="A receber" value={formatBRL(data.pendingSettlementCents)} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
