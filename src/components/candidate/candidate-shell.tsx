"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  ExternalLink,
  FileQuestion,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApp } from "@/providers/app-provider";
import { calculateCandidateReadiness } from "@/lib/candidate/onboarding-step";

const NAV_ITEMS = [
  {
    href: "/candidate",
    exact: true,
    label: "Ringkasan",
    icon: LayoutDashboard,
  },
  {
    href: "/candidate/cv",
    label: "CV & Profil",
    icon: FileText,
  },
  {
    href: "/candidate/applications",
    label: "Lamaran",
    icon: Briefcase,
  },
  {
    href: "/candidate/career-advisor",
    label: "AI Career Hub",
    icon: Sparkles,
  },
  {
    href: "/candidate/assessments",
    label: "Asesmen",
    icon: FileQuestion,
  },
  {
    href: "/candidate/verifications",
    label: "Verifikasi",
    icon: GraduationCap,
  },
];

export function CandidateShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, cvProfile, hydrated } = useApp();

  // If on full-screen onboarding wizard, render without the workspace shell
  if (pathname === "/candidate/onboarding" || pathname?.startsWith("/candidate/onboarding/")) {
    return <>{children}</>;
  }

  const candidateName = hydrated
    ? (cvProfile?.fullName?.trim() || user?.name || "Kandidat Profesional")
    : "Kandidat Profesional";
  const candidateRole = hydrated
    ? (cvProfile?.headline?.trim() || cvProfile?.targetRole?.trim() || "Talent Network Member")
    : "Talent Network Member";
  const candidateLocation = hydrated
    ? (cvProfile?.location || "Indonesia")
    : "Indonesia";

  const readiness = calculateCandidateReadiness(hydrated ? cvProfile : null);

  return (
    <div className="min-h-screen bg-background pb-10 sm:pb-12">
      {/* Candidate workspace header */}
      <div className="border-b border-border bg-card">
        <div
          className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl" suppressHydrationWarning>
                  {candidateName}
                </p>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground" suppressHydrationWarning>
                <span className="font-medium text-foreground/90" suppressHydrationWarning>{candidateRole}</span>
                <span aria-hidden="true" className="text-border">•</span>
                <span suppressHydrationWarning>{candidateLocation}</span>
                <span aria-hidden="true" className="text-border">•</span>
                <span className="inline-flex items-center gap-1.5" suppressHydrationWarning>
                  Kesiapan profil
                  <span className={cn("font-semibold tabular-nums", readiness.tierColor)} suppressHydrationWarning>
                    {readiness.percent}%
                  </span>
                  <span className="text-xs" suppressHydrationWarning>({readiness.tier})</span>
                </span>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" variant="default" asChild className="gap-1.5 text-xs font-medium">
                <Link href="/candidate/profile">
                  <ExternalLink className="size-3.5" />
                  Lihat Profil Publik
                </Link>
              </Button>
            </div>
          </div>

          {/* Workspace navigation */}
          <nav
            aria-label="Navigasi Workspace Kandidat"
            className="mt-5 flex space-x-1 overflow-x-auto border-t border-border/60 pt-2"
          >
            {NAV_ITEMS.map((item) => {
              const ItemIcon = item.icon;
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  <ItemIcon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Workspace Content Area */}
      <div
        className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8"
      >
        {children}
      </div>
    </div>
  );
}
