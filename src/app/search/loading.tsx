export default function Loading() {
  return <div className="container mx-auto px-4 py-8" aria-label="Memuat pencarian" role="status"><div className="h-8 w-64 animate-pulse rounded bg-muted" /><div className="mt-6 h-10 animate-pulse rounded bg-muted" /><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-lg border bg-muted/50" />)}</div></div>;
}
