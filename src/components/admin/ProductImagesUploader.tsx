"use client";

import { useState, useRef } from "react";
import { addProductImage, removeProductImage } from "@/server/actions/products";
import { ProductImage } from "@/db/schema";
import { IconPlus, IconTrash, IconLoader2 } from "@/components/ui/icons";

interface ProductImagesUploaderProps {
  productId: string;
  images: ProductImage[];
}

/** Redimensiona e converte para WebP antes do upload. Máx 1800px, qualidade 0.82. */
async function compressImage(file: File): Promise<{ blob: Blob; type: string }> {
  const MAX_PX = 1800;
  const QUALITY = 0.82;

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas não disponível")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Falha na compressão")); return; }
          resolve({ blob, type: "image/webp" });
        },
        "image/webp",
        QUALITY
      );
    };
    img.onerror = () => reject(new Error("Imagem inválida"));
    img.src = url;
  });
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
        // 1. Comprimir e converter para WebP
        const { blob, type } = await compressImage(file);
        const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
        console.log(`[upload] ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${sizeMB}MB WebP`);

        // 2. Obter URL pré-assinada
        const presignRes = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: type, size: blob.size }),
        });

        if (!presignRes.ok) {
          const data = await presignRes.json();
          throw new Error(data.error ?? "Erro ao gerar URL de upload");
        }

        const { uploadUrl, key } = await presignRes.json();

        // 3. Upload direto para o storage
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: blob,
          headers: { "Content-Type": type },
        });

        if (!uploadRes.ok) throw new Error("Falha no upload");

        // 4. Salvar no banco (confirma no servidor que o arquivo existe no storage)
        // ponytail: sem alt aqui — deixa null para o front-end cair no fallback (nome do produto) em vez do nome do arquivo
        const result = await addProductImage({
          productId,
          storageKey: key,
        });
        if (result && "error" in result) throw new Error(result.error);

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
            <img src={img.url} alt={img.alt ?? ""} className="w-full h-full object-cover rounded" />
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
        accept="image/jpeg,image/jpg,image/png,image/webp,image/avif,image/heic"
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
