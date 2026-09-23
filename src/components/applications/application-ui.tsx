"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bookmark,
  Briefcase,
  Building2,
  Calendar,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  FileQuestion,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadIcsFile } from "@/lib/calendar";
import { DEMO_CANDIDATE_CV } from "@/lib/demo-seed";
import { DEMO_JOBS, type Job } from "@/lib/jobs";
import {
  type RecruiterActivity,
  listCandidateActivities,
  markCandidateActivityAsRead,
} from "@/lib/recruiter-activity";
import { useApp } from "@/providers/app-provider";

export const applicationStatuses = [
  "new",
  "shortlisted",
  "screening",
  "assessment",
  "review",
  "interview",
  "offer",
  "hired",
  "rejected",
  "offer_declined",
  "withdrawn",
] as const;
export type ApplicationStatus = (typeof applicationStatuses)[number];
export type Application = { id: string; jobId: string; candidateProfileId?: string; status: ApplicationStatus; coverNote: string | null; submittedAt: string; withdrawnAt: string | null; updatedAt: string; job?: { id: string; title: string; organizationName: string }; candidate?: { name: string | null; headline: string | null; location: string | null } | null };
type History = { id: string; fromStatus: ApplicationStatus | null; toStatus: ApplicationStatus; reason: string | null; changedBy: string; createdAt: string };
const labels: Record<ApplicationStatus, string> = {
  new: "Baru",
  shortlisted: "Shortlist",
  screening: "Peninjauan Berkas",
  assessment: "Asesmen",
  review: "Ditinjau",
  interview: "Wawancara",
  offer: "Penawaran Kerja",
  hired: "Diterima (Hired)",
  rejected: "Tidak Lolos",
  offer_declined: "Tawaran Ditolak",
  withdrawn: "Ditarik",
};
const activeStatuses = applicationStatuses.filter((status) => status !== "withdrawn");
const stageColors: Record<ApplicationStatus, string> = {
  new: "bg-muted text-muted-foreground",
  shortlisted: "bg-muted text-muted-foreground",
  screening: "bg-blue-50 text-blue-700",
  assessment: "bg-muted text-muted-foreground",
  review: "bg-blue-50 text-blue-700",
  interview: "bg-primary/10 text-primary",
  offer: "bg-amber-50 text-amber-700",
  hired: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  offer_declined: "bg-red-50 text-red-700",
  withdrawn: "bg-muted text-muted-foreground",
};

export const storageKey = "proofylink-demo-applications";

export const DEFAULT_DEMO_APPLICATIONS: Application[] = [
  {
    id: "demo-app-001",
    jobId: "demo-job-1",
    status: "interview",
    coverNote: "Tertarik berkontribusi pada pengembangan sistem pembayaran digital dan UX research.",
    submittedAt: "2026-09-14T08:30:00.000Z",
    withdrawnAt: null,
    updatedAt: "2026-09-18T10:00:00.000Z",
    job: {
      id: "demo-job-1",
      title: "Senior Product Designer",
      organizationName: "PT Fintek Karya Nusantara (LinkAja)",
    },
    candidate: {
      name: "Nadia Putri Rahayu",
      headline: "Senior Product Designer | UX Research & Design Systems",
      location: "Jakarta Selatan",
    },
  },
  {
    id: "demo-app-002",
    jobId: "demo-job-2",
    status: "assessment",
    coverNote: "Fokus pada riset pengguna dan penguatan standardisasi design system di sektor perbankan.",
    submittedAt: "2026-09-10T14:20:00.000Z",
    withdrawnAt: null,
    updatedAt: "2026-09-16T11:00:00.000Z",
    job: {
      id: "demo-job-2",
      title: "Lead UX Researcher",
      organizationName: "PT Bank Mandiri (Persero) Tbk",
    },
    candidate: {
      name: "Nadia Putri Rahayu",
      headline: "Senior Product Designer | UX Research & Design Systems",
      location: "Jakarta Selatan",
    },
  },
  {
    id: "demo-app-003",
    jobId: "demo-job-3",
    status: "review",
    coverNote: "Memiliki keahlian mendalam dalam tokenisasi design token dan komponen multi-brand.",
    submittedAt: "2026-09-08T09:00:00.000Z",
    withdrawnAt: null,
    updatedAt: "2026-09-15T16:00:00.000Z",
    job: {
      id: "demo-job-3",
      title: "UI/UX Design System Specialist",
      organizationName: "PT Telkom Indonesia Tbk",
    },
    candidate: {
      name: "Nadia Putri Rahayu",
      headline: "Senior Product Designer | UX Research & Design Systems",
      location: "Jakarta Selatan",
    },
  },
  {
    id: "demo-app-004",
    jobId: "demo-job-4",
    status: "offer",
    coverNote: "Pengalaman 5+ tahun dalam merancang solusi e-commerce dan merchant center.",
    submittedAt: "2026-09-01T11:15:00.000Z",
    withdrawnAt: null,
    updatedAt: "2026-09-17T13:45:00.000Z",
    job: {
      id: "demo-job-4",
      title: "Product Designer - Merchant Solutions",
      organizationName: "PT Bukalapak.com Tbk",
    },
    candidate: {
      name: "Nadia Putri Rahayu",
      headline: "Senior Product Designer | UX Research & Design Systems",
      location: "Jakarta Selatan",
    },
  },
  {
    id: "demo-app-005",
    jobId: "demo-job-5",
    status: "hired",
    coverNote: "Tertarik memimpin perancangan interaksi produk digital inovatif di Djoin.",
    submittedAt: "2026-08-20T10:00:00.000Z",
    withdrawnAt: null,
    updatedAt: "2026-09-05T09:00:00.000Z",
    job: {
      id: "demo-job-5",
      title: "Senior Interaction Designer",
      organizationName: "PT Djoin Digital Inovasi",
    },
    candidate: {
      name: "Nadia Putri Rahayu",
      headline: "Senior Product Designer | UX Research & Design Systems",
      location: "Jakarta Selatan",
    },
  },
  {
    id: "demo-app-006",
    jobId: "demo-job-6",
    status: "rejected",
    coverNote: "Melamar posisi product design.",
    submittedAt: "2026-08-10T14:00:00.000Z",
    withdrawnAt: null,
    updatedAt: "2026-08-18T10:00:00.000Z",
    job: {
      id: "demo-job-6",
      title: "Junior UI Designer",
      organizationName: "PT Global Tiket Network (Tiket.com)",
    },
    candidate: {
      name: "Nadia Putri Rahayu",
      headline: "Senior Product Designer | UX Research & Design Systems",
      location: "Jakarta Selatan",
    },
  },
];

export function demoApplications(): Application[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_DEMO_APPLICATIONS));
      return DEFAULT_DEMO_APPLICATIONS;
    }
    const parsed = JSON.parse(raw) as Application[];
    return parsed.length > 0 ? parsed : DEFAULT_DEMO_APPLICATIONS;
  } catch {
    return DEFAULT_DEMO_APPLICATIONS;
  }
}

export function saveDemoApplication(application: Application) {
  localStorage.setItem(storageKey, JSON.stringify([...demoApplications().filter((item) => item.id !== application.id), application]));
}

function statusBadge(status: ApplicationStatus) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stageColors[status]}`}>{labels[status]}</span>;
}

function State({ text, error = false }: { text: string; error?: boolean }) {
  return <div className={`rounded-2xl border p-8 text-center text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "bg-card text-muted-foreground"}`} role={error ? "alert" : "status"}>{text}</div>;
}

function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemLabel,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}) {
  if (totalItems <= pageSize) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border/70 mt-4">
      <p className="text-xs text-muted-foreground font-medium">
        Menampilkan <span className="font-semibold text-foreground">{start}–{end}</span> dari{" "}
        <span className="font-semibold text-foreground">{totalItems}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-1.5 self-center sm:self-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2.5 text-xs"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="size-3.5 mr-1" />
          Sebelumnya
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`size-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentPage === page
                  ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2.5 text-xs"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Selanjutnya
          <ChevronRight className="size-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

