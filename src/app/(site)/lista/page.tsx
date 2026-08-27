import { buildMetadata } from "@/lib/seo";
import { ListaClient } from "./ListaClient";
import type { Metadata } from "next";

// ponytail: noindex — conteúdo vem 100% do localStorage do visitante, sem valor único para busca
export const metadata: Metadata = buildMetadata({
  title: "Minha lista de desejos",
  description: "Monte sua lista de desejos na BK Curadoria e compartilhe com quem você ama.",
  path: "/lista",
  noindex: true,
});

export default function ListaPage() {
  return <ListaClient />;
}
