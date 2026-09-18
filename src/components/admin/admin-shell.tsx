"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
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
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      { label: "Pengaturan", href: "#", icon: Settings, badge: "Segera", disabled: true },
    ],
  },
];

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Jakarta",
        }) + " WIB"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 antialiased relative selection:bg-purple-100 selection:text-purple-900">
      {/* ─── Admin Top Bar ─── */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-8 backdrop-blur-md">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile hamburger toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden size-9 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu navigasi"}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>

          <Link
            href="/admin"
            className="flex items-center gap-2.5 font-bold text-slate-900 transition-opacity hover:opacity-85"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#7C3AED] text-white shadow-xs">
              <ShieldCheck className="size-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                Talent <span className="text-[#7C3AED]">Network</span>
              </span>
              <Badge variant="outline" className="border-purple-200 text-[#7C3AED] bg-purple-50/50 text-[10px] font-bold px-2 py-0">
                Admin
              </Badge>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Live System Operational Indicator */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-2xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>Sistem Normal</span>
            {timeStr && <span className="text-[11px] text-slate-400 font-mono">· {timeStr}</span>}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl px-2.5 sm:px-3 h-9 transition-colors"
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Kembali ke Web</span>
            <span className="sm:hidden">Keluar</span>
          </Button>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-purple-50 border border-purple-200 font-bold text-[#7C3AED] text-xs shadow-2xs">
              AD
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">Admin System</p>
              <p className="text-[10px] text-slate-400 font-mono">superadmin@talentnetwork.id</p>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Admin Layout with Responsive Sidebar ─── */}
      <div className="relative z-10 container mx-auto grid gap-8 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 lg:grid-cols-[250px_1fr]">
        {/* ─── Mobile Sidebar Backdrop & Drawer ─── */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-xs lg:hidden animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ─── Sidebar Navigation ─── */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-white p-5 shadow-2xl transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-full lg:rounded-2xl lg:border lg:border-slate-200/80 lg:p-4.5 lg:shadow-xs lg:transition-none",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            "lg:sticky lg:top-24 h-fit max-h-[calc(100vh-7rem)] overflow-y-auto"
          )}
        >
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#7C3AED] text-white">
                <ShieldCheck className="size-4" />
              </div>
              <span className="font-bold text-slate-900 text-sm">Talent Network Admin</span>
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
                          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-400 opacity-60 cursor-not-allowed select-none"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="size-4 text-slate-400 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="rounded-full px-1.5 py-0.2 text-[9px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
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
                          "group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150",
                          isActive
                            ? "bg-purple-50/80 text-[#7C3AED] border border-purple-200/90 font-bold shadow-2xs"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-0.5"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={cn(
                              "size-4 shrink-0 transition-colors",
                              isActive ? "text-[#7C3AED]" : "text-slate-400 group-hover:text-slate-700"
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0",
                              isActive ? "bg-white text-[#7C3AED] border border-purple-200" : "bg-purple-50 text-[#7C3AED]"
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

          {/* Sidebar Footer Security Widget */}
          <div className="mt-6 border-t border-slate-100 pt-4 space-y-2">
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-[11px]">
                <Lock className="size-3.5 text-[#7C3AED] shrink-0" />
                <span>Sistem Terverifikasi</span>
              </div>
              <p className="text-[10.5px] text-slate-500 mt-0.5 leading-relaxed">
                Log audit sesi aman &amp; tersinkronisasi.
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Talent Network v1.2</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500"></span> Aktif
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main className="min-w-0 flex-1 space-y-6">
          <div className="pb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {title}
            </h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
