"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import {
  ArrowLeft,
  Building2,
  Coins,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NavLinkItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const adminNavLinks: NavLinkItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Recruiters", href: "/admin/recruiters", icon: Building2 },
  { label: "Organizations", href: "/admin/organizations", icon: Users },
  { label: "Tokens", href: "/admin/tokens", icon: Coins },
  { label: "Verifications", href: "/admin/verifications", icon: ShieldCheck },
  { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText },
];

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50/60 antialiased">
      {/* ─── Admin Top Bar ─── */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-white px-4 sm:px-8 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2.5 font-bold text-slate-900 transition-opacity hover:opacity-85">
            <div className="flex size-8 items-center justify-center rounded-xl bg-[#7C3AED] text-white shadow-xs">
              <ShieldCheck className="size-4.5" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-foreground">ProofyLink</span>
          </Link>
          <span className="text-slate-300">/</span>
          <Badge className="bg-purple-50 text-[#7C3AED] border-purple-200 text-xs font-semibold px-2.5 py-0.5">
            Admin Panel
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl">
              <ArrowLeft className="size-3.5" />
              Kembali ke Web
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2 text-xs">
            <div className="flex size-7 items-center justify-center rounded-full bg-purple-100 font-bold text-[#7C3AED]">
              A
            </div>
            <div className="hidden sm:block text-left">
              <p className="font-semibold text-slate-900 leading-tight">Admin System</p>
              <p className="text-[10px] text-muted-foreground">superadmin@proofylink.id</p>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Admin Layout with Sidebar ─── */}
      <div className="container mx-auto grid gap-8 px-4 py-8 lg:grid-cols-[240px_1fr]">
        {/* ─── Sidebar Navigation ─── */}
        <aside className="h-fit rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs lg:sticky lg:top-20">
          <div className="border-b border-slate-100 pb-3.5">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">
              Control Panel
            </p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">
              Admin Portal
            </h2>
          </div>

          <nav className="mt-4 grid gap-1.5" aria-label="Admin navigation">
            {adminNavLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[#7C3AED] text-white shadow-xs font-bold"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`size-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-purple-50 text-[#7C3AED]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 border-t border-slate-100 pt-4 space-y-2">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs">
              <span className="font-semibold text-slate-700 block">Mode Administrator</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Akses penuh ke verifikasi, compliance &amp; provisioning sistem.
              </p>
            </div>
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main className="min-w-0">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">Operations</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
