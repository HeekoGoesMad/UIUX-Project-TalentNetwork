"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  Calendar,
  FileText,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProfileCompletionCard } from "@/components/candidate/profile-completion-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/providers/app-provider";
import { useApplications } from "@/components/applications/application-ui";
import { calculateCandidateReadiness } from "@/lib/candidate/onboarding-step";

function ActionRow({
  icon: Icon,
  title,
  desc,
  href,
  cta,
  emerald = false,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  href: string;
  cta: string;
  emerald?: boolean;
}) {
  return (
    <div className="flex items-center gap-3.5 p-4 sm:p-5">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
          emerald ? "bg-emerald-50 text-emerald-600" : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{desc}</p>
      </div>
      <Button size="sm" variant={emerald ? "default" : "outline"} asChild className="shrink-0 text-xs font-semibold">
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
  colorClass = "text-foreground",
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  value: number | string;
  unit: string;
  hint: string;
  colorClass?: string;
}) {
  return (
    <Link href={href} className="group bg-card p-5 transition-colors hover:bg-muted/40">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className={`mt-2.5 font-mono text-2xl font-bold tabular-nums tracking-tight ${colorClass}`}>
        {value} <span className="font-sans text-xs font-normal text-muted-foreground">{unit}</span>
      </p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}

export default function CandidateHome() {
  const { user, cvProfile } = useApp();
  const { applications, loading } = useApplications();

  const candidateName = cvProfile?.fullName?.trim() || user?.name || "Kandidat Profesional";

  const readiness = calculateCandidateReadiness(cvProfile);

  const activeApplications = applications.filter(
    (app) => !["rejected", "withdrawn"].includes(app.status)
  );
  const interviewApplications = applications.filter((app) => app.status === "interview");
  const offerApplications = applications.filter(
    (app) => app.status === "offer" || app.status === "hired"
  );
  const pendingOffer = applications.find((app) => app.status === "offer");

  const hasAlerts = Boolean(pendingOffer || interviewApplications.length > 0);

  const stats = [
    {
      href: "/candidate/applications",
      icon: Briefcase,
      label: "Lamaran aktif",
      value: activeApplications.length,
      unit: "posisi",
      hint: "Pantau alur seleksi Anda",
      colorClass: "text-foreground",
    },
    {
      href: "/candidate/applications",
      icon: Calendar,
      label: "Wawancara",
      value: interviewApplications.length,
      unit: "sesi",
      hint: interviewApplications.length > 0 ? "Jadwal wawancara terjadwal" : "Belum ada jadwal",
      colorClass: interviewApplications.length > 0 ? "text-emerald-600" : "text-foreground",
    },
    {
      href: "/candidate/applications",
      icon: Award,
      label: "Penawaran kerja",
      value: offerApplications.length,
      unit: "penawaran",
      hint: pendingOffer ? "Menunggu konfirmasi Anda" : "Hasil offering rekruter",
      colorClass: offerApplications.length > 0 ? "text-amber-600" : "text-foreground",
    },
    {
      href: "/candidate/verifications",
      icon: ShieldCheck,
      label: "Verifikasi profil",
      value: readiness.complete ? "100%" : `${readiness.percent}%`,
      unit: readiness.complete ? "lengkap" : "selesai",
      hint: readiness.complete ? "Kredensial siap kerja" : "Lengkapi profil Anda",
      colorClass: readiness.complete ? "text-emerald-600" : "text-amber-600",
    },
  ];

  return (
    <ProtectedRoute role="candidate">
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Halo, {candidateName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pantau status lamaran dan kesiapan profil Anda.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="text-xs font-medium">
              <Link href="/jobs">
                <Briefcase className="size-3.5 mr-1.5" />
                Cari Lowongan
              </Link>
            </Button>
            <Button size="sm" asChild className="text-xs font-semibold">
              <Link href="/candidate/career-advisor">
                <Sparkles className="size-3.5 mr-1.5" />
                AI Career Hub
              </Link>
            </Button>
          </div>
        </div>

        {/* Action Alerts */}
        {loading ? (
          <section aria-label="Perlu perhatian" className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Card className="overflow-hidden border-border/80 bg-card shadow-xs">
              <div className="flex items-center gap-3.5 p-4 sm:p-5">
                <Skeleton className="size-9 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-8 w-24 shrink-0 rounded-md" />
              </div>
            </Card>
          </section>
        ) : hasAlerts && (
          <section aria-label="Perlu perhatian" className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Perlu perhatian
            </h2>
            <Card className="overflow-hidden border-border/80 bg-card shadow-xs">
              <div className="divide-y divide-border/60">
                {pendingOffer && (
                  <ActionRow
                    icon={Award}
                    title="Tawaran pekerjaan siap ditinjau"
                    desc={`${pendingOffer.job?.title ?? "Posisi baru"} • ${pendingOffer.job?.organizationName ?? "Perusahaan"}`}
                    href={`/candidate/applications/${pendingOffer.id}`}
                    cta="Tinjau Tawaran"
                    emerald
                  />
                )}
                {interviewApplications.length > 0 && (
                  <ActionRow
                    icon={Calendar}
                    title={`${interviewApplications.length} jadwal wawancara aktif`}
                    desc="Persiapkan diri dan sinkronkan kalender wawancara Anda."
                    href="/candidate/applications"
                    cta="Cek Jadwal"
                  />
                )}
              </div>
            </Card>
          </section>
        )}

        {/* Quick Stats Grid */}
        <section aria-label="Statistik utama">
          <Card className="overflow-hidden border-border/80 bg-border/60 shadow-xs">
            <div className="grid grid-cols-2 gap-px sm:grid-cols-4">
              {stats.map((stat) => (
                <StatCell key={stat.label} {...stat} />
              ))}
            </div>
          </Card>
        </section>

        {/* Recent Applications Section */}
        <section aria-label="Lamaran terbaru" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Lamaran terakhir</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Status seleksi pada posisi yang Anda lamar</p>
            </div>
            {applications.length > 0 && (
              <Button variant="ghost" size="sm" asChild className="text-xs font-medium text-primary hover:text-primary">
                <Link href="/candidate/applications">
                  Lihat Semua ({applications.length})
                  <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            )}
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border/80 bg-card shadow-xs">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-7 w-16 rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeApplications.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeApplications.slice(0, 3).map((app) => (
                <Card key={app.id} className="border-border/80 bg-card shadow-xs transition-colors hover:bg-muted/40">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-foreground">
                          {app.job?.title || "Posisi Lamaran"}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <Building2 className="size-3 shrink-0" />
                          {app.job?.organizationName || "Perusahaan Mitra"}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                        app.status === "interview"
                          ? "bg-primary/10 text-primary"
                          : app.status === "offer"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {app.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
                      <span className="text-muted-foreground">
                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Terkirim"}
                      </span>
                      <Button variant="outline" size="sm" asChild className="h-7 px-2.5 text-xs">
                        <Link href={`/candidate/applications/${app.id}`}>
                          Detail
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-border bg-card/50 p-6 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Briefcase className="size-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Belum ada lamaran aktif</h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                Profil Anda siap dilamar. Temukan peluang yang cocok dari lowongan terverifikasi ProofyLink.
              </p>
              <Button size="sm" asChild className="mt-4 text-xs font-semibold">
                <Link href="/jobs">
                  Lihat lowongan kerja
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            </Card>
          )}
        </section>

        {/* Improvement shortcuts */}
        <section aria-label="Tingkatkan profil" className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Tingkatkan profil</h2>
          <Card className="overflow-hidden border-border/80 bg-card shadow-xs">
            <div className="divide-y divide-border/60">
              <ActionRow
                icon={Sparkles}
                title="AI Career Advisor"
                desc="Evaluasi kecocokan CV, kesenjangan skill, dan langkah karier berikutnya."
                href="/candidate/career-advisor"
                cta="Buka Advisor"
              />
            </div>
          </Card>
        </section>

        {/* Profile Completion / Readiness State */}
        {!readiness.complete ? (
          <ProfileCompletionCard />
        ) : (
          <Card className="border-emerald-200 bg-emerald-50/40 shadow-2xs">
            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4.5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Profil lengkap dan siap dilamar</p>
                  <p className="text-xs text-muted-foreground">
                    Semua bagian utama terisi. Rekruter dapat menemukan profil Anda.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild className="shrink-0 text-xs border-emerald-300 hover:bg-emerald-100 text-emerald-800">
                <Link href="/candidate/cv">
                  <FileText className="size-3.5 mr-1.5" />
                  Kelola di CV Studio
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
