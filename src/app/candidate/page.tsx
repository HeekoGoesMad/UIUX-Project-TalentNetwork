"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  MailCheck,
  Map,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  User,
  Zap,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import { DEMO_CANDIDATE_CV } from "@/lib/demo-seed";
import { CAREER_STATUS_CONFIG, type CareerStatus, type ConsentState } from "@/types";

type Application = {
  id: string;
  jobId: string;
  status: string;
  submittedAt: string;
  job?: { id: string; title: string; organizationName: string };
};

const statusLabels: Record<ConsentState, string> = {
  "not-requested": "Belum diminta",
  "pending-candidate-consent": "Menunggu jawabanmu",
  consented: "Disetujui",
  declined: "Ditolak",
  "consent-expired": "Kedaluwarsa",
  withdrawn: "Ditarik",
  "screening-in-progress": "Screening berjalan",
  "screening-completed": "Screening selesai",
  disputed: "Perlu ditinjau",
};

export default function CandidateDashboard() {
  const {
    user,
    profile,
    cvProfile,
    careerStatus,
    screeningConsents,
    contactRequests,
    consentRequests,
    respondToConsent,
    dbMode,
  } = useApp();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  // Active CV data (falls back gracefully to demo seed if not loaded)
  const activeCv = cvProfile ?? DEMO_CANDIDATE_CV;
  const displayName = profile?.displayName || user?.name || activeCv.fullName || "Kandidat";

  // Calculate profile completeness
  const completeness = useMemo(() => {
    let score = 0;
    const checks: { label: string; done: boolean; points: number }[] = [
      { label: "Data Pribadi & Kontak", done: Boolean(activeCv.fullName && activeCv.email), points: 15 },
      { label: "Headline & Target Peran", done: Boolean(activeCv.headline || activeCv.targetRole), points: 15 },
      { label: "Ringkasan Profil (Bio)", done: Boolean(activeCv.about && activeCv.about.length > 20), points: 15 },
      { label: "Pengalaman Kerja", done: Boolean(activeCv.experience && activeCv.experience.length > 0), points: 25 },
      { label: "Keahlian & Tools", done: Boolean(activeCv.skills && activeCv.skills.length >= 3), points: 20 },
      { label: "Riwayat Pendidikan", done: Boolean(activeCv.education && activeCv.education.length > 0), points: 10 },
    ];

    checks.forEach((item) => {
      if (item.done) score += item.points;
    });

    return { score, checks };
  }, [activeCv]);

  // Load applications count from API / LocalStorage
  useEffect(() => {
    let active = true;
    if (!dbMode) {
      try {
        const stored = JSON.parse(localStorage.getItem("proofylink-demo-applications") ?? "[]") as Application[];
        if (active) {
          setApplications(stored);
          setLoadingApps(false);
        }
      } catch {
        if (active) setLoadingApps(false);
      }
      return () => {
        active = false;
      };
    }

    fetch("/api/applications", { cache: "no-store" })
      .then(async (res) => {
        const payload = (await res.json()) as { applications?: Application[] };
        if (active && res.ok) {
          setApplications(payload.applications ?? []);
        }
      })
      .catch(() => {
        if (active) setApplications([]);
      })
      .finally(() => {
        if (active) setLoadingApps(false);
      });

    return () => {
      active = false;
    };
  }, [dbMode]);

  // Unified contact requests list
  const remoteRequests = consentRequests
    .map((request) => ({
      candidateId: typeof request.candidateProfileId === "string" ? request.candidateProfileId : "",
      state: statusLabels[request.consentState as ConsentState]
        ? (request.consentState as ConsentState)
        : (screeningConsents[String(request.candidateProfileId)] ?? "not-requested"),
      recruiterName: typeof request.recruiterName === "string" ? request.recruiterName : "Recruiter",
      organization: typeof request.organizationName === "string" ? request.organizationName : "Perusahaan Mitra",
      date: typeof request.createdAt === "string" ? request.createdAt : undefined,
    }))
    .filter((req) => req.candidateId && req.state !== "not-requested");

  const localRequests = Object.entries(screeningConsents)
    .filter(([, state]) => state !== "not-requested")
    .map(([candidateId, state]) => ({
      candidateId,
      state,
      recruiterName: contactRequests?.[candidateId]?.recruiterName || "Recruiter Mitra",
      organization: contactRequests?.[candidateId]?.company || "Perusahaan Mitra",
      date: contactRequests?.[candidateId]?.requestedAt,
    }));

  const allRequests = dbMode ? remoteRequests : localRequests;
  const pendingRequests = allRequests.filter((req) => req.state === "pending-candidate-consent");

  const activeStatusKey: CareerStatus = careerStatus ?? activeCv.careerStatus ?? "open-to-work";
  const statusConfig = CAREER_STATUS_CONFIG[activeStatusKey] || CAREER_STATUS_CONFIG["open-to-work"];

  const activeAppsCount = applications.filter((app) => app.status !== "rejected" && app.status !== "withdrawn").length;

  return (
    <ProtectedRoute role="candidate">
      <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-12 space-y-8">
        {/* Welcome & Profile Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
          <div className="absolute -right-16 -top-16 size-72 rounded-full bg-gradient-to-br from-[#7C3AED]/10 to-[#EC4899]/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-[#7C3AED] border border-purple-100">
                  <ShieldCheck className="size-3.5" /> Candidate Workspace
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.color}`}>
                  <span className={`size-1.5 rounded-full ${statusConfig.dot}`} />
                  {statusConfig.label}
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
                Halo, {displayName} 👋
              </h1>
              <p className="max-w-2xl text-sm sm:text-base text-muted-foreground">
                Pantau progres profil, kelola permintaan recruiter, dan gunakan AI untuk mempercepat pencapaian target kariermu.
              </p>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="rounded-full shadow-xs" asChild>
                <Link href="/candidate/profile">
                  <User className="size-4 text-[#7C3AED]" />
                  Lihat Profil Publik
                </Link>
              </Button>
              <Button className="rounded-full bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-xs" asChild>
                <Link href="/candidate/cv">
                  <FileText className="size-4" />
                  Kelola CV & Profil
                </Link>
              </Button>
            </div>
          </div>

          {/* Profile Completeness Bar */}
          <div className="mt-8 rounded-2xl bg-slate-50 border border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">Tingkat Kelengkapan Profil</p>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 font-mono text-xs font-bold text-[#7C3AED]">
                    {completeness.score}%
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {completeness.score >= 90
                    ? "Profilmu sudah sangat lengkap dan siap dilirik recruiter!"
                    : "Lengkapi semua bagian untuk meningkatkan peluang muncul di pencarian talent."}
                </p>
              </div>
              {completeness.score < 100 && (
                <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-[#7C3AED]" asChild>
                  <Link href="/candidate/cv">
                    Lengkapi Sekarang <ChevronRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
              )}
            </div>

            {/* Progress Track */}
            <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] transition-all duration-500"
                style={{ width: `${completeness.score}%` }}
              />
            </div>

            {/* Checklist items pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {completeness.checks.map((check) => (
                <span
                  key={check.label}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    check.done
                      ? "bg-white text-slate-700 border border-slate-200"
                      : "bg-slate-200/60 text-slate-400 border border-transparent"
                  }`}
                >
                  {check.done ? (
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                  ) : (
                    <Clock className="size-3.5 text-slate-400" />
                  )}
                  {check.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Key Stats Cards Grid */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200/80 transition-all hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Profil Dilihat</p>
                <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED]">
                  <Eye className="size-4" />
                </div>
              </div>
              <p className="mt-3 font-mono text-3xl font-bold text-[#111827]">28</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <span>+12%</span>
                <span className="text-muted-foreground">dari minggu lalu</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 transition-all hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Permintaan Kontak</p>
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <MailCheck className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="font-mono text-3xl font-bold text-[#111827]">{allRequests.length}</p>
                {pendingRequests.length > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 text-[10px] font-semibold">
                    {pendingRequests.length} perlu respons
                  </Badge>
                )}
              </div>
              <Link
                href="/candidate/contact-requests"
                className="mt-2 inline-flex items-center text-xs font-semibold text-[#7C3AED] hover:underline"
              >
                Lihat permintaan <ArrowRight className="ml-1 size-3" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 transition-all hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lamaran Aktif</p>
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Send className="size-4" />
                </div>
              </div>
              <p className="mt-3 font-mono text-3xl font-bold text-[#111827]">
                {loadingApps ? "-" : activeAppsCount}
              </p>
              <Link
                href="/candidate/applications"
                className="mt-2 inline-flex items-center text-xs font-semibold text-[#7C3AED] hover:underline"
              >
                Pantau status lamaran <ArrowRight className="ml-1 size-3" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 transition-all hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Kesiapan AI</p>
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Zap className="size-4" />
                </div>
              </div>
              <p className="mt-3 font-mono text-3xl font-bold text-[#111827]">92%</p>
              <Link
                href="/candidate/career-advisor"
                className="mt-2 inline-flex items-center text-xs font-semibold text-[#7C3AED] hover:underline"
              >
                Buka AI Advisor <ArrowRight className="ml-1 size-3" />
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* AI Career Hub */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-[#7C3AED]">Akselerasi Karir</p>
              <h2 className="mt-1 text-2xl font-bold text-[#111827]">AI Career Toolkit</h2>
            </div>
            <span className="hidden sm:inline-flex text-xs text-muted-foreground">
              Didukung model rekomendasi berbasis kapabilitas
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/candidate/career-advisor" className="group block">
              <Card className="h-full border-slate-200/80 transition-all duration-200 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:shadow-md">
                <CardContent className="flex h-full flex-col justify-between p-5">
                  <div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] transition-transform group-hover:scale-105">
                      <Sparkles className="size-5" />
                    </div>
                    <h3 className="mt-4 font-semibold text-[#111827] group-hover:text-[#7C3AED] transition-colors">
                      Career Advisor
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      Analisis narasi CV, strengths, dan elevator pitch personal berbasis AI.
                    </p>
                  </div>
                  <span className="mt-4 inline-flex items-center text-xs font-semibold text-[#7C3AED]">
                    Mulai konsultasi <ArrowRight className="ml-1 size-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/candidate/career-roadmap" className="group block">
              <Card className="h-full border-slate-200/80 transition-all duration-200 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:shadow-md">
                <CardContent className="flex h-full flex-col justify-between p-5">
                  <div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-105">
                      <Map className="size-5" />
                    </div>
                    <h3 className="mt-4 font-semibold text-[#111827] group-hover:text-[#7C3AED] transition-colors">
                      Career Roadmap
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      Milestone bertahap dan target realistis menuju level karier berikutnya.
                    </p>
                  </div>
                  <span className="mt-4 inline-flex items-center text-xs font-semibold text-[#7C3AED]">
                    Lihat roadmap <ArrowRight className="ml-1 size-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/candidate/career-gaps" className="group block">
              <Card className="h-full border-slate-200/80 transition-all duration-200 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:shadow-md">
                <CardContent className="flex h-full flex-col justify-between p-5">
                  <div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-105">
                      <Target className="size-5" />
                    </div>
                    <h3 className="mt-4 font-semibold text-[#111827] group-hover:text-[#7C3AED] transition-colors">
                      Skill Gap Analysis
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      Petakan gap kompetensi teknis & soft-skill untuk posisi yang Anda incar.
                    </p>
                  </div>
                  <span className="mt-4 inline-flex items-center text-xs font-semibold text-[#7C3AED]">
                    Analisis gap <ArrowRight className="ml-1 size-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/candidate/assessments" className="group block">
              <Card className="h-full border-slate-200/80 transition-all duration-200 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:shadow-md">
                <CardContent className="flex h-full flex-col justify-between p-5">
                  <div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-105">
                      <Award className="size-5" />
                    </div>
                    <h3 className="mt-4 font-semibold text-[#111827] group-hover:text-[#7C3AED] transition-colors">
                      Skill Assessments
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      Uji kompetensi teknis dan dapatkan lencana terverifikasi untuk profilmu.
                    </p>
                  </div>
                  <span className="mt-4 inline-flex items-center text-xs font-semibold text-[#7C3AED]">
                    Uji keahlian <ArrowRight className="ml-1 size-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Inquiries & Job Discovery Section */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Recruiter Inquiries */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#111827]">Permintaan Kontak Recruiter</h3>
                <p className="text-xs text-muted-foreground">Recruiter yang berminat melanjutkan ke sesi screening</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-[#7C3AED]" asChild>
                <Link href="/candidate/contact-requests">
                  Lihat Semua ({allRequests.length}) <ChevronRight className="size-3.5" />
                </Link>
              </Button>
            </div>

            {allRequests.length === 0 ? (
              <Card className="border-dashed border-slate-300 bg-slate-50/50">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-purple-50 text-[#7C3AED]">
                    <MailCheck className="size-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-800">Belum ada permintaan kontak baru</p>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    Pastikan statusmu &ldquo;Open to Work&rdquo; dan CV terisi lengkap agar recruiter dapat mengundangmu.
                  </p>
                  <Button variant="outline" size="sm" className="mt-4 text-xs font-semibold text-[#7C3AED]" asChild>
                    <Link href="/candidate/cv">Lengkapi CV & Profil</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {allRequests.slice(0, 3).map((req, idx) => (
                  <Card key={req.candidateId + idx} className="border-slate-200/80 transition-all hover:shadow-xs">
                    <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED]/20 to-[#EC4899]/20 text-[#7C3AED] font-semibold text-sm">
                          {req.recruiterName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">{req.recruiterName}</p>
                          <p className="text-xs text-muted-foreground">{req.organization}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            req.state === "consented"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : req.state === "pending-candidate-consent"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {statusLabels[req.state] || req.state}
                        </span>

                        {req.state === "pending-candidate-consent" ? (
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg"
                            onClick={() => respondToConsent(req.candidateId, "consented")}
                          >
                            <Check className="mr-1 size-3" /> Setujui
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" asChild>
                            <Link href="/candidate/contact-requests">Detail</Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Explore Jobs CTA Banner */}
          <div className="flex flex-col justify-between rounded-3xl bg-[#201C45] p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 size-48 rounded-full bg-[#EC4899]/20 blur-3xl pointer-events-none" />
            <div className="space-y-4">
              <div className="inline-flex size-10 items-center justify-center rounded-xl bg-white/10 text-[#EC4899]">
                <Briefcase className="size-5" />
              </div>
              <h3 className="text-xl font-bold leading-snug">
                Temukan Lowongan yang Cocok dengan Profilmu
              </h3>
              <p className="text-xs leading-relaxed text-slate-300">
                Akses puluhan lowongan terverifikasi dari mitra startup dan enterprise. Kirim lamaran langsung dengan profil ProofyLink.
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <Button
                className="w-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white hover:opacity-95 shadow-md"
                asChild
              >
                <Link href="/jobs">
                  <Search className="mr-1.5 size-4" /> Jelajahi Lowongan
                </Link>
              </Button>
              <p className="text-center text-[11px] text-slate-400">
                Gratis untuk semua kandidat
              </p>
            </div>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
