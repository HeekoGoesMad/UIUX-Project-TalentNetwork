"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

  const isLanding = pathname === "/";
  const isAuth = pathname === "/login" || pathname === "/register";
  const isPublicHeader = (isLanding || isAuth) && !visibleUser;
  const isOverDarkHeader = isLanding && !scrolled && !visibleUser;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
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
        { href: isLanding ? "#features" : "/#features", label: "Fitur Utuh" },
        { href: isLanding ? "#how-it-works" : "/#how-it-works", label: "Cara Kerja" },
        { href: isLanding ? "#pricing" : "/#pricing", label: "Harga & Token" },
        { href: isLanding ? "#faq" : "/#faq", label: "FAQ" },
      ]
    : visibleUser?.role === "candidate"
    ? [
        { href: "/candidate", label: "Workspace" },
        { href: "/candidate/cv", label: "CV & Profile" },
         { href: "/candidate/career-advisor", label: "Career Advisor" },
         { href: "/candidate/contact-requests", label: "Permintaan kontak" },
         { href: "/messages", label: "Pesan" },
      ]
    : visibleUser?.role === "partner"
    ? [
        { href: "/partner", label: "Dashboard" },
        { href: "/partner/talent", label: "Campus Talent" },
        { href: "/partner/employers", label: "Employer Access" },
        { href: "/partner/analytics", label: "Analytics" },
      ]
    : [
        { href: "/search", label: "Search talent" },
         { href: "/shortlist", label: "Shortlist" },
         { href: "/recruiter/screenings/new", label: "Screening" },
         { href: "/messages", label: "Pesan" },
         { href: "/dashboard", label: "Dashboard" },
      ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500 ease-in-out px-3 sm:px-6 pt-2 sm:pt-3 pointer-events-none",
        isLanding && "-mb-16 sm:-mb-20"
      )}
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-between transition-all duration-500 ease-in-out pointer-events-auto",
          scrolled
            ? "max-w-4xl sm:max-w-5xl rounded-full px-4 sm:px-6 py-2.5 liquid-glass-scrolled shadow-[0_14px_44px_rgba(10,22,40,0.18)]"
            : isOverDarkHeader
            ? "max-w-7xl rounded-full px-4 sm:px-6 py-3.5 liquid-glass-dark-top text-white"
            : "max-w-7xl rounded-full px-4 sm:px-6 py-3.5 liquid-glass-top text-[#0a1628]"
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
          className="flex items-center gap-2.5 font-bold tracking-tight group transition-transform duration-300 hover:scale-[1.02]"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#EC4899] text-white shadow-sm transition-transform duration-300 group-hover:rotate-3">
            <ShieldCheck className="size-5" />
          </span>
          <span className={cn("text-lg font-bold", isOverDarkHeader ? "text-white" : "text-[#111827]")}>
            Proofy<span className="text-[#7C3AED]">Link</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          {links.map((link) => {
            const isAnchor = link.href.startsWith("#") || link.href.includes("#");
            return isAnchor ? (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 transition-colors duration-200",
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
                  "rounded-full px-4 py-2 transition-colors duration-200",
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
        <div className="flex items-center gap-2">
          {!isPublicHeader && (
            <Button variant="outline" size="sm" className="hidden rounded-full sm:inline-flex" asChild>
              <Link href={visibleUser?.role === "candidate" ? "/jobs" : "/search"}>
                <Search className="size-4" />
                {visibleUser?.role === "candidate" ? "Explore jobs" : "Search talent"}
              </Link>
            </Button>
          )}

          {visibleUser?.role === "partner" && (
            <Link
              href="/partner"
              className="flex items-center gap-2 rounded-full border bg-white/90 px-3.5 py-1.5 text-sm font-semibold shadow-xs"
            >
              <GraduationCap className="size-4 text-[#7C3AED]" />
              <span className="hidden text-muted-foreground sm:inline text-xs">Career Center</span>
            </Link>
          )}

          {visibleUser?.role === "recruiter" && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-full border bg-white/90 px-3.5 py-1.5 text-sm font-semibold shadow-xs"
            >
              <WalletCards className="size-4 text-[#7C3AED]" />
              <span className="font-mono">{devBypass ? "∞" : tokens}</span>
              <span className="hidden text-muted-foreground sm:inline">tokens</span>
            </Link>
          )}

          {visibleUser && (() => {
            const unreadCount = notifications.filter((notification) => !notification.readAt).length;
            return (
              <Link href="/notifications" className="relative flex size-9 items-center justify-center rounded-full border bg-white/80 text-[#0a1628] shadow-xs transition-colors hover:bg-[#e3f5ed]" aria-label={unreadCount ? `${unreadCount} notifikasi baru` : "Notifikasi"}>
                <Bell className="size-4" />
                {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#19a974] text-[10px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </Link>
            );
          })()}

          {visibleUser ? (
            <Button
              variant="ghost"
              size="icon"
              className={cn("rounded-full", isOverDarkHeader && "text-white hover:bg-white/10")}
              aria-label="Log out"
              onClick={logout}
            >
              <LogOut className="size-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              {pathname === "/login" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full font-medium transition-all border-white/20 bg-white/10 text-slate-800 hover:bg-slate-100 px-4"
                  asChild
                >
                  <Link href="/register">
                    <UserPlus className="mr-1.5 size-4 inline text-[#7C3AED]" />
                    Daftar akun
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className={cn(
                    "rounded-full font-medium transition-all shadow-sm px-3 sm:px-4 text-xs sm:text-sm h-9 sm:h-9",
                    isOverDarkHeader
                      ? "bg-[#7C3AED] text-white hover:bg-[#6D28D9]"
                      : "bg-[#7C3AED] text-white hover:bg-[#6D28D9]"
                  )}
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
            variant="ghost"
            size="icon"
            className={cn("rounded-full md:hidden", isOverDarkHeader && "text-white hover:bg-white/10")}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <nav className="mt-2 rounded-2xl border bg-white/95 backdrop-blur-xl p-4 shadow-2xl md:hidden pointer-events-auto animate-fade-up">
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
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#6D28D9]"
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
                    <UserPlus className="size-4 text-[#7C3AED]" /> Daftar akun baru
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
