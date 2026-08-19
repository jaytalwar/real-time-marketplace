export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="skeleton aspect-square w-full rounded-lg" />
      <div className="skeleton mt-3 h-4 w-3/4 rounded" />
      <div className="skeleton mt-2 h-4 w-1/2 rounded" />
      <div className="skeleton mt-3 h-5 w-1/3 rounded" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 10 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function Line({ className = "" }) {
  return <div className={`skeleton rounded ${className}`} />;
}
