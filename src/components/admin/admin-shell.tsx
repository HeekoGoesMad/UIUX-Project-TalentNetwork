"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Coins,
  GraduationCap,
  LayoutDashboard,
  Menu,
  ScrollText,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/providers/app-provider";
import { cn } from "@/lib/utils";

interface NavGroup {
  heading: string;
  items: Array<{
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
    badge?: string;
    disabled?: boolean;
  }>;
}

const adminNavGroups: NavGroup[] = [
  {
    heading: "Menu Utama",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    heading: "Verifikasi & Data",
    items: [
      { label: "Perusahaan", href: "/admin/companies", icon: Building2 },
      { label: "Kemitraan", href: "/admin/partnerships", icon: GraduationCap },
    ],
  },
  {
    heading: "Sistem & Finansial",
    items: [
      { label: "Kuota Token", href: "/admin/tokens", icon: Coins },
      { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText },
      { label: "Pengaturan", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 antialiased flex flex-col selection:bg-purple-100 selection:text-purple-900">
      {/* ─── Admin Top Bar ─── */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile hamburger toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden size-9 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu navigasi"}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>

          <Link
            href="/admin"
            className="flex shrink-0 items-center gap-2.5 font-bold tracking-tight group transition-transform duration-300 hover:scale-[1.02]"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-pink-primary text-white shadow-sm transition-transform duration-300 group-hover:rotate-3">
              <ShieldCheck className="size-5" />
            </span>
            <span className="text-lg font-bold whitespace-nowrap text-slate-900">
              Talent<span className="text-primary"> Network</span>
            </span>
            <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10.5px] font-semibold text-primary border border-purple-200/80">
              Konsol Admin
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* User badge */}
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 py-1 pl-1.5 pr-2.5 sm:pr-3">
            <div className="flex size-6 items-center justify-center rounded-full bg-purple-100 font-bold text-primary text-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <span className="text-xs font-semibold text-slate-800">
              {user?.name || "Admin"}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg px-2.5 h-8 transition-colors cursor-pointer"
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Kembali ke Web</span>
            <span className="sm:hidden">Keluar</span>
          </Button>
        </div>
      </header>

      {/* ─── Main Admin Layout with Edge-Anchored Sidebar ─── */}
      <div className="flex-1 flex w-full">
        {/* ─── Mobile Sidebar Backdrop & Drawer ─── */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ─── Sidebar Navigation ─── */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white p-4 border-r border-slate-200 transition-transform duration-200 ease-out lg:static lg:z-auto lg:transition-none flex flex-col justify-between",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            "lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] overflow-y-auto"
          )}
        >
          <div className="space-y-6">
            {/* Mobile Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 lg:hidden">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-pink-primary text-white shadow-xs">
                  <ShieldCheck className="size-4.5" />
                </span>
                <span className="text-base font-bold text-slate-900">
                  Talent<span className="text-primary"> Network</span>
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-slate-500"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Navigation Groups */}
            <nav className="space-y-5" aria-label="Navigasi admin">
              {adminNavGroups.map((group) => (
                <div key={group.heading} className="space-y-1">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {group.heading}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        item.href === "/admin"
                          ? pathname === "/admin"
                          : pathname === item.href || (item.href !== "#" && pathname.startsWith(`${item.href}/`));

                      if (item.disabled) {
                        return (
                          <div
                            key={item.label}
                            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 opacity-60 cursor-not-allowed select-none"
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="size-4 text-slate-400 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className="rounded px-1.5 py-0.2 text-[9px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                            isActive
                              ? "bg-purple-50 text-[#7C3AED] font-semibold border-l-2 border-[#7C3AED] rounded-l-none"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={cn(
                                "size-4 shrink-0 transition-colors",
                                isActive ? "text-[#7C3AED]" : "text-slate-400 group-hover:text-slate-600"
                              )}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[9px] font-bold font-mono shrink-0",
                                isActive ? "bg-[#7C3AED] text-white" : "bg-slate-100 text-slate-600 border border-slate-200"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Sidebar Technical Ledger Footer */}
          <div className="pt-4 border-t border-slate-200/80 mt-auto">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-mono font-medium">Talent Network</span>
              <span className="font-mono text-[10px] text-slate-400">v1.2</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="size-1.5 rounded-full bg-emerald-500"></span>
              <span>Koneksi Supabase Aktif</span>
            </div>
          </div>
        </aside>

        {/* ─── Main Content Canvas ─── */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
                <Link href="/admin" className="hover:text-slate-900 transition-colors font-medium">
                  Admin
                </Link>
                <span>/</span>
                <span className="text-[#7C3AED] font-semibold">{title}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
