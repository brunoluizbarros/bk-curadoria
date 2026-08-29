import { router } from "expo-router";
import { getToken, clearToken } from "./auth";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE_URL) throw new Error("EXPO_PUBLIC_API_URL não configurada");

  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    await clearToken();
    router.replace("/login");
    throw new ApiError("Sessão expirada", 401);
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(body?.error ?? "Erro na requisição", res.status);
  }

  return body as T;
}
