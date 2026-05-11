"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordChangeSchema, type PasswordChangeInput } from "@/lib/validations";
import { changePassword } from "@/server/actions/account";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export default function AccountPage() {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
  });

  async function onSubmit(data: PasswordChangeInput) {
    const result = await changePassword(data);
    if (result?.error) {
      setMessage({ type: "error", text: typeof result.error === "string" ? result.error : "Erro ao alterar senha" });
    } else {
      setMessage({ type: "success", text: "Senha alterada com sucesso!" });
      reset();
    }
  }

  return (
    <div>
      <h1 className="font-display font-400 text-3xl text-ink mb-6">Minha conta</h1>

      <div className="max-w-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="currentPassword"
            label="Senha atual"
            type="password"
            {...register("currentPassword")}
            error={errors.currentPassword?.message}
          />
          <Input
            id="newPassword"
            label="Nova senha"
            type="password"
            {...register("newPassword")}
            error={errors.newPassword?.message}
          />
          <Input
            id="confirmPassword"
            label="Confirmar nova senha"
            type="password"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />

          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-sage-deep" : "text-red-600"}`}>
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Alterando..." : "Alterar senha"}
          </Button>
        </form>
      </div>
    </div>
  );
}
