"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  Bell,
  Briefcase,
  Calendar,
  Compass,
  ExternalLink,
  Eye,
  FileText,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProfileCompletionCard } from "@/components/candidate/profile-completion-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import { useApplications } from "@/components/applications/application-ui";

export default function CandidateHome() {
  const { user, cvProfile, screeningConsents, consentRequests, dbMode } = useApp();
  const { applications } = useApplications();

  // Candidate Name & Headline
  const candidateName = user?.name || cvProfile?.fullName || "Kandidat Profesional";
  const candidateRole = cvProfile?.targetRole || cvProfile?.headline || "Talent Network Member";
  const candidateLocation = cvProfile?.location || "Indonesia";

  // Pending Contact Consents
  const pendingConsentsCount = dbMode
    ? consentRequests.filter(
        (r) =>
          r.consentState === "pending-candidate-consent" ||
          screeningConsents[String(r.candidateProfileId)] === "pending-candidate-consent"
      ).length
    : Object.values(screeningConsents).filter((state) => state === "pending-candidate-consent").length;

  // Pipeline Insights
  const activeApplications = applications.filter(
    (app) => !["rejected", "withdrawn"].includes(app.status)
  );
  const interviewApplications = applications.filter((app) => app.status === "interview");
  const offerApplications = applications.filter(
    (app) => app.status === "offer" || app.status === "hired"
  );
  const pendingOffer = applications.find((app) => app.status === "offer");

  // Profile completion percent
  const sections = [
    Boolean(cvProfile?.fullName?.trim() && cvProfile?.email?.trim()),
    Boolean(cvProfile?.headline?.trim() && cvProfile?.about?.trim()),
    Boolean(cvProfile?.location?.trim() && cvProfile?.targetRole?.trim()),
    Boolean(cvProfile?.skills?.length && cvProfile?.tools?.length),
    Boolean(cvProfile?.experience?.length),
    Boolean(cvProfile?.education?.length),
  ];
  const completionPercent = Math.round((sections.filter(Boolean).length / sections.length) * 100);

  return (
    <ProtectedRoute role="candidate">
      <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-12 space-y-8">
        {/* Welcome Executive Header */}
        <div className="flex flex-col gap-6 rounded-2xl border border-purple-100 bg-linear-to-br from-purple-50/60 via-white to-indigo-50/40 p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="outline" className="border-purple-200 bg-purple-50/80 text-purple-700 font-mono text-[11px] font-semibold tracking-wider uppercase">
                Candidate Workspace
              </Badge>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs flex items-center gap-1 font-medium">
                <UserCheck className="size-3" /> Siap Wawancara
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Halo, {candidateName} 👋
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium text-slate-700">{candidateRole}</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-500">
                <MapPin className="size-3.5" /> {candidateLocation}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" asChild className="border-slate-200 bg-white shadow-2xs hover:bg-slate-50">
              <Link href="/candidate/profile">
                <Eye className="size-4 mr-1.5 text-purple-600" />
                Tinjau Profil Publik
              </Link>
            </Button>
            <Button size="sm" asChild className="bg-purple-600 text-white shadow-2xs hover:bg-purple-700">
              <Link href="/jobs">
                <Compass className="size-4 mr-1.5" />
                Cari Lowongan
              </Link>
            </Button>
          </div>
        </div>

        {/* Smart Hiring Action Center Alerts */}
        {(pendingOffer || interviewApplications.length > 0 || pendingConsentsCount > 0) && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-purple-600 animate-ping" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Action Center Rekrutmen
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-1">
              {/* Offer Letter Alert */}
              {pendingOffer && (
                <div className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
                      <Award className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-950">Tawaran Pekerjaan Siap Ditinjau!</span>
                        <Badge className="bg-emerald-600 text-white text-[10px]">Action Required</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-emerald-800">
                        Kamu menerima penawaran kerja resmi untuk posisi{" "}
                        <strong>{pendingOffer.job?.title ?? "Posisi Baru"}</strong> di{" "}
                        <strong>{pendingOffer.job?.organizationName ?? "Perusahaan"}</strong>.
                      </p>
                    </div>
                  </div>
                  <Button size="sm" className="shrink-0 bg-emerald-700 text-white hover:bg-emerald-800" asChild>
                    <Link href={`/candidate/applications/${pendingOffer.id}`}>
                      Tinjau & Tanggapi Tawaran
                      <ArrowRight className="size-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              )}

              {/* Upcoming Interview Alert */}
              {interviewApplications.length > 0 && (
                <div className="flex flex-col gap-4 rounded-xl border border-purple-200 bg-linear-to-r from-purple-500/10 via-purple-500/5 to-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-2xs">
                      <Calendar className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-purple-950">Jadwal Wawancara Aktif ({interviewApplications.length})</span>
                        <Badge className="bg-purple-600 text-white text-[10px]">Upcoming</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-purple-800">
                        Recruiter telah menjadwalkan sesi interview. Cek link Google Meet / Zoom dan agenda persiapanmu.
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 border-purple-300 text-purple-700 hover:bg-purple-50" asChild>
                    <Link href={`/candidate/applications/${interviewApplications[0].id}`}>
                      Buka Ruang Wawancara
                      <ExternalLink className="size-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              )}

              {/* Contact Request Pending Alert */}
              {pendingConsentsCount > 0 && (
                <div className="flex flex-col gap-4 rounded-xl border border-blue-200 bg-linear-to-r from-blue-500/10 via-blue-500/5 to-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
                      <Bell className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-950">
                          {pendingConsentsCount} Permintaan Kontak Baru
                        </span>
                        <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 text-[10px]">
                          1-Click Action
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-blue-800">
                        Recruiter atau mitra ingin menghubungi kamu untuk proses rekrutmen. Berikan izin dengan cepat di notifikasi.
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-50" asChild>
                    <Link href="/notifications?tab=contact-requests">
                      Tinjau di Notifikasi
                      <ArrowRight className="size-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4 Executive KPI Stat Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Link href="/candidate/applications" className="block group">
            <Card className="h-full border-slate-200 bg-white transition-all duration-200 group-hover:border-purple-300 group-hover:shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Lamaran Aktif
                  </span>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <Briefcase className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">
                    {activeApplications.length}
                  </span>
                  <span className="text-xs text-muted-foreground">posisi</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1 group-hover:text-purple-600 transition-colors">
                  Pantau timeline seleksi <ArrowRight className="size-3" />
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/candidate/applications" className="block group">
            <Card className="h-full border-slate-200 bg-white transition-all duration-200 group-hover:border-fuchsia-300 group-hover:shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Wawancara
                  </span>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-fuchsia-50 text-fuchsia-600">
                    <Calendar className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">
                    {interviewApplications.length}
                  </span>
                  <span className="text-xs text-muted-foreground">sesi</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1 group-hover:text-fuchsia-600 transition-colors">
                  {interviewApplications.length > 0 ? "Jadwal interview aktif" : "Belum ada jadwal"} <ArrowRight className="size-3" />
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/candidate/applications" className="block group">
            <Card className="h-full border-slate-200 bg-white transition-all duration-200 group-hover:border-emerald-300 group-hover:shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Penawaran
                  </span>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Award className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">
                    {offerApplications.length}
                  </span>
                  <span className="text-xs text-muted-foreground">penawaran</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1 group-hover:text-emerald-600 transition-colors">
                  {pendingOffer ? "Menunggu konfirmasi" : "Hasil offering"} <ArrowRight className="size-3" />
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/candidate/cv" className="block group">
            <Card className="h-full border-slate-200 bg-white transition-all duration-200 group-hover:border-blue-300 group-hover:shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Profil ATS
                  </span>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <TrendingUp className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">
                    {completionPercent}%
                  </span>
                  <span className="text-xs text-muted-foreground">lengkap</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                  {completionPercent === 100 ? "Profil prima" : "Tingkatkan skor profil"} <ArrowRight className="size-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Symmetric 4-Pillar Workspace Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Pusat Navigasi Karier</h2>
              <p className="text-xs text-muted-foreground">Akses cepat seluruh modul operasional kandidat</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Pillar 1: Lamaran & Pipeline */}
            <Link href="/candidate/applications" className="group block">
              <Card className="card-interactive h-full border-slate-200 bg-white transition-all duration-200 group-hover:border-purple-400 group-hover:shadow-md">
                <CardContent className="p-6 flex flex-col justify-between h-full gap-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Briefcase className="size-5" />
                      </div>
                      <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50/50 text-[11px]">
                        Hiring Flow
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                        Lamaran & Status Rekrutmen
                      </h3>
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                        Pantau progres seleksi di setiap lowongan yang kamu lamar, jadwal wawancara teknis, hingga offering letter resmi.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-purple-600 pt-3 border-t border-slate-100">
                    Buka Lamaran & Timeline <ArrowRight className="size-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Pillar 2: CV & Digital Resume */}
            <Link href="/candidate/cv" className="group block">
              <Card className="card-interactive h-full border-slate-200 bg-white transition-all duration-200 group-hover:border-indigo-400 group-hover:shadow-md">
                <CardContent className="p-6 flex flex-col justify-between h-full gap-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <FileText className="size-5" />
                      </div>
                      <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50/50 text-[11px]">
                        Digital Resume
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        CV & Profil Profesional
                      </h3>
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                        Susun riwayat kerja terstruktur, keahlian teknis, portofolio proyek, dan ekspor ke format resume standar industri.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-indigo-600 pt-3 border-t border-slate-100">
                    Kelola CV & Pengalaman <ArrowRight className="size-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Pillar 3: AI Career Advisor */}
            <Link href="/candidate/career-advisor" className="group block">
              <Card className="card-interactive h-full border-slate-200 bg-white transition-all duration-200 group-hover:border-amber-400 group-hover:shadow-md">
                <CardContent className="p-6 flex flex-col justify-between h-full gap-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Sparkles className="size-5" />
                      </div>
                      <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50/50 text-[11px]">
                        AI Intelligence
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                        AI Career Advisor & ATS Optimization
                      </h3>
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                        Evaluasi kecocokan kata kunci profil terhadap ATS recruiter, formulasi headline memikat, dan identifikasi celah kompetensi.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-amber-600 pt-3 border-t border-slate-100">
                    Konsultasi Penasihat AI <ArrowRight className="size-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Pillar 4: Verifikasi Kampus & Kredensial */}
            <Link href="/candidate/career-roadmap" className="group block">
              <Card className="card-interactive h-full border-slate-200 bg-white transition-all duration-200 group-hover:border-emerald-400 group-hover:shadow-md">
                <CardContent className="p-6 flex flex-col justify-between h-full gap-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <ShieldCheck className="size-5" />
                      </div>
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50/50 text-[11px]">
                        Peta Karier & Bukti
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        Roadmap Karier & Bukti Portofolio
                      </h3>
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                        Rencanakan target kenaikan tingkat keahlian, buat bukti pengerjaan proyek nyata, dan dapatkan pengakuan kredensial.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-emerald-600 pt-3 border-t border-slate-100">
                    Buka Roadmap Karier <ArrowRight className="size-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Profile Completion Checklist Card */}
        <div>
          <ProfileCompletionCard />
        </div>
      </main>
    </ProtectedRoute>
  );
}
