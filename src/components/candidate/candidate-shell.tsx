"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Briefcase,
  Check,
  ExternalLink,
  FileQuestion,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
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
    href: "/candidate/contact-requests",
    label: "Izin & Privasi",
    icon: ShieldCheck,
  },
  {
    href: "/candidate/verifications",
    label: "Verifikasi",
    icon: GraduationCap,
  },
];

export function CandidateShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, cvProfile } = useApp();
  const [copied, setCopied] = useState(false);

  // If on full-screen onboarding wizard, render without the workspace shell
  if (pathname === "/candidate/onboarding" || pathname?.startsWith("/candidate/onboarding/")) {
    return <>{children}</>;
  }

  const candidateName = cvProfile?.fullName?.trim() || user?.name || "Kandidat Profesional";
  const candidateRole = cvProfile?.targetRole || cvProfile?.headline || "Talent Network Member";
  const candidateLocation = cvProfile?.location || "Indonesia";

  const readiness = calculateCandidateReadiness(cvProfile);

  const handleShareProfile = async () => {
    try {
      const publicUrl = `${window.location.origin}/candidate/profile`;
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Tautan profil publik berhasil disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin tautan");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Candidate Profile Header Bar */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <h1 className="truncate text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {candidateName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  Terverifikasi
                </span>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground/90">{candidateRole}</span>
                <span aria-hidden="true" className="text-border">•</span>
                <span>{candidateLocation}</span>
                <span aria-hidden="true" className="text-border">•</span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  Kesiapan Profil:
                  <span className={cn("font-semibold font-mono", readiness.tierColor)}>
                    {readiness.percent}%
                  </span>
                  <span className="text-xs text-muted-foreground">({readiness.tier})</span>
                </span>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-medium"
                onClick={handleShareProfile}
              >
                {copied ? <Check className="size-3.5 text-emerald-600" /> : <Share2 className="size-3.5" />}
                {copied ? "Tersalin" : "Bagikan Profil"}
              </Button>
              <Button size="sm" variant="default" asChild className="gap-1.5 text-xs font-medium">
                <Link href="/candidate/profile">
                  <ExternalLink className="size-3.5" />
                  Lihat Profil Publik
                </Link>
              </Button>
            </div>
          </div>

          {/* Clean Horizontal Sub-Navigation */}
          <nav
            aria-label="Navigasi Workspace Kandidat"
            className="mt-6 -mb-px flex space-x-1 overflow-x-auto no-scrollbar border-t border-border/60 pt-2"
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
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-colors",
                    active
                      ? "bg-primary/10 text-primary font-semibold"
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
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {children}
      </div>
    </div>
  );
}
