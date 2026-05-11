import { LoginForm } from "@/components/admin/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Login · BK Admin" },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display text-4xl text-cream">BK</p>
          <p className="font-body text-[10px] tracking-widest uppercase text-gold mt-1">
            painel administrativo
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
