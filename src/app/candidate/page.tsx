"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Lock,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProfileCompletionCard } from "@/components/candidate/profile-completion-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  iconBgClass = "bg-muted text-muted-foreground",
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  value: number | string;
  unit: string;
  hint: string;
  colorClass?: string;
  iconBgClass?: string;
}) {
  return (
    <Link href={href} className="group bg-card p-5 transition-colors hover:bg-muted/40">
      <div className="flex items-center gap-2.5">
        <span className={`flex size-8 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${iconBgClass}`}>
          <Icon className="size-4" />
        </span>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className={`mt-2.5 text-2xl font-bold tracking-tight font-mono ${colorClass}`}>
        {value} <span className="text-xs font-normal text-muted-foreground font-sans">{unit}</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground truncate">{hint}</p>
    </Link>
  );
}

export default function CandidateHome() {
  const { user, cvProfile, screeningConsents, consentRequests, dbMode } = useApp();
  const { applications } = useApplications();

  const candidateName = cvProfile?.fullName?.trim() || user?.name || "Kandidat Profesional";

  const readiness = calculateCandidateReadiness(cvProfile);

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

  const hasAlerts = Boolean(pendingOffer || interviewApplications.length > 0 || pendingConsentsCount > 0);

  const stats = [
    {
      href: "/candidate/applications",
      icon: Briefcase,
      label: "Lamaran Aktif",
      value: activeApplications.length,
      unit: "posisi",
      hint: "Pantau alur seleksi Anda",
      colorClass: "text-foreground",
      iconBgClass: "bg-primary/10 text-primary",
    },
    {
      href: "/candidate/applications",
      icon: Calendar,
      label: "Wawancara",
      value: interviewApplications.length,
      unit: "sesi",
      hint: interviewApplications.length > 0 ? "Jadwal wawancara terjadwal" : "Belum ada jadwal",
      colorClass: interviewApplications.length > 0 ? "text-emerald-600" : "text-foreground",
      iconBgClass: interviewApplications.length > 0 ? "bg-emerald-50 text-emerald-600" : "bg-muted text-muted-foreground",
    },
    {
      href: "/candidate/applications",
      icon: Award,
      label: "Penawaran Kerja",
      value: offerApplications.length,
      unit: "penawaran",
      hint: pendingOffer ? "Menunggu konfirmasi Anda" : "Hasil offering rekruter",
      colorClass: offerApplications.length > 0 ? "text-amber-600" : "text-foreground",
      iconBgClass: offerApplications.length > 0 ? "bg-amber-50 text-amber-600" : "bg-muted text-muted-foreground",
    },
    {
      href: "/candidate/contact-requests",
      icon: ShieldCheck,
      label: "Izin Skrining",
      value: pendingConsentsCount > 0 ? pendingConsentsCount : "Aman",
      unit: pendingConsentsCount > 0 ? "menunggu" : "terlindungi",
      hint: pendingConsentsCount > 0 ? "Permintaan akses dari rekruter" : "Izin profil terkendali penuh",
      colorClass: pendingConsentsCount > 0 ? "text-amber-600" : "text-emerald-600",
      iconBgClass: pendingConsentsCount > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <ProtectedRoute role="candidate">
      <div className="space-y-6">
        {/* Context Header */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Halo, {candidateName} 👋
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              Pantau perkembangan seleksi lamaran, izin akses rekruter, dan kesiapan kompetensi Anda.
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
        {hasAlerts && (
          <section aria-label="Perlu perhatian" className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Perlu Perhatian Segera
            </h2>
            <Card className="border-amber-200/80 bg-card shadow-xs overflow-hidden">
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
                {pendingConsentsCount > 0 && (
                  <ActionRow
                    icon={ShieldCheck}
                    title={`${pendingConsentsCount} permintaan izin profil dari rekruter`}
                    desc="Tinjau dan beri persetujuan aman untuk membuka detail profil Anda."
                    href="/candidate/contact-requests"
                    cta="Tinjau Izin"
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
              <h2 className="text-sm font-bold text-foreground">Aktivitas Lamaran Terakhir</h2>
              <p className="text-xs text-muted-foreground">Status seleksi pada posisi yang Anda lamar</p>
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

          {activeApplications.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeApplications.slice(0, 3).map((app) => (
                <Card key={app.id} className="border-border/80 bg-card hover:border-primary/40 transition-colors shadow-2xs">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-foreground truncate">
                          {app.job?.title || "Posisi Lamaran"}
                        </h3>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground truncate mt-0.5">
                          <Building2 className="size-3 shrink-0" />
                          {app.job?.organizationName || "Perusahaan Mitra"}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        app.status === "interview"
                          ? "bg-primary/10 text-primary"
                          : app.status === "offer"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {app.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                      <span className="text-muted-foreground">
                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Terkirim"}
                      </span>
                      <Button variant="outline" size="sm" asChild className="h-7 px-2.5 text-xs">
                        <Link href={`/candidate/applications/${app.id}`}>
                          Detail Alur
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-border bg-card/50 p-6 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                <Briefcase className="size-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Belum Ada Lamaran Aktif</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Profil Anda telah siap dilamar. Temukan peluang karier yang cocok dari lowongan terverifikasi ProofyLink.
              </p>
              <Button size="sm" asChild className="mt-4 text-xs font-semibold">
                <Link href="/jobs">
                  Eksplorasi Lowongan Kerja
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Link>
              </Button>
            </Card>
          )}
        </section>

        {/* 2-Column Action Accelerators */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Card 1: AI Career Optimization */}
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="size-4" />
                  </span>
                  <h3 className="text-sm font-bold text-foreground">AI Career Advisor</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Evaluasi kecocokan CV dengan posisi target, temukan kesenjangan kompetensi (skill gaps), dan dapatkan rekomendasi langkah karier terukur.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  Sinkronisasi 1-Klik ke CV
                </span>
                <Button variant="outline" size="sm" asChild className="text-xs font-semibold">
                  <Link href="/candidate/career-advisor">
                    Buka AI Advisor
                    <ArrowRight className="size-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Privacy & Verification Trust */}
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <ShieldCheck className="size-4" />
                  </span>
                  <h3 className="text-sm font-bold text-foreground">Privasi &amp; Verifikasi Kredensial</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Data profil Anda terlindungi dengan kerangka <em>Consent-First</em>. Rekruter tidak dapat melihat data kontak sebelum mendapatkan persetujuan langsung dari Anda.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Lock className="size-3.5 text-emerald-600" />
                  Kontrol Izin Penuh
                </span>
                <Button variant="outline" size="sm" asChild className="text-xs font-semibold">
                  <Link href="/candidate/contact-requests">
                    Kelola Izin Privasi
                    <ArrowRight className="size-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

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
                  <p className="text-sm font-bold text-foreground">Profil Kategori Prima &amp; Terverifikasi</p>
                  <p className="text-xs text-muted-foreground">
                    Semua seksi utama profil telah lengkap dan siap dipadankan dengan rekruter institusi mitra.
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
