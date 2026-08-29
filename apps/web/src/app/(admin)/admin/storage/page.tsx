import { StorageExplorer } from "@/components/admin/StorageExplorer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Arquivos · BK Admin" } };

export default function StoragePage() {
  return (
    <div>
      <h1 className="font-display font-400 text-3xl text-ink mb-1">Arquivos</h1>
      <p className="text-xs text-ink-soft font-body mb-6">Gerencie os arquivos do bucket de storage.</p>
      <StorageExplorer />
    </div>
  );
}
