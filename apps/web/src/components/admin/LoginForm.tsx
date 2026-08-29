"use client";

import { useActionState } from "react";
import { signInAction } from "@/server/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="admin@exemplo.com"
        autoComplete="email"
        required
      />
      <Input
        id="password"
        name="password"
        type="password"
        label="Senha"
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />

      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
