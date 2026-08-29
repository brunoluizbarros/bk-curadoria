import "../global.css";
import { useEffect, useState, useCallback } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext, getToken, saveTokenToStore, clearToken } from "@/auth";

const queryClient = new QueryClient();

export default function RootLayout() {
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    getToken().then(setToken);
  }, []);

  const login = useCallback(async (newToken: string) => {
    await saveTokenToStore(newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setToken(null);
  }, []);

  if (token === undefined) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ token, login, logout }}>
        <Stack>
          <Stack.Protected guard={!!token}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="pedido/[id]" options={{ title: "Pedido" }} />
          </Stack.Protected>
          <Stack.Protected guard={!token}>
            <Stack.Screen name="login" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
