"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-5">
      <div className="text-center">
        <p className="font-display italic text-6xl text-terracotta/30 mb-4">!</p>
        <h1 className="font-display font-300 text-2xl text-ink mb-2">Algo deu errado</h1>
        <p className="font-body text-sm text-ink-soft mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="font-body text-xs tracking-widest uppercase text-terracotta hover:text-terracotta-soft transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
