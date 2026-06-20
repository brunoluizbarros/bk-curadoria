import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  baseHref: string;
  params?: Record<string, string>;
}

function buildHref(baseHref: string, params: Record<string, string>, page: number) {
  const sp = new URLSearchParams(params);
  if (page > 1) sp.set("page", String(page));
  else sp.delete("page");
  const qs = sp.toString();
  return qs ? `${baseHref}?${qs}` : baseHref;
}

export function Pagination({ page, totalPages, baseHref, params = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  const { page: _removed, ...rest } = params;
  const prevHref = page > 1 ? buildHref(baseHref, rest, page - 1) : null;
  const nextHref = page < totalPages ? buildHref(baseHref, rest, page + 1) : null;

  const btnBase =
    "font-body text-xs uppercase tracking-widest px-3 py-1.5 rounded-btn border transition-colors";

  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      {prevHref ? (
        <Link href={prevHref} className={`${btnBase} border-ink/20 text-ink-soft hover:border-ink hover:text-ink`}>
          ← Anterior
        </Link>
      ) : (
        <span className={`${btnBase} border-ink/10 text-ink/30 cursor-not-allowed`}>← Anterior</span>
      )}

      <span className="font-body text-xs text-ink-soft">
        {page} / {totalPages}
      </span>

      {nextHref ? (
        <Link href={nextHref} className={`${btnBase} border-ink/20 text-ink-soft hover:border-ink hover:text-ink`}>
          Próxima →
        </Link>
      ) : (
        <span className={`${btnBase} border-ink/10 text-ink/30 cursor-not-allowed`}>Próxima →</span>
      )}
    </div>
  );
}
