"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  GraduationCap,
  Menu,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
  LogOut,
  UserPlus,
  ChevronDown,
  Sparkles,
  Bookmark,
  Workflow,
  BriefcaseBusiness,
  FileQuestion,
  MessageSquare,
  LayoutDashboard,
  UserCheck,
} from "lucide-react";
import { useApp } from "@/providers/app-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { tokens, user, hydrated, notifications, devBypass, logout, activePartnerInstitution, partnerVerifications } = useApp();
  const visibleUser = hydrated ? user : null;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const pendingVerificationsCount = useMemo(() => {
    if (!partnerVerifications) return 0;
    return Object.values(partnerVerifications).filter(
      (v) => v.institution.toLowerCase() === activePartnerInstitution.toLowerCase() && v.status === "pending"
    ).length;
  }, [partnerVerifications, activePartnerInstitution]);

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

  // Standard flat links for public, candidate, and partner
  const publicLinks = [
    { href: isLanding ? "#features" : "/#features", label: "Fitur Utuh" },
    { href: isLanding ? "#how-it-works" : "/#how-it-works", label: "Cara Kerja" },
    { href: isLanding ? "#pricing" : "/#pricing", label: "Harga & Token" },
    { href: isLanding ? "#faq" : "/#faq", label: "FAQ" },
  ];

  const candidateLinks = [
    { href: "/candidate", label: "Dashboard" },
    { href: "/candidate/cv", label: "CV & Profile" },
    { href: "/candidate/career-advisor", label: "AI Tools" },
    { href: "/candidate/applications", label: "Lamaran" },
    { href: "/candidate/messages", label: "Pesan" },
  ];

  const partnerLinks = [
    { href: "/partner", label: "Dashboard" },
    { href: "/partner/talent", label: "Campus Talent", badge: pendingVerificationsCount },
    { href: "/partner/employers", label: "Employer Access" },
    { href: "/partner/analytics", label: "Analytics" },
  ];

  // Recruiter structured navigation shortcuts
  const recruiterSourcingItems = [
    {
      href: "/recruiter/discover",
      label: "Search Talent",
      description: "Cari kandidat terverifikasi",
      icon: Search,
    },
    {
      href: "/recruiter/intelligence",
      label: "AI Intelligence",
      description: "Market insights & talent match",
      icon: Sparkles,
    },
    {
      href: "/recruiter/shortlists",
      label: "Shortlists",
      description: "Kandidat tersimpan & catatan",
      icon: Bookmark,
    },
  ];

  const recruiterPipelineItems = [
    {
      href: "/recruiter/screenings",
      label: "Screening & Audit",
      description: "Verifikasi consent & score kandidat",
      icon: ShieldCheck,
    },
    {
      href: "/recruiter/operations",
      label: "Hiring Ops",
      description: "Pipeline proses rekrutmen tim",
      icon: Workflow,
    },
    {
      href: "/recruiter/jobs",
      label: "Manage Jobs",
      description: "Lowongan & kelola pelamar",
      icon: BriefcaseBusiness,
    },
    {
      href: "/recruiter/assessments",
      label: "Assessments",
      description: "Pertanyaan kuis & human review",
      icon: FileQuestion,
    },
  ];

  const isRecruiterSourcingActive =
    pathname.startsWith("/recruiter/discover") ||
    pathname.startsWith("/recruiter/intelligence") ||
    pathname.startsWith("/recruiter/shortlists") ||
    pathname.startsWith("/talent/");

  const isRecruiterPipelineActive =
    pathname.startsWith("/recruiter/screenings") ||
    pathname.startsWith("/recruiter/operations") ||
    pathname.startsWith("/recruiter/jobs") ||
    pathname.startsWith("/recruiter/assessments") ||
    pathname.startsWith("/recruiter/applications");

  const isLinkActive = (href: string) => {
    if (pathname === href) return true;
    if (href === "/candidate/career-advisor" && (pathname.startsWith("/candidate/career-") || pathname.startsWith("/candidate/assessments"))) {
      return true;
    }
    if (href === "/candidate/applications" && pathname.startsWith("/candidate/applications")) {
      return true;
    }
    if (href === "/candidate/cv" && (pathname === "/candidate/cv" || pathname === "/candidate/profile")) {
      return true;
    }
    if (href === "/recruiter/dashboard" && (pathname === "/recruiter/dashboard" || pathname === "/recruiter")) {
      return true;
    }
    if (href === "/recruiter/messages" && pathname.startsWith("/recruiter/messages")) {
      return true;
    }
    return false;
  };

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
                : "/recruiter/dashboard"
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
          {visibleUser?.role === "recruiter" ? (
            /* Recruiter Revamped Shortcuts */
            <>
              {/* Dashboard */}
              <Link
                href="/recruiter/dashboard"
                className={cn(
                  "rounded-full px-3.5 py-1.5 transition-colors duration-200",
                  isOverDarkHeader
                    ? "text-slate-300 hover:bg-white/10 hover:text-foreground"
                    : "text-muted-foreground hover:bg-slate-100 hover:text-foreground",
                  isLinkActive("/recruiter/dashboard") &&
                    (isOverDarkHeader
                      ? "bg-white/15 font-semibold text-white"
                      : "bg-slate-900 text-white font-semibold")
                )}
              >
                Dashboard
              </Link>

              {/* Sourcing Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3.5 py-1.5 transition-colors duration-200 outline-none select-none",
                    isOverDarkHeader
                      ? "text-slate-300 hover:bg-white/10 hover:text-white"
                      : "text-muted-foreground hover:bg-slate-100 hover:text-foreground",
                    isRecruiterSourcingActive &&
                      (isOverDarkHeader
                        ? "bg-white/15 font-semibold text-white"
                        : "bg-slate-900 text-white font-semibold")
                  )}
                >
                  <span>Sourcing</span>
                  <ChevronDown className="size-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 p-1.5">
                  <DropdownMenuLabel>Talent Discovery</DropdownMenuLabel>
                  {recruiterSourcingItems.map((item) => {
                    const ItemIcon = item.icon;
                    const active = pathname.startsWith(item.href);
                    return (
                      <DropdownMenuItem key={item.href} asChild className={active ? "bg-slate-100 font-semibold text-[#7C3AED]" : ""}>
                        <Link href={item.href} className="flex items-start gap-3 py-2">
                          <div className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
                            active ? "bg-[#7C3AED] text-white" : "bg-purple-50 text-[#7C3AED]"
                          )}>
                            <ItemIcon className="size-4" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-foreground">{item.label}</span>
                            <span className="text-[11px] font-normal text-muted-foreground leading-tight">
                              {item.description}
                            </span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Pipeline Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3.5 py-1.5 transition-colors duration-200 outline-none select-none",
                    isOverDarkHeader
                      ? "text-slate-300 hover:bg-white/10 hover:text-white"
                      : "text-muted-foreground hover:bg-slate-100 hover:text-foreground",
                    isRecruiterPipelineActive &&
                      (isOverDarkHeader
                        ? "bg-white/15 font-semibold text-white"
                        : "bg-slate-900 text-white font-semibold")
                  )}
                >
                  <span>Hiring & Ops</span>
                  <ChevronDown className="size-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 p-1.5">
                  <DropdownMenuLabel>Pipeline & Selection</DropdownMenuLabel>
                  {recruiterPipelineItems.map((item) => {
                    const ItemIcon = item.icon;
                    const active = pathname.startsWith(item.href);
                    return (
                      <DropdownMenuItem key={item.href} asChild className={active ? "bg-slate-100 font-semibold text-[#7C3AED]" : ""}>
                        <Link href={item.href} className="flex items-start gap-3 py-2">
                          <div className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
                            active ? "bg-[#7C3AED] text-white" : "bg-purple-50 text-[#7C3AED]"
                          )}>
                            <ItemIcon className="size-4" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-foreground">{item.label}</span>
                            <span className="text-[11px] font-normal text-muted-foreground leading-tight">
                              {item.description}
                            </span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Messages / Pesan */}
              <Link
                href="/recruiter/messages"
                className={cn(
                  "rounded-full px-3.5 py-1.5 transition-colors duration-200",
                  isOverDarkHeader
                    ? "text-slate-300 hover:bg-white/10 hover:text-foreground"
                    : "text-muted-foreground hover:bg-slate-100 hover:text-foreground",
                  isLinkActive("/recruiter/messages") &&
                    (isOverDarkHeader
                      ? "bg-white/15 font-semibold text-white"
                      : "bg-slate-900 text-white font-semibold")
                )}
              >
                Pesan
              </Link>
            </>
          ) : (
            /* Non-recruiter standard links */
            (isPublicHeader
              ? publicLinks
              : visibleUser?.role === "candidate"
              ? candidateLinks
              : partnerLinks
            ).map((link) => {
              const isAnchor = link.href.startsWith("#") || link.href.includes("#");
              const active = !isAnchor && isLinkActive(link.href);
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
                    "inline-flex items-center rounded-full px-4 py-2 transition-colors duration-200",
                    isOverDarkHeader
                      ? "text-slate-300 hover:bg-white/10 hover:text-foreground"
                      : "text-muted-foreground hover:bg-slate-100 hover:text-foreground",
                    active &&
                      (isOverDarkHeader
                        ? "bg-white/15 font-semibold text-white"
                        : "bg-slate-900 text-white font-semibold")
                  )}
                >
                  <span>{link.label}</span>
                  {"badge" in link && typeof link.badge === "number" && link.badge > 0 && (
                    <span className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">

          {visibleUser?.role === "partner" && (
            <div className="flex items-center gap-2">
              <Link
                href="/partner/talent"
                className="flex items-center gap-1.5 rounded-full border bg-white/90 px-3.5 py-1.5 text-xs font-semibold shadow-xs hover:bg-slate-50 transition-colors"
                title="Active Campus Partner"
              >
                <GraduationCap className="size-4 text-[#7C3AED]" />
                <span className="font-semibold text-slate-800">{activePartnerInstitution}</span>
              </Link>
              {pendingVerificationsCount > 0 && (
                <Button size="sm" className="hidden sm:inline-flex rounded-full text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white font-semibold" asChild>
                  <Link href="/partner/talent?filter=pending">
                    <UserCheck className="size-3.5 mr-1" />
                    {pendingVerificationsCount} Verifikasi Pending
                  </Link>
                </Button>
              )}
            </div>
          )}

          {visibleUser?.role === "recruiter" && (
            <Link
              href="/recruiter/billing"
              title="Kelola Token & Billing"
              className="flex items-center gap-2 rounded-full border bg-white/90 px-3.5 py-1.5 text-sm font-semibold shadow-xs hover:bg-slate-50 transition-colors"
            >
              <WalletCards className="size-4 text-[#7C3AED]" />
              <span className="font-mono">{devBypass ? "∞" : tokens}</span>
              <span className="hidden text-muted-foreground sm:inline text-xs">tokens</span>
            </Link>
          )}

          {visibleUser && (() => {
            const unreadCount = notifications.filter((notification) => !notification.readAt).length;
            return (
              <Link
                href="/notifications"
                className="relative flex size-9 items-center justify-center rounded-full border bg-white/80 text-[#0a1628] shadow-xs transition-colors hover:bg-[#e3f5ed]"
                aria-label={unreadCount ? `${unreadCount} notifikasi baru` : "Notifikasi"}
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#19a974] text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
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
        <nav className="mt-2 max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-xl p-4 shadow-2xl md:hidden pointer-events-auto animate-fade-up">
          {visibleUser?.role === "recruiter" ? (
            <div className="flex flex-col gap-4">
              {/* Workspace Section */}
              <div>
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Workspace</p>
                <div className="mt-1.5 flex flex-col gap-1">
                  <Link
                    href="/recruiter/dashboard"
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isLinkActive("/recruiter/dashboard") ? "bg-slate-900 text-white font-semibold" : "text-foreground hover:bg-muted"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <LayoutDashboard className="size-4 text-[#7C3AED]" />
                    Dashboard
                  </Link>
                  <Link
                    href="/recruiter/messages"
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isLinkActive("/recruiter/messages") ? "bg-slate-900 text-white font-semibold" : "text-foreground hover:bg-muted"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <MessageSquare className="size-4 text-[#7C3AED]" />
                    Pesan
                  </Link>
                </div>
              </div>

              {/* Sourcing Section */}
              <div>
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sourcing & Talent</p>
                <div className="mt-1.5 flex flex-col gap-1">
                  {recruiterSourcingItems.map((item) => {
                    const ItemIcon = item.icon;
                    const active = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          active ? "bg-slate-900 text-white font-semibold" : "text-foreground hover:bg-muted"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        <ItemIcon className="size-4 text-[#7C3AED]" />
                        <div className="flex flex-col">
                          <span>{item.label}</span>
                          <span className="text-[10px] text-muted-foreground">{item.description}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Pipeline Section */}
              <div>
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hiring & Pipeline</p>
                <div className="mt-1.5 flex flex-col gap-1">
                  {recruiterPipelineItems.map((item) => {
                    const ItemIcon = item.icon;
                    const active = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          active ? "bg-slate-900 text-white font-semibold" : "text-foreground hover:bg-muted"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        <ItemIcon className="size-4 text-[#7C3AED]" />
                        <div className="flex flex-col">
                          <span>{item.label}</span>
                          <span className="text-[10px] text-muted-foreground">{item.description}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Other roles mobile drawer */
            <div className="flex flex-col gap-1">
              {(isPublicHeader
                ? publicLinks
                : visibleUser?.role === "candidate"
                ? candidateLinks
                : partnerLinks
              ).map((link) => {
                const isAnchor = link.href.startsWith("#") || link.href.includes("#");
                const active = !isAnchor && isLinkActive(link.href);
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
                      "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      active ? "bg-slate-900 text-white font-semibold" : "text-foreground hover:bg-muted"
                    )}
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
          )}
        </nav>
      )}
    </header>
  );
}
