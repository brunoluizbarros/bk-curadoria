"use client";

import { useState, useRef } from "react";
import { addProductImage, removeProductImage } from "@/server/actions/products";
import { ProductImage } from "@/db/schema";
import { IconPlus, IconTrash, IconLoader2 } from "@/components/ui/icons";

interface ProductImagesUploaderProps {
  productId: string;
  images: ProductImage[];
}

export function ProductImagesUploader({ productId, images: initialImages }: ProductImagesUploaderProps) {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      try {
        // 1. Get presigned URL
        const presignRes = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: file.type, size: file.size }),
        });

        if (!presignRes.ok) {
          const { error } = await presignRes.json();
          throw new Error(error ?? "Erro ao gerar URL de upload");
        }

        const { uploadUrl, key } = await presignRes.json();

        // 2. Upload direto para R2
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadRes.ok) throw new Error("Falha no upload");

        // 3. Salvar no banco
        await addProductImage({
          productId,
          storageKey: key,
          alt: file.name.replace(/\.[^.]+$/, ""),
        });

        // Refresh lista local (simplificado — recarregar seria o ideal)
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro no upload");
      }
    }

    setUploading(false);
  }

  async function handleRemove(imageId: string) {
    if (!confirm("Remover esta imagem?")) return;
    await removeProductImage(imageId);
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {images.map((img) => (
          <div key={img.id} className="relative w-20 h-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt ?? ""}
              className="w-full h-full object-cover rounded"
            />
            <button
              onClick={() => handleRemove(img.id)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700"
              aria-label="Remover imagem"
            >
              <IconTrash size={10} />
            </button>
          </div>
        ))}

        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-20 h-24 border-2 border-dashed border-ink/30 rounded flex flex-col items-center justify-center gap-1 hover:border-ink transition-colors text-ink-soft hover:text-ink"
        >
          {uploading ? (
            <IconLoader2 size={16} className="animate-spin" />
          ) : (
            <>
              <IconPlus size={16} />
              <span className="text-[9px] uppercase tracking-wider">Adicionar</span>
            </>
          )}
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