export function useApplications() {
  const { dbMode } = useApp();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    if (!dbMode) {
      setApplications(demoApplications());
      setLoading(false);
      return () => { active = false; };
    }
    fetch("/api/applications", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { applications?: Application[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Aplikasi belum dapat dimuat.");
        if (active) setApplications(payload.applications ?? []);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Aplikasi belum dapat dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [dbMode, attempt]);

  return { applications, setApplications, loading, error, dbMode, retry: () => setAttempt((count) => count + 1) };
}

export function CandidateApplicationsPage() {
  const { applications, loading: appsLoading, error, dbMode, retry } = useApplications();
  const [mainTab, setMainTab] = useState<"applications" | "invitations">("applications");
  const [appFilter, setAppFilter] = useState<"all" | "active" | "interview" | "offer" | "rejected">("all");
  const [invFilter, setInvFilter] = useState<"all" | "interview" | "message" | "saved" | "viewed">("all");

  // Pagination states
  const ITEMS_PER_PAGE = 3;
  const [appPage, setAppPage] = useState(1);
  const [invPage, setInvPage] = useState(1);

  // Recruiter activities state
  const [activities, setActivities] = useState<RecruiterActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setActivitiesLoading(true);

    if (!dbMode) {
      setActivities(listCandidateActivities());
      setActivitiesLoading(false);
      return () => { active = false; };
    }

    fetch("/api/candidate/recruiter-activities", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal memuat aktivitas rekruter.");
        const data = (await res.json()) as { activities?: RecruiterActivity[] };
        if (active && data.activities) {
          setActivities(data.activities);
        }
      })
      .catch(() => {
        if (active) {
          setActivities(listCandidateActivities());
        }
      })
      .finally(() => {
        if (active) setActivitiesLoading(false);
      });

    return () => { active = false; };
  }, [dbMode]);

  const appCounts = useMemo(() => ({
    all: applications.length,
    active: applications.filter((a) => ["new", "shortlisted", "screening", "assessment", "review"].includes(a.status)).length,
    interview: applications.filter((a) => a.status === "interview").length,
    offer: applications.filter((a) => a.status === "offer" || a.status === "hired").length,
    rejected: applications.filter((a) => a.status === "rejected" || a.status === "offer_declined" || a.status === "withdrawn").length,
  }), [applications]);

  const invCounts = useMemo(() => ({
    all: activities.length,
    interview: activities.filter((a) => a.type === "interview_invited").length,
    message: activities.filter((a) => a.type === "message_received").length,
    saved: activities.filter((a) => a.type === "profile_saved").length,
    viewed: activities.filter((a) => a.type === "profile_viewed").length,
  }), [activities]);

  const unreadInvitations = useMemo(
    () => activities.filter((a) => !a.isRead).length,
    [activities]
  );

  const filteredApps = useMemo(() => applications.filter((item) => {
    if (appFilter === "all") return true;
    if (appFilter === "active") return ["new", "shortlisted", "screening", "assessment", "review"].includes(item.status);
    if (appFilter === "interview") return item.status === "interview";
    if (appFilter === "offer") return item.status === "offer" || item.status === "hired";
    return item.status === "rejected" || item.status === "offer_declined" || item.status === "withdrawn";
  }), [applications, appFilter]);

  const totalAppPages = Math.ceil(filteredApps.length / ITEMS_PER_PAGE) || 1;
  const paginatedApps = useMemo(() => {
    const start = (appPage - 1) * ITEMS_PER_PAGE;
    return filteredApps.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredApps, appPage]);

  const filteredInvs = useMemo(() => activities.filter((item) => {
    if (invFilter === "all") return true;
    if (invFilter === "interview") return item.type === "interview_invited";
    if (invFilter === "message") return item.type === "message_received";
    if (invFilter === "saved") return item.type === "profile_saved";
    if (invFilter === "viewed") return item.type === "profile_viewed";
    return true;
  }), [activities, invFilter]);

  const totalInvPages = Math.ceil(filteredInvs.length / ITEMS_PER_PAGE) || 1;
  const paginatedInvs = useMemo(() => {
    const start = (invPage - 1) * ITEMS_PER_PAGE;
    return filteredInvs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInvs, invPage]);

  const appChips = [
    { id: "all" as const, label: "Semua Lamaran", count: appCounts.all },
    { id: "active" as const, label: "Dalam Proses", count: appCounts.active },
    { id: "interview" as const, label: "Wawancara", count: appCounts.interview },
    { id: "offer" as const, label: "Penawaran", count: appCounts.offer },
    { id: "rejected" as const, label: "Selesai / Ditolak", count: appCounts.rejected },
  ];

  const invChips = [
    { id: "all" as const, label: "Semua Aktivitas", count: invCounts.all },
    { id: "interview" as const, label: "Undangan Wawancara", count: invCounts.interview },
    { id: "message" as const, label: "Pesan Masuk", count: invCounts.message },
    { id: "saved" as const, label: "Profil Disimpan", count: invCounts.saved },
    { id: "viewed" as const, label: "Profil Dilihat", count: invCounts.viewed },
  ];

  const copyMeetLink = (url: string) => {
    void navigator.clipboard.writeText(url);
    toast.success("Tautan meeting disalin ke papan klip!");
  };

  const handleActionClick = (activityId: string) => {
    const updated = markCandidateActivityAsRead(activityId);
    setActivities(updated);
  };

  return (
    <ProtectedRoute role="candidate">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Lamaran & Minat Rekruter
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pantau posisi yang Anda lamar dan seluruh riwayat minat maupun undangan masuk dari tim rekruter.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link href="/jobs">
                <Briefcase className="size-3.5 mr-1.5" />
                Cari Lowongan
              </Link>
            </Button>
            <Button asChild size="sm" className="text-xs font-semibold">
              <Link href="/candidate/cv">
                Perbarui CV
              </Link>
            </Button>
          </div>
        </div>

        {!dbMode && (
          <p className="rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-2 text-xs text-amber-900">
            Mode demo: data lamaran dan aktivitas rekruter tersimpan di browser ini.
          </p>
        )}

        {/* Top-Level Segmented Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 p-1 sm:w-fit">
          <button
            type="button"
            onClick={() => setMainTab("applications")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              mainTab === "applications"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase className="size-4" />
            <span>Lamaran Saya</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                mainTab === "applications"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {appCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab("invitations")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              mainTab === "invitations"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarClock className="size-4" />
            <span>Undangan & Aktivitas Recruiter</span>
            {unreadInvitations > 0 && (
              <span className="size-2 rounded-full bg-primary animate-pulse" title={`${unreadInvitations} aktivitas baru`} />
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                mainTab === "invitations"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {invCounts.all}
            </span>
          </button>
        </div>

        {/* TAB 1: LAMARAN SAYA */}
        {mainTab === "applications" && (
          <div className="space-y-4">
            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2">
              {appChips.map((chip) => {
                const isActive = appFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setAppFilter(chip.id);
                      setAppPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                        : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                        isActive ? "bg-white/20 text-white" : "bg-muted text-foreground"
                      }`}
                    >
                      {chip.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Application Cards List */}
            {appsLoading ? (
              <div className="grid gap-3.5">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-border/80 bg-card shadow-xs">
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <Skeleton className="h-8 w-20 rounded-md" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="space-y-3">
                <State text={error} error />
                <Button variant="outline" onClick={retry}>Coba lagi</Button>
              </div>
            ) : applications.length === 0 ? (
              <Card className="border-dashed border-border bg-card/60 p-8 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                  <Briefcase className="size-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">Belum Ada Lamaran</h3>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  Profil profesional Anda siap digunakan untuk melamar lowongan kerja terverifikasi di ProofyLink.
                </p>
                <Button asChild className="mt-4 text-xs font-semibold" size="sm">
                  <Link href="/jobs">
                    Eksplorasi Lowongan Kerja
                    <ArrowRight className="size-3.5 ml-1.5" />
                  </Link>
                </Button>
              </Card>
            ) : filteredApps.length === 0 ? (
              <div className="rounded-xl border border-border/80 bg-card p-8 text-center text-sm text-muted-foreground">
                Tidak ada lamaran pada filter ini.
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="grid gap-3.5">
                  {paginatedApps.map((application) => (
                    <Link key={application.id} href={`/candidate/applications/${application.id}`} className="block group">
                      <Card className="border-border/80 bg-card transition-all group-hover:border-primary/40 group-hover:shadow-xs">
                        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                                {application.job?.title ?? "Posisi Lamaran"}
                              </h2>
                            </div>
                            <p className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                              <Building2 className="size-3.5 shrink-0" />
                              <span className="font-medium text-foreground">{application.job?.organizationName ?? "Perusahaan Mitra"}</span>
                              <span aria-hidden="true" className="text-border">•</span>
                              <span>Dikirim {formatDate(application.submittedAt)}</span>
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end shrink-0">
                            {statusBadge(application.status)}
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                              Detail
                              <ArrowRight className="size-3.5" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination Controls */}
                <PaginationControls
                  currentPage={appPage}
                  totalPages={totalAppPages}
                  totalItems={filteredApps.length}
                  pageSize={ITEMS_PER_PAGE}
                  itemLabel="lamaran"
                  onPageChange={setAppPage}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: UNDANGAN & AKTIVITAS RECRUITER */}
        {mainTab === "invitations" && (
          <div className="space-y-4">
            {/* Filter Chips for Inbound Interactions */}
            <div className="flex flex-wrap gap-2">
              {invChips.map((chip) => {
                const isActive = invFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setInvFilter(chip.id);
                      setInvPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                        : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                        isActive ? "bg-white/20 text-white" : "bg-muted text-foreground"
                      }`}
                    >
                      {chip.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Invitations List */}
            {activitiesLoading ? (
              <div className="grid gap-3.5">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-border/80 bg-card p-5">
                    <div className="flex items-start gap-4">
                      <Skeleton className="size-10 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredInvs.length === 0 ? (
              <Card className="border-dashed border-border bg-card/60 p-8 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                  <Sparkles className="size-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">Belum Ada Aktivitas pada Kategori Ini</h3>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  Tingkatkan kelengkapan portofolio dan CV Anda agar profil Anda lebih sering muncul di pencarian bakat terverifikasi rekruter.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4 text-xs font-semibold">
                  <Link href="/candidate/cv">
                    Tinjau Kesiapan Profil & CV
                  </Link>
                </Button>
              </Card>
            ) : (
              <div className="space-y-3.5">
                <div className="grid gap-3.5">
                  {paginatedInvs.map((activity) => {
                    const isInterview = activity.type === "interview_invited";
                    const isMessage = activity.type === "message_received";
                    const isAssessment = activity.type === "assessment_invited";
                    const isSaved = activity.type === "profile_saved";
                    const isViewed = activity.type === "profile_viewed";

                    return (
                      <Card
                        key={activity.id}
                        className={`border bg-card transition-all ${
                          isInterview
                            ? "border-primary/30 hover:border-primary/60 shadow-xs"
                            : isAssessment
                            ? "border-emerald-200 hover:border-emerald-300"
                            : isMessage
                            ? "border-blue-200/80 hover:border-blue-300"
                            : "border-border/80 hover:border-border"
                        }`}
                      >
                        <CardContent className="p-5">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            {/* Main Information */}
                            <div className="flex items-start gap-3.5 min-w-0 flex-1">
                              {/* Company Avatar / Badge */}
                              <div
                                className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                  isInterview
                                    ? "bg-primary/10 text-primary"
                                    : isAssessment
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : isMessage
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : isSaved
                                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                                    : "bg-muted text-muted-foreground border border-border"
                                }`}
                              >
                                {activity.companyInitial}
                              </div>

                              <div className="min-w-0 flex-1 space-y-1">
                                {/* Header Meta */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-sm text-foreground">
                                    {activity.companyName}
                                  </span>
                                  <span aria-hidden="true" className="text-border">•</span>
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {formatDate(activity.createdAt)}
                                  </span>

                                  {/* Distinct Status Badge */}
                                  {isInterview && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[11px] font-semibold">
                                      <Calendar className="size-3" /> Undangan Wawancara
                                    </span>
                                  )}
                                  {isMessage && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold">
                                      <MessageSquare className="size-3" /> Pesan Rekruter
                                    </span>
                                  )}
                                  {isAssessment && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold">
                                      <FileQuestion className="size-3" /> Undangan Asesmen
                                    </span>
                                  )}
                                  {isSaved && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[11px] font-medium">
                                      <Bookmark className="size-3" /> Disimpan ke Shortlist
                                    </span>
                                  )}
                                  {isViewed && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground border border-border px-2 py-0.5 text-[11px] font-medium">
                                      <Eye className="size-3" /> Profil Dilihat
                                    </span>
                                  )}
                                </div>

                                {/* Title / Target Role */}
                                <h3 className="text-sm font-semibold text-foreground">
                                  {activity.title}
                                </h3>

                                {activity.targetRole && (
                                  <p className="text-xs text-muted-foreground">
                                    Posisi terkait: <span className="font-medium text-foreground">{activity.targetRole}</span>
                                  </p>
                                )}

                                {/* Recruiter Identity when relevant */}
                                {(isMessage || isInterview) && (
                                  <p className="text-xs text-muted-foreground">
                                    Dari: <span className="font-medium text-foreground">{activity.recruiterName}</span> ({activity.recruiterRole})
                                  </p>
                                )}

                                {/* Excerpt / Agenda Snippet */}
                                {activity.snippet && (
                                  <div className={`mt-2 rounded-lg p-3 text-xs leading-relaxed ${
                                    isMessage
                                      ? "bg-blue-50/50 border border-blue-100 text-foreground italic"
                                      : "bg-muted/40 text-muted-foreground"
                                  }`}>
                                    {isMessage && <span className="font-semibold text-blue-700 not-italic mr-1.5">Pesan:</span>}
                                    {activity.snippet}
                                  </div>
                                )}

                                {/* Interview Specific Metadata Pill */}
                                {isInterview && activity.metadata?.scheduledAt && (
                                  <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-foreground bg-primary/5 rounded-lg border border-primary/10 px-3 py-2">
                                    <span className="flex items-center gap-1 font-semibold text-primary">
                                      <Clock3 className="size-3.5" />
                                      {new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(new Date(activity.metadata.scheduledAt))} WIB
                                    </span>
                                    <span aria-hidden="true" className="text-border">•</span>
                                    <span>Durasi {activity.metadata.durationMinutes ?? 45} Menit</span>
                                    <span aria-hidden="true" className="text-border">•</span>
                                    <span className="font-medium text-emerald-700">Online Google Meet</span>
                                  </div>
                                )}

                                {/* Profile View Transparency Note */}
                                {isViewed && (
                                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <ShieldCheck className="size-3 text-emerald-600 shrink-0" />
                                    <span>Sesuai Kebijakan Privasi, data finansial & dokumen sensitif Anda tidak dibuka tanpa persetujuan eksplisit.</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Interactive Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                              {isInterview && (
                                <>
                                  {activity.metadata?.meetingUrl && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="text-xs h-8"
                                      onClick={() => copyMeetLink(activity.metadata?.meetingUrl ?? "")}
                                    >
                                      <Copy className="size-3.5 mr-1" />
                                      Salin Link
                                    </Button>
                                  )}
                                  <Button
                                    asChild
                                    size="sm"
                                    className="text-xs font-semibold h-8"
                                    onClick={() => handleActionClick(activity.id)}
                                  >
                                    <Link href="/candidate/messages">
                                      Konfirmasi Jadwal
                                      <ArrowRight className="size-3.5 ml-1" />
                                    </Link>
                                  </Button>
                                </>
                              )}

                              {isMessage && (
                                <Button
                                  asChild
                                  size="sm"
                                  className="text-xs font-semibold h-8"
                                  onClick={() => handleActionClick(activity.id)}
                                >
                                  <Link href="/candidate/messages">
                                    <MessageSquare className="size-3.5 mr-1" />
                                    Balas Pesan
                                  </Link>
                                </Button>
                              )}

                              {isAssessment && (
                                <Button
                                  asChild
                                  size="sm"
                                  className="text-xs font-semibold h-8 bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => handleActionClick(activity.id)}
                                >
                                  <Link href={activity.actionUrl || `/candidate/assessments/demo-invitation-1`}>
                                    <FileQuestion className="size-3.5 mr-1" />
                                    Mulai Asesmen
                                  </Link>
                                </Button>
                              )}

                              {(isSaved || isViewed) && (
                                <span className="text-[11px] text-muted-foreground italic px-2 py-1 bg-muted/40 rounded-md">
                                  Tercatat otomatis
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                <PaginationControls
                  currentPage={invPage}
                  totalPages={totalInvPages}
                  totalItems={filteredInvs.length}
                  pageSize={ITEMS_PER_PAGE}
                  itemLabel="aktivitas"
                  onPageChange={setInvPage}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function getDemoApplicationHistory(app: Application): History[] {
  const baseTime = new Date(app.submittedAt).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  if (app.id === "demo-app-001") {
    return [
      {
        id: "hist-001-1",
        fromStatus: null,
        toStatus: "new",
        reason: "Berkas lamaran dan portofolio kandidat berhasil dikirim melalui platform ProofyLink.",
        changedBy: "Kandidat",
        createdAt: new Date(baseTime).toISOString(),
      },
      {
        id: "hist-001-2",
        fromStatus: "new",
        toStatus: "shortlisted",
        reason: "Profil dinilai cocok dengan kebutuhan posisi Senior Product Designer dan masuk dalam daftar unggulan.",
        changedBy: "Talent Acquisition",
        createdAt: new Date(baseTime + 1 * dayMs + 3600000).toISOString(),
      },
      {
        id: "hist-001-3",
        fromStatus: "shortlisted",
        toStatus: "screening",
        reason: "Pemeriksaan riwayat pengalaman desain dan verifikasi latar belakang profesional.",
        changedBy: "Senior Recruiter",
        createdAt: new Date(baseTime + 1 * dayMs + 7 * 3600000).toISOString(),
      },
      {
        id: "hist-001-4",
        fromStatus: "screening",
        toStatus: "assessment",
        reason: "Kandidat diundang mengikuti studi kasus interaktif: Redesign Checkout Flow & Design System.",
        changedBy: "Hiring Team",
        createdAt: new Date(baseTime + 2 * dayMs + 2 * 3600000).toISOString(),
      },
      {
        id: "hist-001-5",
        fromStatus: "assessment",
        toStatus: "review",
        reason: "Penyelesaian asesmen desain diterima dan mendapatkan skor kompetensi 94 / 100.",
        changedBy: "Design Evaluator",
        createdAt: new Date(baseTime + 3 * dayMs + 8 * 3600000).toISOString(),
      },
      {
        id: "hist-001-6",
        fromStatus: "review",
        toStatus: "interview",
        reason: "Hasil asesmen memuaskan. Undangan sesi wawancara mendalam dijadwalkan bersama Tim Desain & Manajerial.",
        changedBy: "Head of Product Design",
        createdAt: new Date(baseTime + 4 * dayMs + 1 * 3600000).toISOString(),
      },
    ];
  }

  if (app.id === "demo-app-002") {
    return [
      {
        id: "hist-002-1",
        fromStatus: null,
        toStatus: "new",
        reason: "Lamaran terkirim untuk lowongan Lead UX Researcher.",
        changedBy: "Kandidat",
        createdAt: new Date(baseTime).toISOString(),
      },
      {
        id: "hist-002-2",
        fromStatus: "new",
        toStatus: "shortlisted",
        reason: "Profil memenuhi kualifikasi riset perbankan digital.",
        changedBy: "HR Recruiter",
        createdAt: new Date(baseTime + 1 * dayMs).toISOString(),
      },
      {
        id: "hist-002-3",
        fromStatus: "shortlisted",
        toStatus: "screening",
        reason: "Verifikasi metodologi riset dan portofolio usability testing.",
        changedBy: "Talent Acquisition",
        createdAt: new Date(baseTime + 2 * dayMs).toISOString(),
      },
      {
        id: "hist-002-4",
        fromStatus: "screening",
        toStatus: "assessment",
        reason: "Undangan studi kasus User Research Methodology telah dikirimkan ke email kandidat.",
        changedBy: "Lead Researcher",
        createdAt: new Date(baseTime + 3 * dayMs).toISOString(),
      },
    ];
  }

  if (app.id === "demo-app-003") {
    return [
      {
        id: "hist-003-1",
        fromStatus: null,
        toStatus: "new",
        reason: "Berkas lamaran terkirim ke tim rekruter PT Telkom Indonesia.",
        changedBy: "Kandidat",
        createdAt: new Date(baseTime).toISOString(),
      },
      {
        id: "hist-003-2",
        fromStatus: "new",
        toStatus: "shortlisted",
        reason: "Keahlian design system multi-brand sesuai kebutuhan produk.",
        changedBy: "Recruiter",
        createdAt: new Date(baseTime + 1 * dayMs).toISOString(),
      },
      {
        id: "hist-003-3",
        fromStatus: "shortlisted",
        toStatus: "assessment",
        reason: "Tes teknis pembuatan token Figma dan komponen React diberikan.",
        changedBy: "Hiring Manager",
        createdAt: new Date(baseTime + 2 * dayMs).toISOString(),
      },
      {
        id: "hist-003-4",
        fromStatus: "assessment",
        toStatus: "review",
        reason: "Submission kode komponen dan dokumentasi token sedang dalam evaluasi tim teknis.",
        changedBy: "Engineering Lead",
        createdAt: new Date(baseTime + 3 * dayMs).toISOString(),
      },
    ];
  }

  return [
    {
      id: `${app.id}-h1`,
      fromStatus: null,
      toStatus: "new",
      reason: "Lamaran berhasil dikirim dan terdaftar pada sistem ProofyLink.",
      changedBy: "Kandidat",
      createdAt: app.submittedAt,
    },
    ...(app.status !== "new"
      ? [
          {
            id: `${app.id}-h2`,
            fromStatus: "new" as const,
            toStatus: app.status,
            reason: `Perkembangan tahap seleksi diperbarui menjadi ${labels[app.status]}.`,
            changedBy: "Tim Rekruter",
            createdAt: app.updatedAt || new Date().toISOString(),
          },
        ]
      : []),
  ];
}

export function CandidateApplicationDetailPage({ applicationId }: { applicationId: string }) {
  const { dbMode } = useApp();
  const [application, setApplication] = useState<Application | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // History pagination / collapse state
  const [showAllHistory, setShowAllHistory] = useState(false);
  const INITIAL_HISTORY_LIMIT = 3;

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const timeB = new Date(b.createdAt).getTime();
      const timeA = new Date(a.createdAt).getTime();
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
  }, [history]);

  const visibleHistory = useMemo(() => {
    if (showAllHistory) return sortedHistory;
    return sortedHistory.slice(0, INITIAL_HISTORY_LIMIT);
  }, [sortedHistory, showAllHistory]);

  // Hiring Flow: Interviews & Offers
  const [interviews, setInterviews] = useState<Array<{ id: string; title: string; scheduledAt: string; timezone: string; durationMinutes: number; meetingUrl: string | null; status: string }>>([]);
  const [offers, setOffers] = useState<Array<{ id: string; salary: number; currency: string; startDate: string; expirationDate: string; benefits: string | null; notes: string | null; status: string }>>([]);
  const [actingOfferId, setActingOfferId] = useState<string | null>(null);
  const [offerNotice, setOfferNotice] = useState<string | null>(null);
  const [currentTimestamp] = useState(() => Date.now());
  const activeOffer = offers.length > 0 ? offers[offers.length - 1] : null;

  useEffect(() => {
    if (!dbMode) {
      const item = demoApplications().find((candidateApplication) => candidateApplication.id === applicationId) ?? null;
      setApplication(item);
      if (item) {
        setHistory(getDemoApplicationHistory(item));
        if (item.status === "interview") {
          setInterviews([
            {
              id: `demo-int-${item.id}`,
              title: `Wawancara Teknis & User: ${item.job?.title ?? "Product Design"}`,
              scheduledAt: "2026-09-24T14:00:00.000Z",
              timezone: "WIB (UTC+7)",
              durationMinutes: 45,
              meetingUrl: "https://meet.google.com/xyz-demo-link",
              status: "scheduled",
            },
          ]);
        } else {
          setInterviews([]);
        }
        if (item.status === "offer" || item.status === "hired") {
          setOffers([
            {
              id: `demo-off-${item.id}`,
              salary: 24000000,
              currency: "IDR",
              startDate: "2026-10-01T09:00:00.000Z",
              expirationDate: "2026-09-28T23:59:59.000Z",
              benefits: "BPJS Kesehatan & Ketenagakerjaan, Asuransi Swasta, Wellness Allowance, Tunjangan Perangkat Kerja",
              notes: "Kami sangat terkesan dengan kualifikasi dan portofolio Anda. Selamat bergabung bersama tim kami!",
              status: item.status === "hired" ? "accepted" : "pending",
            },
          ]);
        } else {
          setOffers([]);
        }
      } else {
        setHistory([]);
        setInterviews([]);
        setOffers([]);
      }
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`/api/applications/${applicationId}`, { cache: "no-store" }),
      fetch(`/api/interviews?applicationId=${applicationId}`, { cache: "no-store" }),
      fetch(`/api/offers?applicationId=${applicationId}`, { cache: "no-store" }),
    ])
      .then(async ([appRes, intRes, offRes]) => {
        const appData = (await appRes.json()) as { application?: Application; history?: History[]; error?: string };
        if (!appRes.ok || !appData.application) throw new Error(appData.error ?? "Aplikasi tidak ditemukan.");
        setApplication(appData.application);
        setHistory(appData.history ?? []);

        if (intRes.ok) {
          const intData = (await intRes.json()) as { interviews?: typeof interviews };
          setInterviews(intData.interviews ?? []);
        }
        if (offRes.ok) {
          const offData = (await offRes.json()) as { offers?: typeof offers };
          setOffers(offData.offers ?? []);
        }
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Aplikasi tidak ditemukan."))
      .finally(() => setLoading(false));
  }, [applicationId, dbMode]);

  const withdraw = async () => {
    if (!application) return;
    setSaving(true);
    setError(null);
    try {
      if (dbMode) {
        const response = await fetch(`/api/applications/${application.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "withdrawn" }),
        });
        const payload = (await response.json()) as { application?: Application; error?: string };
        if (!response.ok || !payload.application) throw new Error(payload.error ?? "Lamaran belum dapat ditarik.");
        setApplication((current) => (current ? { ...current, ...payload.application } : current));
      } else {
        const next = { ...application, status: "withdrawn" as const, withdrawnAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        saveDemoApplication(next);
        setApplication(next);
        setHistory((current) => [...current, { id: `${next.id}-${Date.now()}`, fromStatus: application.status, toStatus: "withdrawn", reason: "Lamaran ditarik kandidat.", changedBy: "demo", createdAt: next.updatedAt }]);
      }
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Lamaran belum dapat ditarik.");
    } finally {
      setSaving(false);
    }
  };

  // Two-way interaction states
  const [negotiationOpen, setNegotiationOpen] = useState(false);
  const [negotiationMsg, setNegotiationMsg] = useState("");
  const [submittingNegotiation, setSubmittingNegotiation] = useState(false);

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleTargetId, setRescheduleTargetId] = useState<string | null>(null);
  const [rescheduleProposedDate, setRescheduleProposedDate] = useState(() => {
    const d = new Date(Date.now() + 3 * 86400000);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  const [declineInterviewOpen, setDeclineInterviewOpen] = useState(false);
  const [declineTargetInterviewId, setDeclineTargetInterviewId] = useState<string | null>(null);
  const [declineInterviewReason, setDeclineInterviewReason] = useState("");

  const handleOfferAction = useCallback(
    async (
      offerId: string,
      status: "accepted" | "declined" | "in_negotiation",
      negotiationText?: string
    ) => {
      setActingOfferId(offerId);
      setOfferNotice(null);
      try {
        if (dbMode) {
          const res = await fetch(`/api/offers/${offerId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: status === "in_negotiation" ? "pending" : status,
              notes: negotiationText,
            }),
          });
          const data = (await res.json()) as { error?: string };
          if (!res.ok) throw new Error(data.error ?? "Gagal memproses keputusan penawaran.");
        }

        setOffers((prev) =>
          prev.map((o) =>
            o.id === offerId
              ? {
                  ...o,
                  status,
                  notes: negotiationText ? `Pesan Negosiasi Anda: "${negotiationText}"` : o.notes,
                }
              : o
          )
        );

        const now = new Date().toISOString();

        if (status === "accepted") {
          setApplication((prev) => (prev ? { ...prev, status: "hired", updatedAt: now } : prev));
          setOfferNotice("Penawaran resmi diterima — status lamaran menjadi Hired!");
          toast.success("Selamat! Anda resmi menerima penawaran kerja.");

          // Sync with demo recruiter operations
          try {
            const opsKey = "proofylink-demo-recruiter-operations";
            const opsRaw = localStorage.getItem(opsKey);
            if (opsRaw) {
              const opsParsed = JSON.parse(opsRaw);
              if (opsParsed && Array.isArray(opsParsed.candidates)) {
                const candIdx = opsParsed.candidates.findIndex(
                  (c: { id: string; name?: string }) =>
                    c.id === application?.candidate?.name ||
                    c.name === application?.candidate?.name ||
                    c.id.includes("candidate")
                );
                if (candIdx >= 0) {
                  opsParsed.candidates[candIdx].stage = "hired";
                  opsParsed.candidates[candIdx].offerStatus = "accepted";
                  opsParsed.candidates[candIdx].statusHistory = [
                    ...(opsParsed.candidates[candIdx].statusHistory || []),
                    {
                      id: `hist-offer-accepted-${now}`,
                      stage: "hired",
                      title: "Penawaran Kerja Diterima (Hired)",
                      actionType: "candidate",
                      timestamp: now,
                      actor: application?.candidate?.name || "Kandidat",
                      actorRole: "Candidate",
                      notes: "Kandidat telah menyetujui surat penawaran kerja.",
                    },
                  ];
                  localStorage.setItem(opsKey, JSON.stringify(opsParsed));
                }
              }
            }
          } catch {
            // ignore
          }
        } else if (status === "declined") {
          setApplication((prev) => (prev ? { ...prev, status: "offer_declined", updatedAt: now } : prev));
          setOfferNotice("Penawaran telah ditolak.");
          toast.info("Anda telah menolak surat penawaran kerja.");

          // Sync with demo recruiter operations
          try {
            const opsKey = "proofylink-demo-recruiter-operations";
            const opsRaw = localStorage.getItem(opsKey);
            if (opsRaw) {
              const opsParsed = JSON.parse(opsRaw);
              if (opsParsed && Array.isArray(opsParsed.candidates)) {
                const candIdx = opsParsed.candidates.findIndex(
                  (c: { id: string; name?: string }) =>
                    c.id === application?.candidate?.name ||
                    c.name === application?.candidate?.name ||
                    c.id.includes("candidate")
                );
                if (candIdx >= 0) {
                  opsParsed.candidates[candIdx].offerStatus = "declined";
                  opsParsed.candidates[candIdx].stage = "rejected";
                  opsParsed.candidates[candIdx].statusHistory = [
                    ...(opsParsed.candidates[candIdx].statusHistory || []),
                    {
                      id: `hist-offer-declined-${now}`,
                      stage: "rejected",
                      title: "Penawaran Kerja Ditolak Kandidat",
                      actionType: "candidate",
                      timestamp: now,
                      actor: application?.candidate?.name || "Kandidat",
                      actorRole: "Candidate",
                      notes: "Kandidat menolak surat penawaran kerja.",
                    },
                  ];
                  localStorage.setItem(opsKey, JSON.stringify(opsParsed));
                }
              }
            }
          } catch {
            // ignore
          }
        } else if (status === "in_negotiation") {
          setOfferNotice("Pesan negosiasi telah terkirim ke tim rekruter. Menunggu tanggapan.");
          toast.success("Pesan negosiasi berhasil dikirim ke rekruter!");

          // Sync with demo recruiter operations
          try {
            const opsKey = "proofylink-demo-recruiter-operations";
            const opsRaw = localStorage.getItem(opsKey);
            if (opsRaw) {
              const opsParsed = JSON.parse(opsRaw);
              if (opsParsed && Array.isArray(opsParsed.candidates)) {
                const candIdx = opsParsed.candidates.findIndex(
                  (c: { id: string; name?: string }) =>
                    c.id === application?.candidate?.name ||
                    c.name === application?.candidate?.name ||
                    c.id.includes("candidate")
                );
                if (candIdx >= 0) {
                  opsParsed.candidates[candIdx].offerStatus = "negotiating";
                  opsParsed.candidates[candIdx].statusHistory = [
                    ...(opsParsed.candidates[candIdx].statusHistory || []),
                    {
                      id: `hist-offer-neg-${now}`,
                      stage: "offer",
                      title: "Pesan Negosiasi dari Kandidat",
                      actionType: "candidate",
                      timestamp: now,
                      actor: application?.candidate?.name || "Kandidat",
                      actorRole: "Candidate",
                      notes: `Catatan negosiasi: "${negotiationText}"`,
                    },
                  ];
                  localStorage.setItem(opsKey, JSON.stringify(opsParsed));
                }
              }
            }
          } catch {
            // ignore
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
        setOfferNotice(message);
        toast.error(message);
      } finally {
        setActingOfferId(null);
      }
    },
    [application, dbMode]
  );

  const handleConfirmInterview = useCallback(
    async (interviewId: string) => {
      try {
        if (dbMode) {
          const res = await fetch(`/api/interviews/${interviewId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "confirm", status: "confirmed" }),
          });
          const data = (await res.json()) as { error?: string };
          if (!res.ok) throw new Error(data.error ?? "Gagal mengonfirmasi kehadiran.");
        }

        setInterviews((prev) =>
          prev.map((i) => (i.id === interviewId ? { ...i, status: "confirmed" } : i))
        );
        toast.success("Kehadiran wawancara berhasil dikonfirmasi!");

        // Sync with demo recruiter operations
        try {
          const opsKey = "proofylink-demo-recruiter-operations";
          const opsRaw = localStorage.getItem(opsKey);
          if (opsRaw) {
            const opsParsed = JSON.parse(opsRaw);
            if (opsParsed && Array.isArray(opsParsed.interviews)) {
              const ivIdx = opsParsed.interviews.findIndex((i: { id: string }) => i.id === interviewId);
              if (ivIdx >= 0) {
                opsParsed.interviews[ivIdx].status = "Terjadwal (Terkonfirmasi)";
              }
            }
            if (opsParsed && Array.isArray(opsParsed.candidates)) {
              const cand = opsParsed.candidates.find(
                (c: { id: string; name?: string }) =>
                  c.id === application?.candidateProfileId ||
                  c.name === application?.candidate?.name ||
                  c.id === "candidate-adrienne" ||
                  c.name === "Adrienne Kayana Wistara Lie"
              ) || opsParsed.candidates[0];
              if (cand) {
                const now = new Date().toISOString();
                cand.statusHistory = [
                  ...(cand.statusHistory || []),
                  {
                    id: `hist-iv-confirmed-${now}`,
                    stage: "interview",
                    title: "Wawancara Terkonfirmasi Hadir",
                    actionType: "candidate",
                    timestamp: now,
                    actor: application?.candidate?.name || "Kandidat",
                    actorRole: "Candidate",
                    notes: "Kandidat telah mengonfirmasi kehadiran untuk sesi wawancara.",
                  },
                ];
              }
            }
            localStorage.setItem(opsKey, JSON.stringify(opsParsed));
          }
        } catch {
          // ignore
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Gagal mengonfirmasi kehadiran.");
      }
    },
    [application, dbMode]
  );

  const handleRescheduleSubmit = useCallback(async () => {
    if (!rescheduleTargetId) return;
    setSubmittingReschedule(true);
    try {
      if (dbMode) {
        const res = await fetch(`/api/interviews/${rescheduleTargetId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reschedule",
            status: "reschedule_requested",
            rescheduleProposedDate,
            rescheduleReason,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Gagal mengajukan permintaan reschedule.");
      }

      const resolvedNewDate =
        rescheduleProposedDate && !isNaN(new Date(rescheduleProposedDate).getTime())
          ? new Date(rescheduleProposedDate).toISOString()
          : undefined;

      setInterviews((prev) =>
        prev.map((i) =>
          i.id === rescheduleTargetId
            ? {
                ...i,
                status: "reschedule_requested",
                scheduledAt: resolvedNewDate || i.scheduledAt,
                rescheduleMetadata: {
                  proposedDate: rescheduleProposedDate,
                  reason: rescheduleReason,
                },
              }
            : i
        )
      );
      toast.success("Permintaan reschedule berhasil diajukan dan jadwal diperbarui!");

      // Sync with demo recruiter operations
      try {
        const opsKey = "proofylink-demo-recruiter-operations";
        const opsRaw = localStorage.getItem(opsKey);
        if (opsRaw) {
          const opsParsed = JSON.parse(opsRaw);
          if (opsParsed && Array.isArray(opsParsed.interviews)) {
            const ivIdx = opsParsed.interviews.findIndex((i: { id: string }) => i.id === rescheduleTargetId);
            if (ivIdx >= 0) {
              opsParsed.interviews[ivIdx].status = "Permintaan Reschedule";
              if (resolvedNewDate) {
                opsParsed.interviews[ivIdx].date = resolvedNewDate;
              }
              opsParsed.interviews[ivIdx].rescheduleProposedDate = rescheduleProposedDate;
              opsParsed.interviews[ivIdx].rescheduleReason = rescheduleReason;
            }
          }
          if (opsParsed && Array.isArray(opsParsed.candidates)) {
            const cand = opsParsed.candidates.find(
              (c: { id: string; name?: string }) =>
                c.id === application?.candidateProfileId ||
                c.name === application?.candidate?.name ||
                c.id === "candidate-adrienne" ||
                c.name === "Adrienne Kayana Wistara Lie"
            ) || opsParsed.candidates[0];
            if (cand) {
              const now = new Date().toISOString();
              cand.statusHistory = [
                ...(cand.statusHistory || []),
                {
                  id: `hist-iv-reschedule-${now}`,
                  stage: "interview",
                  title: "Permintaan Reschedule Wawancara",
                  actionType: "candidate",
                  timestamp: now,
                  actor: application?.candidate?.name || "Kandidat",
                  actorRole: "Candidate",
                  notes: `Kandidat mengusulkan jadwal baru: ${rescheduleProposedDate}. Alasan: ${rescheduleReason || "Tidak ada alasan spesifik."}`,
                },
              ];
            }
          }
          localStorage.setItem(opsKey, JSON.stringify(opsParsed));
        }
      } catch {
        // ignore
      }
      setRescheduleOpen(false);
      setRescheduleReason("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengajukan permintaan reschedule.");
    } finally {
      setSubmittingReschedule(false);
    }
  }, [application, dbMode, rescheduleProposedDate, rescheduleReason, rescheduleTargetId]);

  const handleDeclineInterviewSubmit = useCallback(async () => {
    if (!declineTargetInterviewId) return;
    try {
      if (dbMode) {
        const res = await fetch(`/api/interviews/${declineTargetInterviewId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "decline",
            status: "declined",
            declineReason: declineInterviewReason,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Gagal menolak sesi wawancara.");
      }

      setInterviews((prev) =>
        prev.map((i) =>
          i.id === declineTargetInterviewId
            ? {
                ...i,
                status: "declined",
                cancellationMetadata: {
                  reason: declineInterviewReason,
                },
              }
            : i
        )
      );
      toast.info("Jadwal sesi wawancara ini ditolak. Lamaran Anda tetap aktif.");

      // Sync with demo recruiter operations
      try {
        const opsKey = "proofylink-demo-recruiter-operations";
        const opsRaw = localStorage.getItem(opsKey);
        if (opsRaw) {
          const opsParsed = JSON.parse(opsRaw);
          if (opsParsed && Array.isArray(opsParsed.interviews)) {
            const ivIdx = opsParsed.interviews.findIndex((i: { id: string }) => i.id === declineTargetInterviewId);
            if (ivIdx >= 0) {
              opsParsed.interviews[ivIdx].status = "Ditolak Kandidat";
              opsParsed.interviews[ivIdx].declineReason = declineInterviewReason;
            }
          }
          if (opsParsed && Array.isArray(opsParsed.candidates)) {
            const cand = opsParsed.candidates.find(
              (c: { id: string; name?: string }) =>
                c.id === application?.candidateProfileId ||
                c.name === application?.candidate?.name ||
                c.id === "candidate-adrienne" ||
                c.name === "Adrienne Kayana Wistara Lie"
            ) || opsParsed.candidates[0];
            if (cand) {
              const now = new Date().toISOString();
              cand.statusHistory = [
                ...(cand.statusHistory || []),
                {
                  id: `hist-iv-declined-${now}`,
                  stage: "interview",
                  title: "Sesi Wawancara Ditolak Kandidat",
                  actionType: "candidate",
                  timestamp: now,
                  actor: application?.candidate?.name || "Kandidat",
                  actorRole: "Candidate",
                  notes: `Kandidat tidak dapat menghadiri sesi ini (${declineInterviewReason || "Jadwal bentrok"}). Lamaran tetap aktif.`,
                },
              ];
            }
          }
          localStorage.setItem(opsKey, JSON.stringify(opsParsed));
        }
      } catch {
        // ignore
      }
      setDeclineInterviewOpen(false);
      setDeclineInterviewReason("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui status wawancara.");
    }
  }, [application, dbMode, declineInterviewReason, declineTargetInterviewId]);

  // Modern human-centric pipeline milestones for candidate visualization
  const PIPELINE_PHASES = [
    {
      key: "review",
      label: "Peninjauan Berkas",
      desc: "Profil & portofolio ditinjau oleh tim rekruter",
      statuses: ["new", "shortlisted", "screening", "review", "assessment"],
    },
    {
      key: "interview",
      label: "Sesi Wawancara",
      desc: "Diskusi kompetensi peran dan keselarasan tim",
      statuses: ["interview"],
    },
    {
      key: "offer",
      label: "Surat Penawaran",
      desc: "Pembahasan rincian kompensasi & kesepakatan",
      statuses: ["offer"],
    },
    {
      key: "decision",
      label: "Keputusan Akhir",
      desc: "Hasil akhir proses seleksi resmi",
      statuses: ["hired", "rejected", "offer_declined", "withdrawn"],
    },
  ];

  const currentPhaseIndex = useMemo(() => {
    if (!application) return 0;
    if (["hired", "rejected", "offer_declined", "withdrawn"].includes(application.status)) return 3;
    if (application.status === "offer") return 2;
    if (application.status === "interview") return 1;
    return 0;
  }, [application]);

  return (
    <ProtectedRoute role="candidate">
      <div className="space-y-6">
        <div>
          <Link
            href="/candidate/applications"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" /> Kembali ke Daftar Lamaran
          </Link>
        </div>

        {loading ? (
          <div className="space-y-6">
            {/* Top Summary Banner Skeleton */}
            <Card className="border-border/80 bg-card shadow-xs">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-7 w-64" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-28 rounded-md" />
                </div>
              </CardContent>
            </Card>

            {/* Pipeline Stepper Skeleton */}
            <Card className="border-border/80 bg-card shadow-xs p-5 sm:p-6 space-y-4">
              <Skeleton className="h-4 w-44" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="space-y-2 rounded-xl border border-border/60 p-3">
                    <Skeleton className="size-6 rounded-full" />
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Detail Content Grid Skeleton */}
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <Card className="border-border/80 bg-card shadow-xs p-6 space-y-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
              </Card>
              <Card className="border-border/80 bg-card shadow-xs p-6 space-y-4">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </Card>
            </div>
          </div>
        ) : error || !application ? (
          <div className="space-y-4 py-8">
            <State text={error ?? "Aplikasi tidak ditemukan."} error />
            <Button asChild variant="outline" size="sm">
              <Link href="/candidate/applications">Kembali ke Daftar Lamaran</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Summary Banner */}
            <Card className="border-border/80 bg-card shadow-xs">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        {application.job?.title ?? "Posisi Lamaran"}
                      </h1>
                      {statusBadge(application.status)}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs sm:text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <Building2 className="size-3.5" /> {application.job?.organizationName ?? "Perusahaan Mitra"}
                      </span>
                      <span aria-hidden="true" className="text-border">•</span>
                      <span>Dikirim pada {formatDate(application.submittedAt)}</span>
                      {application.updatedAt && (
                        <>
                          <span aria-hidden="true" className="text-border">•</span>
                          <span>Diperbarui {formatDate(application.updatedAt)}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {canWithdraw(application.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => void withdraw()}
                        disabled={saving}
                      >
                        <X className="size-3.5 mr-1" />
                        {saving ? "Memproses..." : "Tarik Lamaran"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modern Candidate Journey Tracker */}
            <Card className="border-border/80 bg-card p-5 shadow-xs sm:p-6 overflow-hidden">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" /> Alur Proses Seleksi
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Perjalanan tahapan rekrutmen Anda bersama {application.job?.organizationName || "perusahaan mitra"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Status Terkini:</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${stageColors[application.status]}`}>
                      {labels[application.status]}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                  {PIPELINE_PHASES.map((phase, idx) => {
                    const isPassed = idx < currentPhaseIndex;
                    const isCurrent = idx === currentPhaseIndex;
                    return (
                      <div
                        key={phase.key}
                        aria-current={isCurrent ? "step" : undefined}
                        className={`relative flex flex-col rounded-xl border p-4 transition-all ${
                          isCurrent
                            ? "border-primary/50 bg-primary/5 shadow-2xs ring-1 ring-primary/20"
                            : isPassed
                            ? "border-emerald-200/80 bg-emerald-50/20 dark:border-emerald-900/40"
                            : "border-border/50 bg-muted/10 opacity-70"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              isCurrent
                                ? "bg-primary text-primary-foreground shadow-xs animate-pulse"
                                : isPassed
                                ? "bg-emerald-600 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isPassed ? <Check className="size-3.5" /> : idx + 1}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-md">
                              Tahap Aktif
                            </span>
                          )}
                          {isPassed && (
                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                              Selesai
                            </span>
                          )}
                        </div>
                        <p className={`text-xs font-bold ${isCurrent ? "text-primary" : "text-foreground"}`}>
                          {phase.label}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                          {phase.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* 1-Panel Interactive Offer Hub */}
            {(() => {
              if (!activeOffer) return null;

              const isExpired =
                activeOffer.status === "pending" &&
                activeOffer.expirationDate &&
                !isNaN(new Date(activeOffer.expirationDate).getTime()) &&
                new Date(activeOffer.expirationDate).getTime() < currentTimestamp;

              return (
                <Card className="border-border/80 bg-card shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-border/70 bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-transparent pb-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shadow-2xs">
                          <Award className="size-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold text-foreground">
                            Surat Penawaran Kerja {offers.length > 1 ? `(Revisi v${offers.length})` : ""}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Diterbitkan resmi oleh {application.job?.organizationName || "Tim Rekruter"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                            activeOffer.status === "accepted"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : activeOffer.status === "declined"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : activeOffer.status === "in_negotiation"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : isExpired
                              ? "bg-slate-100 text-slate-700 border border-slate-300"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {activeOffer.status === "accepted"
                            ? "Diterima (Resmi Bergabung / Hired)"
                            : activeOffer.status === "declined"
                            ? "Ditolak (Offer Declined)"
                            : activeOffer.status === "in_negotiation"
                            ? "Dalam Diskusi / Negosiasi"
                            : isExpired
                            ? "Kedaluwarsa (Expired)"
                            : "Menunggu Keputusan Anda"}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 p-5 text-sm sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/20 p-4 shadow-2xs">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Kompensasi / Gaji Pokok
                        </p>
                        <p className="mt-1 font-bold text-xl text-foreground font-mono text-emerald-950 dark:text-emerald-300">
                          {activeOffer.currency} {Number(activeOffer.salary).toLocaleString("id-ID")}{" "}
                          <span className="text-xs font-normal text-muted-foreground font-sans">/ bulan</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Mulai Bekerja
                        </p>
                        <p className="mt-1 font-bold text-foreground">{formatDate(activeOffer.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Batas Konfirmasi Penawaran
                        </p>
                        <p className={`mt-1 font-bold ${isExpired ? "text-red-600" : "text-amber-700"}`}>
                          {activeOffer.expirationDate ? formatDate(activeOffer.expirationDate) : "Sesuai kesepakatan"}
                        </p>
                      </div>
                    </div>

                    {activeOffer.benefits && (
                      <div>
                        <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                          Fasilitas &amp; Tunjangan:
                        </p>
                        <p className="mt-1.5 whitespace-pre-wrap rounded-xl bg-card border border-border/80 p-3.5 text-xs text-foreground leading-relaxed">
                          {activeOffer.benefits}
                        </p>
                      </div>
                    )}

                    {activeOffer.notes && (
                      <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
                        <p className="text-xs font-bold text-foreground">Catatan / Sambutan Tim Rekruter:</p>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{activeOffer.notes}</p>
                      </div>
                    )}

                    {activeOffer.status === "in_negotiation" && (
                      <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="size-4 text-purple-700 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-purple-900">
                              Pesan Negosiasi Anda Sedang Ditinjau Tim Rekruter
                            </p>
                            <p className="text-xs text-purple-800/80 mt-0.5 leading-relaxed">
                              Rekruter akan meninjau pesan tanggapan Anda dan dapat menerbitkan pembaruan penawaran (v{offers.length + 1}) atau menghubungi Anda secara langsung.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {(activeOffer.status === "pending" || activeOffer.status === "in_negotiation") && !isExpired && (
                      <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-border/80">
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                          disabled={actingOfferId === activeOffer.id}
                          onClick={() => void handleOfferAction(activeOffer.id, "accepted")}
                        >
                          <Check className="mr-1.5 size-4" />
                          {actingOfferId === activeOffer.id ? "Memproses..." : "Terima Tawaran Kerja (Accept Offer)"}
                        </Button>

                        <Button
                          variant="outline"
                          className="border-purple-200 text-[#7C3AED] hover:bg-purple-50 text-xs font-semibold"
                          onClick={() => setNegotiationOpen(true)}
                        >
                          <MessageSquare className="mr-1.5 size-4" />
                          Beri Pesan / Ajukan Diskusi
                        </Button>

                        <Button
                          variant="outline"
                          className="text-xs text-red-700 border-red-200 hover:bg-red-50 ml-auto"
                          disabled={actingOfferId === activeOffer.id}
                          onClick={() => void handleOfferAction(activeOffer.id, "declined")}
                        >
                          Tolak Tawaran
                        </Button>
                      </div>
                    )}

                    {activeOffer.status === "accepted" && (
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 font-medium">
                        <Check className="size-4 text-emerald-600 shrink-0" />
                        <span>Selamat! Anda telah menerima penawaran ini. Tim rekruter akan segera mengarahkan ke proses Onboarding.</span>
                      </div>
                    )}

                    {offerNotice && <p role="status" className="text-xs text-muted-foreground mt-2">{offerNotice}</p>}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Scheduled Interviews Panel with Two-Way Actions */}
            {interviews.length > 0 && (
              <Card className="border-border/80 bg-card shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock3 className="size-4 text-primary" /> Jadwal Wawancara Anda
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {interviews.map((interview) => {
                    const isConfirmed = interview.status === "confirmed";
                    const isRescheduleRequested = interview.status === "reschedule_requested";
                    const isDeclined = interview.status === "declined";

                    return (
                      <div key={interview.id} className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-foreground text-sm">{interview.title}</p>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isConfirmed
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : isRescheduleRequested
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : isDeclined
                                    ? "bg-slate-100 text-slate-700 border border-slate-300"
                                    : "bg-purple-100 text-[#7C3AED] border border-purple-200"
                                }`}
                              >
                                {isConfirmed
                                  ? "Terkonfirmasi Hadir"
                                  : isRescheduleRequested
                                  ? "Menunggu Respon Reschedule"
                                  : isDeclined
                                  ? "Jadwal Sesi Ditolak"
                                  : "Menunggu Konfirmasi Kehadiran"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                              <Calendar className="size-3.5 text-muted-foreground" />
                              <span>
                                {formatDate(interview.scheduledAt)} ({interview.durationMinutes} menit) · {interview.timezone}
                              </span>
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-xs font-medium"
                              onClick={() => {
                                downloadIcsFile(
                                  {
                                    title: `Interview: ${interview.title} - ${application.job?.title || "Posisi"}`,
                                    description: `Wawancara dengan ${application.job?.organizationName || "Perusahaan"}.\nTautan meeting: ${interview.meetingUrl || "Google Meet"}`,
                                    location: interview.meetingUrl || "Google Meet",
                                    start: interview.scheduledAt,
                                    timezone: interview.timezone,
                                    organizerName: application.job?.organizationName || "Tim Rekruter",
                                  },
                                  `interview-${application.job?.title ? application.job.title.toLowerCase().replace(/\s+/g, "-") : "job"}.ics`
                                );
                              }}
                            >
                              <Calendar className="size-3.5" />
                              Simpan ke Kalender (.ics)
                            </Button>
                            {interview.meetingUrl && (
                              <Button size="sm" asChild className="text-xs font-semibold">
                                <a href={interview.meetingUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="size-3.5 mr-1" />
                                  Buka Ruang Temu
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Two-Way Actions for Candidate */}
                        {!isConfirmed && !isDeclined && (
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8"
                              onClick={() => void handleConfirmInterview(interview.id)}
                            >
                              <Check className="size-3.5 mr-1" /> Konfirmasi Hadir
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50 h-8"
                              onClick={() => {
                                setRescheduleTargetId(interview.id);
                                setRescheduleOpen(true);
                              }}
                            >
                              <CalendarClock className="size-3.5 mr-1 text-purple-600" /> Ajukan Reschedule
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700 h-8 ml-auto"
                              onClick={() => {
                                setDeclineTargetInterviewId(interview.id);
                                setDeclineInterviewOpen(true);
                              }}
                            >
                              Tolak Sesi Ini
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Stage History & Audit Log */}
            <Card className="border-border/80 bg-card shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      Riwayat &amp; Catatan Perkembangan Lamaran
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Kronologi pembaruan status lamaran (diurutkan dari yang terbaru).
                    </p>
                  </div>
                  {sortedHistory.length > 0 && (
                    <span className="text-xs font-mono text-muted-foreground tabular-nums bg-muted px-2 py-0.5 rounded-full w-fit">
                      {sortedHistory.length} catatan
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {sortedHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Belum ada riwayat tambahan — berkas lamaran telah diterima sistem.</p>
                ) : (
                  <>
                    <div className="space-y-3.5">
                      {visibleHistory.map((item, index) => {
                        const isLatest = index === 0;
                        return (
                          <div key={item.id} className="flex gap-3.5">
                            <div className="flex flex-col items-center">
                              <span
                                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                                  isLatest
                                    ? "bg-primary text-primary-foreground shadow-xs ring-4 ring-primary/10"
                                    : "bg-muted border border-border text-muted-foreground"
                                }`}
                              >
                                {isLatest ? <Check className="size-3.5" /> : <Clock3 className="size-3" />}
                              </span>
                              {index < visibleHistory.length - 1 && (
                                <span className="mt-1 h-full w-px bg-border/80 min-h-6" />
                              )}
                            </div>
                            <div className="flex-1 pb-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-foreground">
                                  {labels[item.toStatus]}
                                </span>
                                {isLatest && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.2 text-[10px] font-semibold">
                                    Tahap Terbaru
                                  </span>
                                )}
                                {item.changedBy && (
                                  <span className="text-[11px] text-muted-foreground">
                                    oleh <span className="font-medium text-foreground">{item.changedBy}</span>
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[11px] font-mono text-muted-foreground">
                                {formatDate(item.createdAt)}
                              </p>
                              {item.reason && (
                                <p className="mt-1.5 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5 leading-relaxed border border-border/50">
                                  {item.reason}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Expand / Shrink Toggle */}
                    {sortedHistory.length > INITIAL_HISTORY_LIMIT && (
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-border/70">
                        <button
                          type="button"
                          onClick={() => setShowAllHistory(!showAllHistory)}
                          className="group inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-primary/5 border border-primary/20 bg-card shadow-2xs w-fit"
                        >
                          {showAllHistory ? (
                            <>
                              <span>Tampilkan lebih sedikit</span>
                              <ChevronUp className="size-3.5 transition-transform group-hover:-translate-y-0.5" />
                            </>
                          ) : (
                            <>
                              <span>... Lihat semua riwayat ({sortedHistory.length})</span>
                              <ChevronDown className="size-3.5 transition-transform group-hover:translate-y-0.5" />
                            </>
                          )}
                        </button>
                        <span className="text-[11px] text-muted-foreground">
                          {showAllHistory
                            ? `Menampilkan seluruh ${sortedHistory.length} pembaruan`
                            : `Menampilkan ${INITIAL_HISTORY_LIMIT} dari ${sortedHistory.length} pembaruan`}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Cover Note Section */}
            <Card className="border-border/80 bg-card shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-foreground">
                  Surat Pengantar (Cover Note)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  {application.coverNote || "Tidak ada catatan pengantar yang dilampirkan."}
                </p>
              </CardContent>
            </Card>

            {/* Modal Negosiasi / Pesan Bebas untuk Offer */}
            <Dialog open={negotiationOpen} onOpenChange={setNegotiationOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageSquare className="size-5 text-[#7C3AED]" />
                    Beri Pesan / Ajukan Diskusi Penawaran
                  </DialogTitle>
                  <DialogDescription>
                    Tuliskan pertanyaan, aspirasi kompensasi, penyesuaian tanggal mulai kerja, atau poin benefit yang ingin Anda diskusikan secara terbuka dengan tim rekruter.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <label htmlFor="candidate-negotiation-msg" className="text-xs font-semibold text-foreground">
                      Pesan / Tanggapan Anda
                    </label>
                    <textarea
                      id="candidate-negotiation-msg"
                      value={negotiationMsg}
                      onChange={(e) => setNegotiationMsg(e.target.value)}
                      placeholder="Contoh: Terima kasih atas penawarannya. Apakah ada fleksibilitas untuk penyesuaian gaji pokok ke Rp26.000.000 atau opsi kerja hybrid 2 hari/minggu?"
                      rows={4}
                      className="field min-h-24 w-full py-2.5 text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Pesan ini akan langsung diteruskan ke catatan rekruter di Operations Hub. Penawaran tidak akan dibatalkan, melainkan statusnya beralih ke masa negosiasi.
                    </p>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setNegotiationOpen(false)}
                    disabled={submittingNegotiation}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                    disabled={submittingNegotiation || !negotiationMsg.trim()}
                    onClick={async () => {
                      if (!activeOffer) return;
                      setSubmittingNegotiation(true);
                      try {
                        await handleOfferAction(activeOffer.id, "in_negotiation", negotiationMsg.trim());
                        setNegotiationOpen(false);
                        setNegotiationMsg("");
                      } finally {
                        setSubmittingNegotiation(false);
                      }
                    }}
                  >
                    {submittingNegotiation ? "Mengirim..." : "Kirim Pesan Diskusi"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal Ajukan Reschedule Wawancara */}
            <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CalendarClock className="size-5 text-[#7C3AED]" />
                    Ajukan Jadwal Wawancara Pengganti
                  </DialogTitle>
                  <DialogDescription>
                    Usulkan waktu baru yang lebih sesuai dengan ketersediaan Anda beserta alasan singkat untuk tim rekruter.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3.5 py-2">
                  <div className="space-y-1.5">
                    <label htmlFor="candidate-reschedule-date" className="text-xs font-semibold text-foreground">
                      Usulan Tanggal &amp; Waktu Baru
                    </label>
                    <input
                      id="candidate-reschedule-date"
                      type="datetime-local"
                      value={rescheduleProposedDate}
                      onChange={(e) => setRescheduleProposedDate(e.target.value)}
                      className="field h-10 w-full text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="candidate-reschedule-reason" className="text-xs font-semibold text-foreground">
                      Alasan Pengajuan Reschedule
                    </label>
                    <textarea
                      id="candidate-reschedule-reason"
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      placeholder="Contoh: Ada agenda proyek penting mendesak di kantor saat ini yang tidak dapat ditinggalkan pada jam tersebut..."
                      rows={3}
                      className="field min-h-20 w-full py-2 text-sm"
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRescheduleOpen(false)}
                    disabled={submittingReschedule}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                    disabled={submittingReschedule || !rescheduleProposedDate}
                    onClick={() => void handleRescheduleSubmit()}
                  >
                    {submittingReschedule ? "Mengajukan..." : "Ajukan Jadwal Baru"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Tolak Sesi Wawancara */}
            <Dialog open={declineInterviewOpen} onOpenChange={setDeclineInterviewOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <X className="size-5" />
                    Tolak Sesi Wawancara Ini?
                  </DialogTitle>
                  <DialogDescription>
                    Apakah Anda yakin tidak dapat menghadiri sesi wawancara ini? Penolakan ini hanya membatalkan sesi pertemuan tertentu, lamaran kerja Anda tetap aktif di sistem.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                  <div className="space-y-1.5">
                    <label htmlFor="candidate-decline-iv-reason" className="text-xs font-semibold text-foreground">
                      Alasan Penolakan (Opsional)
                    </label>
                    <textarea
                      id="candidate-decline-iv-reason"
                      value={declineInterviewReason}
                      onChange={(e) => setDeclineInterviewReason(e.target.value)}
                      placeholder="Contoh: Maaf, saya sedang berhalangan hadir di luar kota pada tanggal tersebut..."
                      rows={3}
                      className="field min-h-20 w-full py-2 text-sm"
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeclineInterviewOpen(false)}
                  >
                    Kembali
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => void handleDeclineInterviewSubmit()}
                  >
                    Ya, Tolak Sesi Wawancara
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export function RecruiterPipelinePage({ jobId }: { jobId: string }) {
  const { dbMode } = useApp(); const [job, setJob] = useState<Job | null>(null); const { applications, setApplications, loading, error } = useApplications(); const [reason, setReason] = useState(""); const [updating, setUpdating] = useState<string | null>(null);
  useEffect(() => { if (!dbMode) { setJob(DEMO_JOBS.find((item) => item.id === jobId) ?? null); return; } fetch(`/api/jobs/${jobId}`, { cache: "no-store" }).then(async (response) => { const payload = await response.json() as { job?: Job }; if (!response.ok || !payload.job) throw new Error("Job tidak ditemukan."); setJob(payload.job); }).catch(() => setJob(null)); }, [dbMode, jobId]);
  const visible = useMemo(() => applications.filter((item) => item.jobId === jobId), [applications, jobId]); const grouped = activeStatuses.map((status) => ({ status, items: visible.filter((item) => item.status === status) })).filter((group) => group.items.length > 0);
  const transition = async (application: Application, status: ApplicationStatus) => { setUpdating(application.id); try { if (dbMode) { const response = await fetch(`/api/applications/${application.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, reason: reason || undefined }) }); const payload = await response.json() as { application?: Application; error?: string }; if (!response.ok || !payload.application) throw new Error(payload.error ?? "Status belum dapat diubah."); setApplications((current) => current.map((item) => item.id === application.id ? { ...item, ...payload.application } : item)); } else { const next = { ...application, status, updatedAt: new Date().toISOString() }; saveDemoApplication(next); setApplications((current) => current.map((item) => item.id === application.id ? next : item)); } setReason(""); } catch (reasonError: unknown) { window.alert(reasonError instanceof Error ? reasonError.message : "Status belum dapat diubah."); } finally { setUpdating(null); } };
  return <ProtectedRoute role="recruiter"><main className="container mx-auto max-w-7xl px-4 py-8 sm:py-12"><Link href="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="size-4" /> Jobs</Link><div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono text-xs uppercase tracking-widest text-primary">Recruiter workspace</p><h1 className="mt-2 text-3xl font-bold">Pipeline</h1><p className="mt-2 text-muted-foreground">{job?.title ?? "Job"} {job?.organizationName ? `· ${job.organizationName}` : ""}</p></div><div className="flex items-center gap-2 text-sm text-muted-foreground"><UserRound className="size-4" /> {visible.length} kandidat</div></div><label className="mt-6 block max-w-xl text-sm font-semibold">Alasan perubahan tahap<span className="ml-2 text-xs font-normal text-muted-foreground">(opsional)<textarea value={reason} onChange={(event) => setReason(event.target.value)} className="field mt-2 min-h-20 py-2" placeholder="Catatan untuk histori aplikasi" /></span></label>{loading ? <div className="mt-6"><State text="Memuat pipeline..." /></div> : error ? <div className="mt-6"><State text={error} error /></div> : visible.length === 0 ? <div className="mt-6"><State text="Belum ada aplikasi untuk job ini. Kandidat yang melamar akan muncul di sini." /></div> : <div className="mt-6 grid gap-4 lg:grid-cols-3">{grouped.map((group) => <section key={group.status} className="rounded-2xl border bg-muted/30 p-3"><div className="flex items-center justify-between px-2 py-2"><h2 className="font-semibold">{labels[group.status]}</h2><span className="text-xs text-muted-foreground">{group.items.length}</span></div><div className="space-y-3">{group.items.map((application) => <Card key={application.id}><CardContent className="p-4"><div className="flex items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"><UserRound className="size-4" /></div><div className="min-w-0"><p className="font-semibold">{application.candidate?.name ?? "Kandidat"}</p><p className="mt-1 text-xs text-muted-foreground">{application.candidate?.headline ?? "Profil kandidat"}</p>{application.candidate?.location && <p className="mt-1 text-xs text-muted-foreground">{application.candidate.location}</p>}</div></div><div className="mt-4 flex flex-wrap gap-2"><select aria-label={`Pindahkan aplikasi ${application.id}`} value={application.status} disabled={updating === application.id} onChange={(event) => void transition(application, event.target.value as ApplicationStatus)} className="field h-9 text-xs">{applicationStatuses.map((status) => <option key={status} value={status}>{labels[status]}</option>)}</select><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" /> Histori tersimpan</span></div></CardContent></Card>)}</div></section>)}</div>}</main></ProtectedRoute>;
}

export function ApplyForm({ job, withoutCard = false }: { job: Job; withoutCard?: boolean }) {
  const { dbMode } = useApp();
  const { applications } = useApplications();
  const [coverNote, setCoverNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  const duplicate = applications.find((item) => item.jobId === job.id);

  const apply = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (duplicate) return;
    if (coverNote.trim().length < 20) {
      setError("Cover note minimal 20 karakter.");
      return;
    }
    setStatus("saving");
    try {
      if (dbMode) {
        const response = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: job.id, coverNote: coverNote.trim() }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Lamaran belum dapat dikirim.");
      } else {
        const now = new Date().toISOString();
        saveDemoApplication({
          id: `demo-application-${Date.now()}`,
          jobId: job.id,
          status: "new",
          coverNote: coverNote.trim(),
          submittedAt: now,
          withdrawnAt: null,
          updatedAt: now,
          job: { id: job.id, title: job.title, organizationName: job.organizationName },
          candidate: {
            name: DEMO_CANDIDATE_CV.fullName,
            headline: DEMO_CANDIDATE_CV.headline,
            location: DEMO_CANDIDATE_CV.location,
          },
        });
      }
      setStatus("success");
      toast.success("Lamaran berhasil dikirim!");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Lamaran belum dapat dikirim.");
      setStatus("idle");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900">
        <div className="flex items-start gap-3">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
            <Check className="size-4" />
          </div>
          <div>
            <p className="font-bold text-sm text-emerald-950">Lamaran Berhasil Terkirim</p>
            <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
              Profil Anda telah diteruskan ke tim rekruter. Anda dapat memantau status lamaran di menu aplikasi saya.
            </p>
            <Link
              href="/candidate/applications"
              className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              Buka Aplikasi Saya &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (duplicate) {
    return (
      <div className="rounded-xl border border-border/80 bg-muted/40 p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Anda sudah melamar posisi ini.</p>
        <p className="mt-1">
          Pantau proses dan feedback rekruter melalui{" "}
          <Link href={`/candidate/applications/${duplicate.id}`} className="font-semibold text-primary hover:underline">
            halaman lamaran Anda &rarr;
          </Link>
        </p>
      </div>
    );
  }

  const formContent = (
    <form onSubmit={apply} className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
          <label htmlFor="cover-note" className="text-foreground">
            Cover note / Catatan Pembuka
          </label>
          <span className="text-[11px] text-muted-foreground font-normal">
            {coverNote.length}/4.000 karakter
          </span>
        </div>
        <textarea
          id="cover-note"
          value={coverNote}
          onChange={(event) => setCoverNote(event.target.value)}
          className="field min-h-28 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/70 transition-all rounded-xl focus:ring-2 focus:ring-primary/20"
          placeholder="Ceritakan secara singkat alasan kamu tertarik dan cocok untuk posisi ini..."
          required
          maxLength={4000}
          aria-describedby="cover-note-help"
        />
        <p id="cover-note-help" className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
          CV dan profil tersimpan Anda akan otomatis disertakan ke rekruter saat lamaran dikirim.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-medium" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={status === "saving"}
        className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-10 shadow-xs cursor-pointer gap-2 transition-all"
      >
        {status === "saving" ? "Mengirim Lamaran..." : "Kirim Lamaran Sekarang"}
        <Send className="size-3.5" />
      </Button>
    </form>
  );

  if (withoutCard) {
    return formContent;
  }

  return (
    <Card className="rounded-2xl border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-foreground">Kirim Lamaran Anda</CardTitle>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}

function canWithdraw(status: ApplicationStatus) { return !["hired", "rejected", "withdrawn"].includes(status); }
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
