import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const links = [
  ["Overview", "/admin"], ["Recruiters", "/admin/recruiters"], ["Organizations", "/admin/organizations"], ["Tokens", "/admin/tokens"], ["Audit log", "/admin/audit-log"],
] as const;

export function AdminPage({ title, description }: { title: string; description: string }) {
  return <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      <div><p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary"><ShieldCheck className="size-4" /> Admin console</p><h1 className="mt-3 text-3xl font-bold">{title}</h1><p className="mt-2 max-w-2xl text-muted-foreground">{description}</p></div>
      <nav aria-label="Admin navigation" className="flex flex-wrap gap-2">{links.map(([label, href]) => <Link key={href} href={href} className="rounded-full border bg-card px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{label}</Link>)}</nav>
    </div>
    <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6" role="status"><p className="font-semibold text-amber-950">Admin database mode required</p><p className="mt-2 text-sm leading-6 text-amber-900">Demo mode tidak menyediakan data admin sintetis. Masuk dengan sesi admin server dan konfigurasi database untuk memuat data serta menjalankan perubahan.</p></div>
  </div>;
}
