import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api";
import { useAuth } from "@/auth";
import type { User } from "@/types";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ token: string; user: User }>("/api/mobile/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await login(res.token);
    } catch {
      setError("Email ou senha inválidos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-1 justify-center px-6">
        <Text className="font-bold text-3xl text-ink mb-1">BK Curadoria</Text>
        <Text className="text-ink-soft mb-8">Painel admin</Text>

        <TextInput
          className="bg-white rounded-lg px-4 py-3 mb-3 border border-ink/10 text-ink"
          placeholder="Email"
          placeholderTextColor="#5C564E"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          className="bg-white rounded-lg px-4 py-3 mb-4 border border-ink/10 text-ink"
          placeholder="Senha"
          placeholderTextColor="#5C564E"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text className="text-red-600 mb-4">{error}</Text>}

        <Pressable
          className="bg-terracotta rounded-lg py-3 items-center"
          onPress={handleSubmit}
          disabled={loading || !email || !password}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold">Entrar</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
