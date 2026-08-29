export default function SiteLoading() {
  return (
    <div className="min-h-screen bg-cream animate-pulse">
      {/* Hero skeleton */}
      <div className="h-52 md:h-72 bg-sage/20" />
      {/* Content skeleton */}
      <div className="px-5 py-8 max-w-screen-xl mx-auto space-y-4">
        <div className="h-3 w-24 bg-ink/10 rounded" />
        <div className="h-5 w-64 bg-ink/10 rounded" />
        <div className="h-4 w-full bg-ink/10 rounded" />
        <div className="h-4 w-5/6 bg-ink/10 rounded" />
      </div>
    </div>
  );
}
