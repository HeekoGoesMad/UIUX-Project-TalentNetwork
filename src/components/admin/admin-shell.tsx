"use client";

import Link from "next/link";
import { ReactNode } from "react";

const links = [["Overview", "/admin"], ["Recruiters", "/admin/recruiters"], ["Organizations", "/admin/organizations"], ["Tokens", "/admin/tokens"], ["Verifications", "/admin/verifications"], ["Audit log", "/admin/audit-log"]];
export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="container mx-auto grid gap-8 px-4 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-2xl border bg-card p-4 lg:sticky lg:top-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Control plane</p>
        <h2 className="mt-2 text-xl font-bold">Admin</h2>
        <nav className="mt-5 grid gap-1" aria-label="Admin navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Operations</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
}
