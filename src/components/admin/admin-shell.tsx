"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";

const links = [["Overview", "/admin"], ["Recruiters", "/admin/recruiters"], ["Organizations", "/admin/organizations"], ["Tokens", "/admin/tokens"], ["Verifications", "/admin/verifications"], ["Audit log", "/admin/audit-log"]];
export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  useEffect(() => { fetch("/api/admin/audit-log", { cache: "no-store" }).then((response) => setState(response.ok ? "ok" : "error")).catch(() => setState("error")); }, []);
  return <div className="container mx-auto grid gap-8 px-4 py-8 lg:grid-cols-[220px_1fr]">
    <aside className="h-fit rounded-2xl border bg-card p-4 lg:sticky lg:top-6"><p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Control plane</p><h2 className="mt-2 text-xl font-bold">Admin</h2><nav className="mt-5 grid gap-1" aria-label="Admin navigation">{links.map(([label, href]) => <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{label}</Link>)}</nav></aside>
    <main className="min-w-0"><div className="mb-6"><p className="text-sm text-muted-foreground">Operations</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1></div>{state === "loading" ? <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground" role="status">Memuat akses admin...</div> : state === "error" ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950" role="alert">Admin API tidak tersedia. Mode demo tidak menampilkan data palsu.</div> : children}</main>
  </div>;
}
