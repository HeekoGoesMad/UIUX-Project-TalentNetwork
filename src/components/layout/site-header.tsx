"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Bookmark,
  Briefcase,
  ChevronDown,
  GitBranch,
  GraduationCap,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserPlus,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { useApp } from "@/providers/app-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { tokens, user, hydrated, notifications, devBypass, logout } = useApp();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    const menuButton = menuButtonRef.current;
    const getFocusable = () =>
      Array.from(drawer?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
    getFocusable()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = getFocusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!drawer?.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      menuButton?.focus();
    };
  }, [open]);

  const isLanding = pathname === "/";
  const isAuth = pathname === "/login" || pathname === "/register";
  const isOnboarding = pathname?.includes("/onboarding");
  const visibleUser = hydrated && !isAuth ? user : null;
  const isPublicHeader = isLanding || isAuth || !visibleUser;
  const isOverDarkHeader = isLanding && !scrolled && !visibleUser;

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y > 35) {
            setScrolled(true);
          } else if (y < 15) {
            setScrolled(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Clustered recruitment features for minimalist recruiter navigation
  const recruiterFeatures = [
    {
      href: "/recruiter/operations",
      label: "Pipeline & Operasi",
      desc: "Alur Dover, jadwal wawancara & status offer",
      icon: GitBranch,
    },
    {
      href: "/recruiter/jobs",
      label: "Lowongan Kerja",
      desc: "Kelola posting lowongan & pelamar masuk",
      icon: Briefcase,
    },
    {
      href: "/recruiter/screenings",
      label: "AI Screening",
      desc: "Hasil analisis kesesuaian role-fit & skor",
      icon: ShieldCheck,
    },
    {
      href: "/shortlist",
      label: "Shortlist Talent",
      desc: "Daftar kandidat potensial tersimpan",
      icon: Bookmark,
    },
  ];

  const isRecruiterFeatureActive = recruiterFeatures.some(
    (item) => pathname === item.href || pathname?.startsWith(`${item.href}/`)
  );

  const isPartnerSection = pathname?.startsWith("/partner");
  const isCandidateSection = pathname?.startsWith("/candidate");

  // Top-level direct navigation links
  const links =
    isPartnerSection || visibleUser?.role === "partner"
      ? [
          { href: "/partner", label: "Dashboard" },
          { href: "/partner/talent", label: "Talent Kampus" },
          { href: "/partner/employers", label: "Akses Employer" },
          { href: "/partner/analytics", label: "Analitik" },
        ]
      : isCandidateSection || visibleUser?.role === "candidate"
      ? [
          { href: "/candidate", label: "Workspace" },
          { href: "/candidate/applications", label: "Lamaran Saya" },
          { href: "/candidate/cv", label: "CV & Profil" },
          { href: "/candidate/career-advisor", label: "Career Advisor" },
          { href: "/messages", label: "Pesan" },
        ]
      : isPublicHeader
      ? [
          { href: isLanding ? "#features" : "/#features", label: "Fitur Unggulan" },
          { href: isLanding ? "#how-it-works" : "/#how-it-works", label: "Cara Kerja" },
          { href: isLanding ? "#pricing" : "/#pricing", label: "Harga & Token" },
          { href: isLanding ? "#faq" : "/#faq", label: "FAQ" },
        ]
      : [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/search", label: "Cari Talent" },
          { href: "/messages", label: "Pesan" },
        ];

  const isAdmin = pathname?.startsWith("/admin");
  const isPending = pathname?.includes("/pending");
  const settingsHref =
    visibleUser?.role === "candidate"
      ? "/candidate/settings"
      : visibleUser?.role === "recruiter"
        ? "/recruiter/settings"
        : null;
  if (isOnboarding || isAdmin || isPending) {
    return null;
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 ease-out px-3 sm:px-6 pt-2 sm:pt-3 pointer-events-none",
        isLanding && "-mb-16 sm:-mb-20"
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-14 items-center justify-between transition-all duration-300 ease-out pointer-events-auto",
          scrolled
            ? "max-w-5xl xl:max-w-6xl rounded-full px-4 sm:px-6 liquid-glass-scrolled shadow-[0_14px_44px_rgba(10,22,40,0.18)]"
            : isOverDarkHeader
            ? "max-w-7xl rounded-full px-4 sm:px-6 liquid-glass-dark-top text-white"
            : "max-w-7xl rounded-full px-4 sm:px-6 liquid-glass-top text-foreground"
        )}
      >
        {/* Logo */}
        <Link
          href={
            visibleUser
              ? isPartnerSection || visibleUser.role === "partner"
                ? "/partner"
                : isCandidateSection || visibleUser.role === "candidate"
                ? "/candidate"
                : "/dashboard"
              : "/"
          }
          className="flex shrink-0 items-center gap-2.5 font-bold tracking-tight group transition-transform duration-300 hover:scale-[1.02]"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-pink-primary text-white shadow-sm transition-transform duration-300 group-hover:rotate-3">
            <ShieldCheck className="size-5" />
          </span>
          <span className={cn("text-lg font-bold whitespace-nowrap", isOverDarkHeader ? "text-white" : "text-foreground")}>
            Proofy<span className="text-primary">Link</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden shrink-0 items-center gap-1 text-xs lg:text-sm font-medium md:flex">
          {links.map((link) => {
            const isAnchor = link.href.startsWith("#") || link.href.includes("#");
            return isAnchor ? (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 lg:px-4 lg:py-2 whitespace-nowrap shrink-0 transition-colors duration-200",
                  isOverDarkHeader
                    ? "text-slate-300 hover:bg-white/10 hover:text-white"
                    : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                )}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 lg:px-4 lg:py-2 whitespace-nowrap shrink-0 transition-colors duration-200",
                  isOverDarkHeader
                    ? "text-slate-300 hover:bg-white/10 hover:text-foreground"
                    : "text-muted-foreground hover:bg-slate-100 hover:text-foreground",
                  pathname === link.href && (isOverDarkHeader ? "bg-white/15 font-semibold text-white" : "bg-slate-900 text-white font-semibold")
                )}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Minimalist Clustered Dropdown for Recruiter */}
          {visibleUser?.role === "recruiter" && !isPartnerSection && !isCandidateSection && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 lg:px-4 lg:py-2 whitespace-nowrap shrink-0 transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isRecruiterFeatureActive
                    ? "bg-[#7C3AED] text-white font-semibold shadow-xs"
                    : isOverDarkHeader
                    ? "text-slate-300 hover:bg-white/10 hover:text-white"
                    : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                )}
              >
                <span>Alur Rekrutmen</span>
                <ChevronDown className="size-3.5 opacity-70 transition-transform duration-200" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-2 shadow-xl border-slate-200/80 dark:border-slate-800">
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Fasilitas &amp; Pipeline Seleksi
                </div>
                {recruiterFeatures.map((feat) => {
                  const Icon = feat.icon;
                  const isActive = pathname === feat.href || pathname?.startsWith(`${feat.href}/`);
                  return (
                    <DropdownMenuItem key={feat.href} asChild className={cn("p-2 rounded-xl cursor-pointer", isActive && "bg-purple-50 text-purple-950 dark:bg-purple-950/40 dark:text-purple-100")}>
                      <Link href={feat.href} className="flex items-start gap-2.5 w-full">
                        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg mt-0.5", isActive ? "bg-[#7C3AED] text-white" : "bg-purple-100 text-[#7C3AED] dark:bg-purple-950/60")}>
                          <Icon className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-tight text-foreground">{feat.label}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{feat.desc}</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {!isPublicHeader && !isPartnerSection && visibleUser?.role !== "partner" && (
            <Button variant="outline" size="sm" className="hidden rounded-full sm:inline-flex whitespace-nowrap shrink-0 px-3" asChild>
              <Link href={visibleUser?.role === "candidate" ? "/jobs" : "/search"} className="flex items-center gap-1.5">
                <Search className="size-3.5" />
                <span className="hidden xl:inline text-xs">
                  {visibleUser?.role === "candidate" ? "Eksplorasi lowongan" : "Cari talent"}
                </span>
              </Link>
            </Button>
          )}

          {(isPartnerSection || visibleUser?.role === "partner") && (
            <Link
              href="/partner"
              className="flex shrink-0 items-center gap-2 rounded-full border bg-white/90 px-3.5 py-1.5 text-sm font-semibold shadow-xs"
            >
              <GraduationCap className="size-4 text-[#7C3AED]" />
              <span className="hidden text-slate-700 sm:inline text-xs font-semibold">Career Center</span>
            </Link>
          )}

          {visibleUser?.role === "recruiter" && !isPartnerSection && !isCandidateSection && (
            <Link
              href="/dashboard"
              className="flex shrink-0 items-center gap-2 rounded-full border bg-white/90 px-3.5 py-1.5 text-sm font-semibold shadow-xs"
            >
              <WalletCards className="size-4 text-primary" />
              <span className="font-mono">{devBypass ? "∞" : tokens}</span>
              <span className="hidden text-muted-foreground sm:inline">token</span>
            </Link>
          )}

          {visibleUser && (() => {
            const unreadCount = notifications.filter((notification) => !notification.readAt).length;
            return (
              <Link href="/notifications" className="relative flex size-9 shrink-0 items-center justify-center rounded-full border bg-white/80 text-foreground shadow-xs transition-colors hover:bg-emerald-50" aria-label={unreadCount ? `${unreadCount} notifikasi baru` : "Notifikasi"}>
                <Bell className="size-4" />
                {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </Link>
            );
          })()}

          {settingsHref && (
            <Link
              href={settingsHref}
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full border bg-white/80 text-foreground shadow-xs transition-colors hover:bg-slate-100",
                pathname === settingsHref && "border-primary bg-primary/10 text-primary",
                isOverDarkHeader && "text-white bg-white/10 hover:bg-white/20 border-white/20"
              )}
              aria-label="Pengaturan Akun"
              title="Pengaturan Akun"
            >
              <Settings className="size-4" />
            </Link>
          )}

          {visibleUser ? (
            <Button
              variant="ghost"
              size="icon"
              className={cn("rounded-full shrink-0", isOverDarkHeader && "text-white hover:bg-white/10")}
              aria-label="Keluar dari akun"
              onClick={logout}
            >
              <LogOut className="size-4" />
            </Button>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              {pathname === "/login" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full font-medium transition-all border-white/20 bg-white/10 text-slate-800 hover:bg-slate-100 px-4 whitespace-nowrap"
                  asChild
                >
                  <Link href="/register">
                    <UserPlus className="mr-1.5 size-4 inline text-primary" />
                    Daftar akun
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-full font-medium transition-all shadow-sm px-3 sm:px-4 text-xs sm:text-sm h-9 sm:h-9 whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90"
                  asChild
                >
                  <Link href="/login">
                    <UserRound className="mr-1 sm:mr-1.5 size-3.5 sm:size-4 inline" />
                    <span>Masuk</span>
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon"
            className={cn("rounded-full md:hidden shrink-0", isOverDarkHeader && "text-white hover:bg-white/10")}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <nav
          ref={drawerRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
          className="mt-2 rounded-2xl border bg-white/95 backdrop-blur-xl p-4 shadow-2xl md:hidden pointer-events-auto animate-fade-up"
        >
          <div className="flex flex-col gap-1">
            {links.map((link) => {
              const isAnchor = link.href.startsWith("#") || link.href.includes("#");
              return isAnchor ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-slate-50 hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Mobile Recruiter Features Group */}
            {visibleUser?.role === "recruiter" && !isPartnerSection && !isCandidateSection && (
              <div className="mt-2 border-t border-slate-100 pt-2">
                <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Alur Rekrutmen Dover
                </p>
                {recruiterFeatures.map((feat) => {
                  const Icon = feat.icon;
                  const isActive = pathname === feat.href || pathname?.startsWith(`${feat.href}/`);
                  return (
                    <Link
                      key={feat.href}
                      href={feat.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted",
                        isActive && "bg-purple-50 text-purple-950 font-semibold"
                      )}
                    >
                      <Icon className={cn("size-4", isActive ? "text-[#7C3AED]" : "text-muted-foreground")} />
                      <span>{feat.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {settingsHref && (
              <Link
                href={settingsHref}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-muted",
                  pathname === settingsHref && "bg-primary/10 font-semibold text-primary"
                )}
                onClick={() => setOpen(false)}
              >
                <Settings className="size-4 text-primary" />
                Pengaturan
              </Link>
            )}
            {!visibleUser && (
              <div className="mt-2 border-t pt-3 flex flex-col gap-2">
                {pathname !== "/login" && (
                  <Link
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                    href="/login"
                    onClick={() => setOpen(false)}
                  >
                    <UserRound className="size-4" /> Masuk ke workspace
                  </Link>
                )}
                {pathname !== "/register" && (
                  <Link
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 shadow-xs"
                    href="/register"
                    onClick={() => setOpen(false)}
                  >
                    <UserPlus className="size-4 text-primary" /> Daftar akun baru
                  </Link>
                )}
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
