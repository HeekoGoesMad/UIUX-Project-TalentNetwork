"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  Bell,
  Briefcase,
  Calendar,
  Compass,
  Eye,
  FileText,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProfileCompletionCard } from "@/components/candidate/profile-completion-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import { useApplications } from "@/components/applications/application-ui";

type Icon = typeof Award;

const NAVS: { href: string; icon: Icon; title: string; desc: string }[] = [
  { href: "/candidate/applications", icon: Briefcase, title: "Lamaran & status", desc: "Pantau timeline seleksi lamaranmu." },
  { href: "/candidate/cv", icon: FileText, title: "CV & profil", desc: "Kelola pengalaman dan keahlian." },
  { href: "/candidate/career-advisor", icon: Sparkles, title: "AI Career Advisor", desc: "Optimasi profil agar lolos ATS." },
  { href: "/candidate/career-roadmap", icon: ShieldCheck, title: "Roadmap karier", desc: "Rencana skill dan bukti portofolio." },
];

function ActionRow({
  icon: Icon,
  title,
  desc,
  href,
  cta,
  emerald = false,
}: {
  icon: Icon;
  title: string;
  desc: string;
  href: string;
  cta: string;
  emerald?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-5">
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-md ${
          emerald ? "bg-emerald-50 text-emerald-600" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="truncate text-sm text-muted-foreground">{desc}</p>
      </div>
      <Button size="sm" variant={emerald ? "default" : "outline"} asChild className="shrink-0">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}

function StatCell({
  href,
  icon: Icon,
  label,
  value,
  unit,
  hint,
}: {
  href: string;
  icon: Icon;
  label: string;
  value: number | string;
  unit: string;
  hint: string;
}) {
  return (
    <Link href={href} className="bg-card p-5 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">
        {value} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}

function NavItem({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: Icon;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-all hover:border-primary/40 hover:shadow-sm">
        <CardContent className="flex items-center gap-3 p-5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{title}</span>
            <span className="block truncate text-sm text-muted-foreground">{desc}</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function CandidateHome() {
  const { user, cvProfile, screeningConsents, consentRequests, dbMode } = useApp();
  const { applications } = useApplications();

  const candidateName = cvProfile?.fullName?.trim() || user?.name || "Kandidat Profesional";
  const candidateRole = cvProfile?.targetRole || cvProfile?.headline || "Talent Network Member";
  const candidateLocation = cvProfile?.location || "Indonesia";

  const pendingConsentsCount = dbMode
    ? consentRequests.filter(
        (r) =>
          r.consentState === "pending-candidate-consent" ||
          screeningConsents[String(r.candidateProfileId)] === "pending-candidate-consent"
      ).length
    : Object.values(screeningConsents).filter((state) => state === "pending-candidate-consent").length;

  const activeApplications = applications.filter(
    (app) => !["rejected", "withdrawn"].includes(app.status)
  );
  const interviewApplications = applications.filter((app) => app.status === "interview");
  const offerApplications = applications.filter(
    (app) => app.status === "offer" || app.status === "hired"
  );
  const pendingOffer = applications.find((app) => app.status === "offer");

  const sections = [
    Boolean(cvProfile?.fullName?.trim() && cvProfile?.email?.trim()),
    Boolean(cvProfile?.headline?.trim() && cvProfile?.about?.trim()),
    Boolean(cvProfile?.location?.trim() && cvProfile?.targetRole?.trim()),
    Boolean(cvProfile?.skills?.length && cvProfile?.tools?.length),
    Boolean(cvProfile?.experience?.length),
    Boolean(cvProfile?.education?.length),
  ];
  const completionPercent = Math.round((sections.filter(Boolean).length / sections.length) * 100);

  const hasAlerts = Boolean(pendingOffer || interviewApplications.length > 0 || pendingConsentsCount > 0);

  const stats = [
    { href: "/candidate/applications", icon: Briefcase, label: "Lamaran aktif", value: activeApplications.length, unit: "posisi", hint: "Pantau timeline seleksi" },
    { href: "/candidate/applications", icon: Calendar, label: "Wawancara", value: interviewApplications.length, unit: "sesi", hint: interviewApplications.length > 0 ? "Jadwal interview aktif" : "Belum ada jadwal" },
    { href: "/candidate/applications", icon: Award, label: "Penawaran", value: offerApplications.length, unit: "penawaran", hint: pendingOffer ? "Menunggu konfirmasi" : "Hasil offering" },
    { href: "/candidate/cv", icon: TrendingUp, label: "Profil ATS", value: `${completionPercent}%`, unit: "lengkap", hint: completionPercent === 100 ? "Profil prima" : "Tingkatkan skor profil" },
  ];

  return (
    <ProtectedRoute role="candidate">
      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Halo, {candidateName}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{candidateRole}</span>
                <span aria-hidden="true">•</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" /> {candidateLocation}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/candidate/profile">
                  <Eye className="size-4" />
                  Tinjau Profil Publik
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/jobs">
                  <Compass className="size-4" />
                  Cari Lowongan
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {hasAlerts && (
          <section aria-label="Perlu perhatian">
            <h2 className="mb-2 text-sm font-semibold">Perlu perhatian</h2>
            <Card>
              <div className="divide-y">
                {pendingOffer && (
                  <ActionRow
                    icon={Award}
                    title="Tawaran pekerjaan siap ditinjau"
                    desc={`${pendingOffer.job?.title ?? "Posisi baru"} • ${pendingOffer.job?.organizationName ?? "Perusahaan"}`}
                    href={`/candidate/applications/${pendingOffer.id}`}
                    cta="Tinjau tawaran"
                    emerald
                  />
                )}
                {interviewApplications.length > 0 && (
                  <ActionRow
                    icon={Calendar}
                    title={`Jadwal wawancara aktif (${interviewApplications.length})`}
                    desc="Cek tautan meeting dan agenda persiapan."
                    href={`/candidate/applications/${interviewApplications[0].id}`}
                    cta="Buka wawancara"
                  />
                )}
                {pendingConsentsCount > 0 && (
                  <ActionRow
                    icon={Bell}
                    title={`${pendingConsentsCount} permintaan kontak baru`}
                    desc="Berikan izin dari halaman notifikasi."
                    href="/notifications?tab=contact-requests"
                    cta="Tinjau"
                  />
                )}
              </div>
            </Card>
          </section>
        )}

        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4 lg:gap-0 lg:divide-x">
            {stats.map((s) => (
              <StatCell key={s.label} {...s} />
            ))}
          </div>
        </Card>

        <section aria-label="Navigasi karier">
          <h2 className="mb-2 text-base font-semibold">Jelajahi workspace</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {NAVS.map((n) => (
              <NavItem key={n.href + n.title} {...n} />
            ))}
          </div>
        </section>

        <ProfileCompletionCard />
      </main>
    </ProtectedRoute>
  );
}
