"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  listS3Objects,
  deleteS3Object,
  deleteFolder,
  createFolder,
  uploadFileToStorage,
  type S3Object,
} from "@/server/actions/storage";
import {
  IconHome,
  IconChevronRight,
  IconFolder,
  IconFolderPlus,
  IconUpload,
  IconRefresh,
  IconTrash,
  IconCopy,
  IconCheck,
  IconPhoto,
  IconFile,
  IconFileText,
  IconDotsVertical,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function FileTypeIcon({ name, className }: { name: string; className?: string }) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext ?? ""))
    return <IconPhoto className={className} />;
  if (["pdf", "doc", "docx", "txt"].includes(ext ?? ""))
    return <IconFileText className={className} />;
  return <IconFile className={className} />;
}

const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif"];

function isImage(name: string) {
  return IMAGE_EXTS.includes(name.split(".").pop()?.toLowerCase() ?? "");
}

interface MenuProps {
  onCopy?: () => void;
  onDelete: () => void;
}

function ActionMenu({ onCopy, onDelete }: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-7 h-7 rounded-full bg-ink/60 hover:bg-ink flex items-center justify-center text-cream transition-colors"
      >
        <IconDotsVertical size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 bg-cream border border-ink/10 rounded shadow-lg min-w-[140px] py-1">
          {onCopy && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCopy(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-body text-ink hover:bg-cream-deep transition-colors"
            >
              <IconCopy size={13} /> Copiar URL
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-body text-terracotta hover:bg-terracotta/10 transition-colors"
          >
            <IconTrash size={13} /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}

export function StorageExplorer() {
  const [currentPath, setCurrentPath] = useState("");
  const [data, setData] = useState<{ files: S3Object[]; folders: S3Object[] }>({ files: [], folders: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  const load = useCallback(async (prefix: string) => {
    setLoading(true);
    try {
      const result = await listS3Objects(prefix);
      setData(result);
    } catch {
      showToast("Erro ao carregar arquivos", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(currentPath); }, [currentPath, load]);

  function getBreadcrumbs() {
    const parts = currentPath.split("/").filter(Boolean);
    let acc = "";
    return parts.map((part) => { acc += `${part}/`; return { name: part, path: acc }; });
  }

  function navigateUp() {
    if (!currentPath) return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length > 0 ? parts.join("/") + "/" : "");
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
    showToast("URL copiada!");
  }

  async function handleDelete(item: S3Object) {
    if (!confirm(`Excluir "${item.name}"?`)) return;
    if (!confirm("Tem certeza? Essa ação não pode ser desfeita.")) return;
    const result = item.type === "folder"
      ? await deleteFolder(item.key)
      : await deleteS3Object(item.key);
    if (!result.success) { showToast("Erro ao excluir", false); return; }
    showToast("Excluído com sucesso");
    setData((prev) => ({
      files: prev.files.filter((f) => f.key !== item.key),
      folders: prev.folders.filter((f) => f.key !== item.key),
    }));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("path", currentPath);
    showToast("Enviando...");
    const result = await uploadFileToStorage(fd);
    e.target.value = "";
    if (!result.success) { showToast("Erro no upload", false); return; }
    showToast("Arquivo enviado!");
    load(currentPath);
  }

  async function handleNewFolder() {
    const name = prompt("Nome da pasta:");
    if (!name) return;
    const clean = name.replace(/[^a-zA-Z0-9-_]/g, "-");
    const full = currentPath ? `${currentPath}${clean}` : clean;
    await createFolder(full);
    showToast("Pasta criada");
    load(currentPath);
  }

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="space-y-4 relative">
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 px-4 py-2 rounded text-sm font-body text-cream shadow-lg transition-all",
          toast.ok ? "bg-sage-deep" : "bg-terracotta"
        )}>
          {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm font-body text-ink-soft flex-wrap">
          <button
            type="button"
            onClick={() => setCurrentPath("")}
            className={cn("p-1 rounded hover:bg-ink/10 transition-colors", !currentPath && "text-ink")}
            aria-label="Raiz"
          >
            <IconHome size={16} />
          </button>
          {breadcrumbs.map((crumb) => (
            <div key={crumb.path} className="flex items-center gap-1">
              <IconChevronRight size={14} className="text-ink/30" />
              <button
                type="button"
                onClick={() => setCurrentPath(crumb.path)}
                className="hover:text-ink transition-colors px-1"
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-ink/20 rounded text-xs font-body text-ink hover:bg-ink/5 transition-colors"
          >
            <IconUpload size={14} /> Upload
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />

          <button
            type="button"
            onClick={handleNewFolder}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-ink/20 rounded text-xs font-body text-ink hover:bg-ink/5 transition-colors"
          >
            <IconFolderPlus size={14} /> Nova pasta
          </button>

          <button
            type="button"
            onClick={() => load(currentPath)}
            className="p-1.5 border border-ink/20 rounded text-ink hover:bg-ink/5 transition-colors"
            aria-label="Recarregar"
          >
            <IconRefresh size={14} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Voltar */}
        {currentPath && (
          <button
            type="button"
            onClick={navigateUp}
            className="flex flex-col items-center justify-center gap-2 p-4 border border-dashed border-ink/20 rounded hover:border-ink/40 hover:bg-ink/5 transition-colors aspect-square"
          >
            <IconFolder size={32} className="text-ink/30" />
            <span className="text-[10px] font-body text-ink-soft">.. voltar</span>
          </button>
        )}

        {/* Pastas */}
        {!loading && data.folders.map((folder) => (
          <div
            key={folder.key}
            className="group relative border border-ink/10 rounded overflow-hidden hover:border-ink/30 transition-colors cursor-pointer"
            onClick={() => setCurrentPath(folder.key)}
          >
            <div className="aspect-square flex flex-col items-center justify-center gap-2 p-4 bg-cream-soft">
              <IconFolder size={36} className="text-gold" />
              <span className="text-[10px] font-body text-ink-soft text-center truncate w-full">{folder.name}</span>
            </div>
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ActionMenu onDelete={() => handleDelete(folder)} />
            </div>
          </div>
        ))}

        {/* Arquivos */}
        {!loading && data.files.map((file) => (
          <div
            key={file.key}
            className="group relative border border-ink/10 rounded overflow-hidden hover:border-ink/30 transition-colors"
          >
            <div className="aspect-square relative bg-cream-soft flex items-center justify-center overflow-hidden">
              {isImage(file.name) && file.url ? (
                <Image
                  src={file.url}
                  alt={file.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <FileTypeIcon name={file.name} className="w-10 h-10 text-ink/40" />
              )}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ActionMenu
                  onCopy={file.url ? () => copyUrl(file.url!) : undefined}
                  onDelete={() => handleDelete(file)}
                />
              </div>
              {copied === file.url && (
                <div className="absolute bottom-1 left-1 bg-sage-deep text-cream text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
                  <IconCheck size={10} /> Copiado
                </div>
              )}
            </div>
            <div className="px-2 py-1.5 bg-cream">
              <p className="text-[10px] font-body text-ink truncate" title={file.name}>{file.name}</p>
              <p className="text-[9px] font-body text-ink-soft">{file.size ? formatBytes(file.size) : "—"}</p>
            </div>
          </div>
        ))}

        {/* Skeleton loading */}
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border border-ink/10 rounded overflow-hidden">
            <div className="aspect-square bg-cream-deep animate-pulse" />
            <div className="px-2 py-1.5 space-y-1">
              <div className="h-2 w-3/4 bg-cream-deep rounded animate-pulse" />
              <div className="h-2 w-1/2 bg-cream-deep rounded animate-pulse" />
            </div>
          </div>
        ))}

        {/* Vazio */}
        {!loading && data.files.length === 0 && data.folders.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <IconFolder size={40} className="text-ink/20 mx-auto mb-3" />
            <p className="text-sm font-body text-ink-soft">Pasta vazia</p>
          </div>
        )}
      </div>
    </div>
  );
}
