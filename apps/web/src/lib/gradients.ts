const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg,#6A7256,#4F5841)", // sage
  "linear-gradient(135deg,#B8634A,#8B4A32)", // terracotta
  "linear-gradient(135deg,#C9A063,#9C7943)", // gold
  "linear-gradient(135deg,#8A9476,#4F5841)", // sage claro
  "linear-gradient(135deg,#D88068,#B8634A)", // terracotta claro
  "linear-gradient(135deg,#5C564E,#2A2722)", // ink
];

// Sempre o mesmo gradiente para o mesmo produto (não re-sorteia a cada render)
export function pickFallbackGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return FALLBACK_GRADIENTS[Math.abs(hash) % FALLBACK_GRADIENTS.length];
}
