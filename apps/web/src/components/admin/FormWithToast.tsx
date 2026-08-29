"use client";

import { useTransition } from "react";
import { toast } from "sonner";

type ActionResult = { success?: boolean; error?: unknown } | void | undefined;

interface FormWithToastProps {
  action: (data: FormData) => Promise<ActionResult>;
  successMessage?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormWithToast({
  action,
  successMessage = "Salvo com sucesso",
  children,
  className,
}: FormWithToastProps) {
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result && "error" in result && result.error) {
          const msg =
            typeof result.error === "string" ? result.error : "Erro ao salvar";
          toast.error(msg);
        } else {
          toast.success(successMessage);
        }
      } catch {
        toast.error("Erro inesperado. Tente novamente.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
}
