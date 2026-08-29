import * as SecureStore from "expo-secure-store";
import { createContext, useContext } from "react";

const TOKEN_KEY = "bk_admin_token";

// cache em memória — SecureStore é assíncrono e relativamente lento, evita um
// await no Keychain/Keystore a cada request autenticado
let cachedToken: string | null | undefined;

export async function getToken(): Promise<string | null> {
  if (cachedToken !== undefined) return cachedToken;
  const stored = await SecureStore.getItemAsync(TOKEN_KEY);
  cachedToken = stored;
  return stored;
}

export async function saveTokenToStore(token: string): Promise<void> {
  cachedToken = token;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  cachedToken = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export interface AuthContextValue {
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthContext.Provider");
  return ctx;
}
