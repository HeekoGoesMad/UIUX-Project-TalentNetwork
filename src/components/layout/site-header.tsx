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
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
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
      label: "Pipeline Rekrutmen",
      desc: "Operasi rekrutmen, screening AI & penawaran",
      icon: GitBranch,
    },
    {
      href: "/recruiter/jobs",
      label: "Lowongan Kerja",
      desc: "Kelola posting lowongan & pelamar masuk",
      icon: Briefcase,
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

  const isLinkActive = (href: string) => {
    if (href === "/candidate") return pathname === href || pathname?.startsWith("/candidate");
    if (href === "/jobs") return pathname === href || pathname?.startsWith("/jobs");
    if (href === "/messages")
      return pathname === href || pathname?.startsWith(`${href}/`) || pathname?.endsWith("/messages");
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

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
          { href: "/jobs", label: "Lowongan Kerja" },
          { href: "/messages", label: "Pesan" },
        ]
      : isPublicHeader
      ? [
          { href: isLanding ? "#how-it-works" : "/#how-it-works", label: "Cara Kerja" },
          { href: isLanding ? "#features" : "/#features", label: "Fitur Unggulan" },
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
  const isResetPassword = pathname?.startsWith("/reset-password");
  if (isOnboarding || isAdmin || isPending || isResetPassword) {
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
            : "max-w-7xl rounded-full px-4 sm:px-6 liquid-glass-top text-foreground"
        )}
      >
        {/* Brand Text Logo */}
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
          className="flex shrink-0 items-center font-bold tracking-tight transition-opacity hover:opacity-90"
        >
          <span className="text-lg font-bold whitespace-nowrap text-foreground">
            Talent<span className="text-primary"> Network</span>
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
                className="rounded-full px-3 py-1.5 lg:px-4 lg:py-2 whitespace-nowrap shrink-0 transition-colors duration-200 text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 lg:px-4 lg:py-2 whitespace-nowrap shrink-0 transition-colors duration-200 text-muted-foreground hover:bg-slate-100 hover:text-foreground",
                  isLinkActive(link.href) && "bg-slate-900 text-white font-semibold"
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
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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
              className="flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-full border bg-white/90 px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-xs sm:text-sm font-semibold shadow-xs hover:bg-slate-50 transition-colors"
            >
              <WalletCards className="size-3.5 sm:size-4 text-primary" />
              <span className="font-mono">{devBypass ? "∞" : tokens}</span>
              <span className="hidden text-muted-foreground sm:inline">token</span>
            </Link>
          )}

          {visibleUser && (() => {
            const unreadCount = notifications.filter((notification) => !notification.readAt).length;
            return (
              <Link href="/notifications" className={cn("relative flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-full border bg-white/80 text-foreground shadow-xs transition-colors hover:bg-emerald-50", pathname?.startsWith("/notifications") && "border-primary bg-primary/10 text-primary")} aria-label={unreadCount ? `${unreadCount} notifikasi baru` : "Notifikasi"}>
                <Bell className="size-3.5 sm:size-4" />
                {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </Link>
            );
          })()}

          {settingsHref && (
            <Link
              href={settingsHref}
              className={cn(
                "hidden md:flex size-9 shrink-0 items-center justify-center rounded-full border bg-white/80 text-foreground shadow-xs transition-colors hover:bg-slate-100",
                pathname === settingsHref && "border-primary bg-primary/10 text-primary"
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
              className="hidden md:flex rounded-full shrink-0 text-foreground hover:bg-slate-100"
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
                  className="rounded-full font-medium transition-all border-slate-200 bg-white text-slate-800 hover:bg-slate-50 px-4 whitespace-nowrap"
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
            className="rounded-full md:hidden shrink-0 text-foreground hover:bg-slate-100"
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
          className="mt-2 max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-2xl border bg-white/95 backdrop-blur-xl p-4 shadow-2xl md:hidden pointer-events-auto animate-fade-up dark:bg-slate-900/95 dark:border-slate-800"
        >
          {visibleUser?.role === "recruiter" && !isPartnerSection && !isCandidateSection ? (
            <div className="flex flex-col gap-3">
              {/* Recruiter Header Profile & Token Card */}
              <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3 dark:border-purple-900/40 dark:bg-purple-950/20">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {user?.companyName || user?.name || "Perusahaan Rekruter"}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <ShieldCheck className="size-3" />
                        Rekruter Terverifikasi
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between rounded-lg border border-slate-200/70 bg-white/95 px-3 py-2 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-purple-100 text-primary dark:bg-purple-950/60">
                      <WalletCards className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium">Saldo Token</p>
                      <p className="font-mono text-xs font-bold text-foreground">{devBypass ? "∞" : tokens} token</p>
                    </div>
                  </div>
                  <Link
                    href="/pricing"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-purple-100 transition-colors dark:bg-purple-950/60 dark:hover:bg-purple-900/80"
                  >
                    <Sparkles className="size-3" />
                    <span>Top Up</span>
                  </Link>
                </div>
              </div>

              {/* 1. Navigasi Utama */}
              <div>
                <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Navigasi Utama
                </p>
                <div className="flex flex-col gap-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === "/dashboard"
                        ? "bg-slate-900 text-white font-semibold shadow-xs"
                        : "text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <LayoutDashboard className="size-4" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    href="/search"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === "/search" || pathname.startsWith("/search/")
                        ? "bg-slate-900 text-white font-semibold shadow-xs"
                        : "text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <Search className="size-4" />
                    <span>Cari Talent</span>
                  </Link>

                  <Link
                    href="/messages"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname?.startsWith("/messages")
                        ? "bg-slate-900 text-white font-semibold shadow-xs"
                        : "text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <MessageSquare className="size-4" />
                    <span>Pesan</span>
                  </Link>
                </div>
              </div>

              {/* 2. Alur Rekrutmen */}
              <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Alur Rekrutmen
                </p>
                <div className="flex flex-col gap-1">
                  {recruiterFeatures.map((feat) => {
                    const Icon = feat.icon;
                    const isActive = pathname === feat.href || pathname?.startsWith(`${feat.href}/`);
                    return (
                      <Link
                        key={feat.href}
                        href={feat.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-purple-50 text-purple-950 font-semibold dark:bg-purple-950/40 dark:text-purple-100"
                            : "text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                        <div className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-lg",
                          isActive ? "bg-[#7C3AED] text-white" : "bg-purple-100 text-[#7C3AED] dark:bg-purple-950/60"
                        )}>
                          <Icon className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-tight">{feat.label}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{feat.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* 3. Pengaturan & Akun */}
              <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Akun &amp; Bantuan
                </p>
                <div className="flex flex-col gap-1">
                  <Link
                    href="/notifications"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname?.startsWith("/notifications")
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="size-4" />
                      <span>Notifikasi</span>
                    </div>
                    {notifications.filter((n) => !n.readAt).length > 0 && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                        {notifications.filter((n) => !n.readAt).length}
                      </span>
                    )}
                  </Link>

                  {settingsHref && (
                    <Link
                      href={settingsHref}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        pathname === settingsHref
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <Settings className="size-4" />
                      <span>Pengaturan Akun</span>
                    </Link>
                  )}

                  <Link
                    href="/pricing"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === "/pricing"
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <Sparkles className="size-4" />
                    <span>Paket &amp; Token</span>
                  </Link>
                </div>
              </div>

              {/* 4. Tombol Logout */}
              <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200/80 bg-red-50/60 py-2.5 text-sm font-semibold text-destructive hover:bg-red-100/80 transition-colors cursor-pointer dark:border-red-900/40 dark:bg-red-950/20"
                >
                  <LogOut className="size-4" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </div>
          ) : (
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
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-muted",
                      isLinkActive(link.href) && "bg-slate-900 text-white font-semibold"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}

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

              {visibleUser && (
                <div className="mt-2 border-t pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200/80 bg-red-50/60 py-2.5 text-sm font-semibold text-destructive hover:bg-red-100/80 transition-colors cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
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
          )}
        </nav>
      )}
    </header>
  );
}
