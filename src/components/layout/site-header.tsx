"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, GraduationCap, Menu, Search, ShieldCheck, UserRound, WalletCards, X, LogOut, UserPlus } from "lucide-react";
import { useApp } from "@/providers/app-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { tokens, user, hydrated, notifications, devBypass, logout } = useApp();
  const visibleUser = hydrated ? user : null;
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
  const isPublicHeader = (isLanding || isAuth) && !visibleUser;
  const isOverDarkHeader = isLanding && !scrolled && !visibleUser;

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y > 35) {
        setScrolled(true);
      } else if (y < 15) {
        setScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation links based on route and auth state
  const links = isPublicHeader
    ? [
        { href: isLanding ? "#features" : "/#features", label: "Fitur Unggulan" },
        { href: isLanding ? "#how-it-works" : "/#how-it-works", label: "Cara Kerja" },
        { href: isLanding ? "#pricing" : "/#pricing", label: "Harga & Token" },
        { href: isLanding ? "#faq" : "/#faq", label: "FAQ" },
      ]
    : visibleUser?.role === "candidate"
    ? [
        { href: "/candidate", label: "Workspace" },
        { href: "/candidate/cv", label: "CV & Profil" },
         { href: "/candidate/career-advisor", label: "Career Advisor" },
         { href: "/candidate/contact-requests", label: "Permintaan Kontak" },
         { href: "/messages", label: "Pesan" },
      ]
    : visibleUser?.role === "partner"
    ? [
        { href: "/partner", label: "Dashboard" },
        { href: "/partner/talent", label: "Talent Kampus" },
        { href: "/partner/employers", label: "Akses Employer" },
        { href: "/partner/analytics", label: "Analitik" },
      ]
    : [
        { href: "/search", label: "Cari Talent" },
         { href: "/shortlist", label: "Shortlist" },
         { href: "/recruiter/screenings/new", label: "Screening" },
         { href: "/messages", label: "Pesan" },
         { href: "/dashboard", label: "Dashboard" },
      ];

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
              ? visibleUser.role === "candidate"
                ? "/candidate"
                : visibleUser.role === "partner"
                ? "/partner"
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
        </nav>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {!isPublicHeader && (
            <Button variant="outline" size="sm" className="hidden rounded-full sm:inline-flex whitespace-nowrap shrink-0 px-3" asChild>
              <Link href={visibleUser?.role === "candidate" ? "/jobs" : "/search"} className="flex items-center gap-1.5">
                <Search className="size-3.5" />
                <span className="hidden xl:inline text-xs">
                  {visibleUser?.role === "candidate" ? "Eksplorasi lowongan" : "Cari talent"}
                </span>
              </Link>
            </Button>
          )}

          {visibleUser?.role === "partner" && (
            <Link
              href="/partner"
              className="flex shrink-0 items-center gap-2 rounded-full border bg-white/90 px-3.5 py-1.5 text-sm font-semibold shadow-xs"
            >
              <GraduationCap className="size-4 text-primary" />
              <span className="hidden text-muted-foreground sm:inline text-xs">Career Center</span>
            </Link>
          )}

          {visibleUser?.role === "recruiter" && (
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
