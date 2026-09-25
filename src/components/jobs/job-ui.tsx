"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Banknote,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/providers/app-provider";
import { cn } from "@/lib/utils";
import {
  DEMO_JOBS,
  arrangementLabels,
  educationLabels,
  employmentLabels,
  experienceLabels,
  formatOfficeAddress,
  formatPhoneDisplay,
  formatSalaryDisplay,
  statusLabels,
  type EducationLevel,
  type ExperienceLevel,
  type Job,
} from "@/lib/jobs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApplyForm, useApplications } from "@/components/applications/application-ui";

const PAGE_LIMIT = 24;

type JobsPayload = { jobs?: Job[]; hasMore?: boolean; error?: string };

function useJobs() {
  const { dbMode } = useApp();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let active = true;
    setPage(1);
    if (!dbMode) {
      const stored = localStorage.getItem("proofylink-demo-jobs");
      const parsed = stored ? (JSON.parse(stored) as Job[]) : DEMO_JOBS;
      if (active) {
        setJobs(parsed.filter((job) => job.status === "published"));
        setHasMore(false);
        setLoading(false);
      }
      return () => {
        active = false;
      };
    }
    setLoading(true);
    setError(null);
    fetch(`/api/jobs?page=1&limit=${PAGE_LIMIT}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as JobsPayload;
        if (!response.ok) throw new Error(payload.error ?? "Job belum dapat dimuat.");
        if (active) {
          setJobs(payload.jobs ?? []);
          setHasMore(payload.hasMore ?? false);
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Job belum dapat dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dbMode]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setLoadingMore(true);
    fetch(`/api/jobs?page=${next}&limit=${PAGE_LIMIT}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as JobsPayload;
        if (!response.ok) throw new Error(payload.error ?? "Job belum dapat dimuat.");
        setJobs((current) => [...current, ...(payload.jobs ?? [])]);
        setPage(next);
        setHasMore(payload.hasMore ?? false);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Job belum dapat dimuat."))
      .finally(() => setLoadingMore(false));
  };
  return { jobs, loading, loadingMore, error, hasMore, loadMore };
}

function getCompanyInitial(name?: string | null): string {
  if (!name) return "P";
  const cleaned = name.trim().replace(/^(PT\.?|CV\.?|UD\.?|Perum|Yayasan)\s+/i, "");
  return (cleaned ? cleaned.charAt(0) : name.charAt(0)).toUpperCase() || "P";
}

function CompanyAvatar({
  name,
  logoUrl,
  size = "md",
}: {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "size-9 rounded-lg text-xs",
    md: "size-11 sm:size-12 rounded-xl text-base",
    lg: "size-16 sm:size-20 rounded-2xl text-2xl",
  };

  const initial = getCompanyInitial(name);

  if (logoUrl) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden border border-border/80 bg-white p-1.5 shadow-2xs flex items-center justify-center ${sizeClasses[size]}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={name} className="size-full object-contain" />
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 flex items-center justify-center font-bold text-white bg-gradient-to-br from-primary via-purple-700 to-indigo-800 shadow-2xs ring-1 ring-black/5 ${sizeClasses[size]}`}
    >
      {initial}
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const salaryText = formatSalaryDisplay(job);
  const companyName = job.organization?.name || job.organizationName || "Perusahaan Mitra";
  const isApproved = job.organization?.verificationStatus === "approved";
  const expLabel = job.experienceLevel
    ? experienceLabels[job.experienceLevel as ExperienceLevel] ?? job.experienceLevel
    : null;
  const eduLabel = job.minEducation
    ? educationLabels[job.minEducation as EducationLevel] ?? job.minEducation
    : null;

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <CardHeader className="gap-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <CompanyAvatar
              name={companyName}
              logoUrl={job.organization?.logoUrl}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <Link href={`/jobs/${job.id}`} className="block group/link">
                {/* Nama Perusahaan (PT) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="text-xs sm:text-[13px] font-semibold text-foreground/90 group-hover/link:text-primary transition-colors line-clamp-2 leading-snug break-words"
                    title={companyName}
                  >
                    {companyName}
                  </span>
                  {isApproved && (
                    <span
                      title="Perusahaan Terverifikasi Resmi ProofyLink"
                      className="inline-flex items-center text-primary shrink-0"
                    >
                      <ShieldCheck className="size-3.5 fill-primary/15 text-primary" />
                    </span>
                  )}
                </div>

                {/* Judul Posisi Pekerjaan */}
                <CardTitle
                  className="mt-1 text-base font-bold text-foreground group-hover/link:text-primary transition-colors line-clamp-2 leading-snug break-words"
                  title={job.title}
                >
                  {job.title}
                </CardTitle>
              </Link>
            </div>
          </div>

          <span className="shrink-0 self-start rounded-full bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
            {arrangementLabels[job.workArrangement]}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5 pt-0">
        {/* Highlight Gaji ala Glints */}
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50/80 border border-emerald-200/70 px-3 py-1.5 text-xs font-semibold text-emerald-800 w-fit">
          <Banknote className="size-3.5 text-emerald-600 shrink-0" />
          <span>{salaryText}</span>
        </div>

        {/* Kriteria Penting (Pengalaman, Pendidikan, Lokasi) */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {job.location && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">
              <MapPin className="size-3 text-muted-foreground" />
              {job.location}
            </span>
          )}
          <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">
            {employmentLabels[job.employmentType]}
          </span>
          {expLabel && (
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 font-medium text-indigo-700 px-2 py-0.5">
              <BriefcaseBusiness className="size-3" />
              {expLabel}
            </span>
          )}
          {eduLabel && (
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 font-medium text-purple-700 px-2 py-0.5">
              <GraduationCap className="size-3" />
              {eduLabel}
            </span>
          )}
        </div>

        {/* Cuplikan Deskripsi */}
        <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{job.description}</p>

        {/* Skill tags */}
        <div className="flex flex-wrap gap-1">
          {job.requirements.slice(0, 4).map((req) => (
            <span
              key={req.id}
              className="rounded-md border border-border/80 bg-slate-50 px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {req.name}
            </span>
          ))}
          {job.requirements.length > 4 && (
            <span className="px-1 py-0.5 text-[11px] text-muted-foreground">+{job.requirements.length - 4}</span>
          )}
        </div>

        <div className="border-t border-border/60 pt-3 flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="size-3" />
            <span>Aktif menerima pelamar</span>
          </span>
          <Button asChild size="sm" variant="default" className="rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-white">
            <Link href={`/jobs/${job.id}`}>
              Lihat Detail &amp; Apply <span aria-hidden="true">&rarr;</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PublicJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const rawArrangement = searchParams.get("arrangement");
  const arrangement =
    rawArrangement === "remote" || rawArrangement === "hybrid" || rawArrangement === "onsite"
      ? rawArrangement
      : "all";

  const { jobs, loading, loadingMore, error, hasMore, loadMore } = useJobs();

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const matchQuery =
        !query ||
        `${job.title} ${job.organization?.name || job.organizationName} ${job.description} ${
          job.location || ""
        } ${job.requirements.map((r) => r.name).join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchArrangement = arrangement === "all" || job.workArrangement === arrangement;
      return matchQuery && matchArrangement;
    });
  }, [jobs, query, arrangement]);

  const syncParams = (nextQuery: string, nextArrangement: string) => {
    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    if (nextArrangement !== "all") params.set("arrangement", nextArrangement);
    const qs = params.toString();
    router.replace(qs ? `/jobs?${qs}` : "/jobs", { scroll: false });
  };

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* Header Eksplorasi Glints Style */}
      <div className="rounded-2xl bg-gradient-to-r from-[#201C45] via-[#311b5e] to-[#7C3AED] p-6 sm:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-xs px-3 py-1 text-xs font-semibold text-purple-200">
            <Sparkles className="size-3.5 text-pink-400" />
            <span>Jaringan Karir Terverifikasi ProofyLink</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-4xl text-white">
            Temukan Lowongan Kerja Impian
          </h1>
          <p className="mt-2 text-sm text-purple-100/90 leading-6">
            Jelajahi peluang karir transparan dengan rentang gaji jelas, kriteria terukur, dan profil perusahaan resmi
            yang telah diverifikasi.
          </p>
        </div>

        {/* Background glow circle */}
        <div className="absolute -right-16 -top-16 size-72 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Filter & Search Bar */}
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-2 rounded-xl border border-input bg-card px-3.5 py-1.5 shadow-xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Cari lowongan</span>
          <input
            value={query}
            onChange={(event) => syncParams(event.target.value, arrangement)}
            placeholder="Cari posisi pekerjaan, keahlian, atau nama perusahaan (contoh: Product Designer, React, Fintech)..."
            className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>

        <select
          aria-label="Filter tipe kerja"
          value={arrangement}
          onChange={(event) => syncParams(query, event.target.value)}
          className="h-12 rounded-xl border border-input bg-card px-4 text-sm font-medium text-foreground shadow-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Semua Penempatan</option>
          <option value="remote">100% Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site (Kantor)</option>
        </select>
      </div>

      {/* Stats counter */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          Menampilkan <span className="text-primary">{filtered.length}</span> lowongan pekerjaan tersedia
        </p>
      </div>

      {/* Grid Lowongan */}
      {loading ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="rounded-xl border border-border/80 p-5 space-y-4">
              <div className="flex gap-3">
                <Skeleton className="size-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-5 w-3/4" />
                </div>
              </div>
              <Skeleton className="h-8 w-2/3 rounded-lg" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <State text={error} error />
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <BriefcaseBusiness className="mx-auto size-10 text-muted-foreground/60" />
          <h3 className="mt-3 text-base font-bold text-foreground">Tidak Ada Lowongan yang Cocok</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Coba ubah kata kunci pencarian atau ganti filter pengaturan kerja Anda.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => syncParams("", "all")}>
            Reset Semua Filter
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="rounded-xl px-6">
                {loadingMore ? "Memuat lebih banyak..." : "Muat Lowongan Lainnya"}
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function StructuredContentList({
  content,
  bulletVariant = "check",
}: {
  content?: string | null;
  bulletVariant?: "check" | "bullet";
}) {
  if (!content) return null;

  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const hasBullets = lines.some((l) => /^[-*•\d+.]\s*/.test(l) || l.startsWith("-") || l.startsWith("•"));

  if (!hasBullets && lines.length === 1) {
    return (
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {content}
      </p>
    );
  }

  return (
    <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
      {lines.map((line, idx) => {
        const cleaned = line.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "");
        if (!cleaned) return null;

        return (
          <li key={idx} className="flex items-start gap-3">
            {bulletVariant === "check" ? (
              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="size-3 stroke-[2.5]" />
              </div>
            ) : (
              <div className="mt-2 flex size-2 shrink-0 items-center justify-center rounded-full bg-primary" />
            )}
            <span className="leading-relaxed flex-1">{cleaned}</span>
          </li>
        );
      })}
    </ul>
  );
}


export function JobDetailPage({ jobId }: { jobId: string }) {
  const { dbMode, user } = useApp();
  const { applications } = useApplications();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  useEffect(() => {
    if (!dbMode) {
      const stored = localStorage.getItem("proofylink-demo-jobs");
      const jobs = stored ? (JSON.parse(stored) as Job[]) : DEMO_JOBS;
      setJob(jobs.find((item) => item.id === jobId) ?? null);
      setLoading(false);
      return;
    }
    fetch(`/api/jobs/${jobId}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { job?: Job; error?: string };
        if (!response.ok || !payload.job) throw new Error(payload.error ?? "Job tidak ditemukan.");
        setJob(payload.job);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Job tidak ditemukan."))
      .finally(() => setLoading(false));
  }, [dbMode, jobId]);

  const isClosed = job?.status !== "published";
  const salaryText = job ? formatSalaryDisplay(job) : "";
  const org = job?.organization;
  const companyName = org?.name || job?.organizationName || "Perusahaan";
  const existingApp = job ? applications.find((app) => app.jobId === job.id) : undefined;

  const expLabel = job?.experienceLevel
    ? experienceLabels[job.experienceLevel as ExperienceLevel] ?? job.experienceLevel
    : null;
  const eduLabel = job?.minEducation
    ? educationLabels[job.minEducation as EducationLevel] ?? job.minEducation
    : null;

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success("Alamat email perusahaan berhasil disalin!");
  };

  const shareJob = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Tautan lowongan berhasil disalin ke clipboard!");
    }
  };

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="flex items-center justify-between">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3.5 py-1.5 text-xs font-bold text-muted-foreground shadow-2xs hover:text-primary hover:border-primary/40 transition-all"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          <span>Kembali ke semua lowongan</span>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={shareJob}
          className="rounded-xl border-border/80 gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground shadow-2xs cursor-pointer"
        >
          <Share2 className="size-3.5" />
          <span>Bagikan Lowongan</span>
        </Button>
      </div>

      {loading ? (
        <div className="mt-6 space-y-6">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-60 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
            <div>
              <Skeleton className="h-80 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      ) : error || !job ? (
        <State text={error ?? "Lowongan tidak ditemukan."} error />
      ) : (
        <div className="mt-6 space-y-8">
          {/* Header Identitas Lowongan & Perusahaan */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-stretch justify-between gap-5">
              <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
                {/* Logo Perusahaan */}
                <div className="size-16 sm:size-20 shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-white shadow-xs flex items-center justify-center p-2">
                  {org?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={org.logoUrl} alt={companyName} className="size-full object-contain" />
                  ) : (
                    <div className="flex size-full items-center justify-center rounded-xl bg-gradient-to-br from-primary via-purple-700 to-indigo-800 text-2xl sm:text-3xl font-extrabold text-white">
                      {getCompanyInitial(companyName)}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm sm:text-base font-bold text-foreground">{companyName}</span>
                    {org?.verificationStatus === "approved" && (
                      <span
                        title="Perusahaan Terverifikasi Resmi ProofyLink"
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
                      >
                        <ShieldCheck className="size-3.5 fill-primary/15 text-primary" />
                        <span>Terverifikasi Resmi</span>
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">
                    {job.title}
                  </h1>

                  {/* Meta tags bar (alamat, jenis perusahaan, penempatan, tipe kerja) */}
                  <div className="pt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-foreground">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-muted/60 px-2.5 py-1 text-slate-700">
                      {employmentLabels[job.employmentType]}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-muted/60 px-2.5 py-1 text-slate-700">
                      {arrangementLabels[job.workArrangement]}
                    </span>
                    {job.location && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/60 px-2.5 py-1 text-slate-700">
                        <MapPin className="size-3.5 text-primary" />
                        {job.location}
                      </span>
                    )}
                    {org?.industry && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/60 px-2.5 py-1 text-slate-700">
                        <Building2 className="size-3.5 text-primary" />
                        {org.industry}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end justify-between gap-4 shrink-0 sm:self-stretch">
                <div>
                  <span
                    className={`rounded-full px-3.5 py-1 text-xs font-bold ${
                      job.status === "published"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {statusLabels[job.status]}
                  </span>
                </div>

                {/* Tombol Kirim Lamaran sejajar dengan baris tag (alamat, jenis perusahaan, dll) */}
                <div className="flex items-center sm:items-end">
                {user?.role === "candidate" ? (
                  isClosed ? (
                    <Button disabled variant="outline" className="rounded-xl font-semibold text-xs h-9 px-4 opacity-70">
                      Lowongan Ditutup
                    </Button>
                  ) : existingApp ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100/70 font-semibold text-xs h-9 px-3.5 gap-1.5 shadow-2xs"
                    >
                      <Link href="/candidate/applications">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        <span>Sudah Dilamar</span>
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setApplyModalOpen(true)}
                      className="rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-9 px-4 gap-2 shadow-xs cursor-pointer transition-all"
                    >
                      <Send className="size-3.5" />
                      <span>Kirim Lamaran</span>
                    </Button>
                  )
                ) : user?.role === "recruiter" ? (
                  <Button asChild variant="outline" size="sm" className="rounded-xl border-border/80 font-semibold text-xs h-9 px-3.5 gap-1.5 shadow-2xs">
                    <Link href="/recruiter/jobs">
                      <BriefcaseBusiness className="size-3.5 text-primary" />
                      <span>Kelola Lowongan</span>
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-9 px-4 gap-2 shadow-xs">
                    <Link href={`/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`}>
                      <Send className="size-3.5" />
                      <span>Masuk untuk Melamar</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

          {/* Quick Highlight Cards (Gaji & Kriteria) */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <div className="group rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:border-primary/30">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60">
                  <Banknote className="size-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Estimasi Gaji
                </span>
              </div>
              <p className="mt-3 text-sm sm:text-base font-extrabold text-foreground tracking-tight line-clamp-1">
                {salaryText}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {job.isSalaryNegotiable ? "Dapat dinegosiasikan" : "Sesuai kualifikasi"}
              </p>
            </div>

            <div className="group rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:border-primary/30">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/60">
                  <BriefcaseBusiness className="size-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Pengalaman
                </span>
              </div>
              <p className="mt-3 text-sm sm:text-base font-extrabold text-foreground tracking-tight line-clamp-1">
                {expLabel ?? "Terbuka Segala Pengalaman"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Tingkat kecocokan profil</p>
            </div>

            <div className="group rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:border-primary/30">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 ring-1 ring-purple-200/60">
                  <GraduationCap className="size-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Pendidikan
                </span>
              </div>
              <p className="mt-3 text-sm sm:text-base font-extrabold text-foreground tracking-tight line-clamp-1">
                {eduLabel ?? "Semua Jurusan"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Minimal kelulusan</p>
            </div>

            <div className="group rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:border-primary/30">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
                  <Users className="size-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Kuota Penerimaan
                </span>
              </div>
              <p className="mt-3 text-sm sm:text-base font-extrabold text-foreground tracking-tight line-clamp-1">
                {job.vacanciesCount ?? 1} Orang
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Kandidat yang dibutuhkan</p>
            </div>
          </div>

          {/* Main 2-Column Section: Left Job Details, Right Company Profile & Apply */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left 2 Cols: Structured Job Description */}
            <div className="lg:col-span-2 space-y-6">
              {/* Deskripsi Pekerjaan */}
              <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <BriefcaseBusiness className="size-4" />
                    </div>
                    <span>Deskripsi Pekerjaan</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {job.description}
                  </p>
                </CardContent>
              </Card>

              {/* Tanggung Jawab Utama */}
              {job.responsibilities && (
                <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/60">
                        <CheckCircle2 className="size-4" />
                      </div>
                      <span>Tanggung Jawab Utama</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <StructuredContentList content={job.responsibilities} bulletVariant="check" />
                  </CardContent>
                </Card>
              )}

              {/* Kualifikasi & Persyaratan */}
              {job.qualifications && (
                <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 ring-1 ring-purple-200/60">
                        <GraduationCap className="size-4" />
                      </div>
                      <span>Kualifikasi &amp; Persyaratan</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <StructuredContentList content={job.qualifications} bulletVariant="check" />
                  </CardContent>
                </Card>
              )}

              {/* Keahlian (Skills) */}
              {job.requirements && job.requirements.length > 0 && (
                <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Sparkles className="size-4" />
                      </div>
                      <span>Keahlian yang Dibutuhkan</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    {job.requirements.some((r) => r.type === "required") && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                          Keahlian Wajib (Required)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {job.requirements
                            .filter((r) => r.type === "required")
                            .map((req) => (
                              <span
                                key={req.id}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200/80 bg-purple-50/80 px-3.5 py-1.5 text-xs font-bold text-purple-800 shadow-2xs transition-colors hover:bg-purple-100/80"
                              >
                                <Check className="size-3 text-purple-600 stroke-[2.5]" />
                                {req.name}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {job.requirements.some((r) => r.type === "preferred") && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                          Keahlian Nilai Plus (Preferred)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {job.requirements
                            .filter((r) => r.type === "preferred")
                            .map((req) => (
                              <span
                                key={req.id}
                                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-100 transition-colors"
                              >
                                <span className="text-primary font-bold">+</span>
                                {req.name}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tunjangan & Fasilitas */}
              {job.benefits && job.benefits.length > 0 && (
                <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-pink-50 text-pink-500 ring-1 ring-pink-200/60">
                        <Award className="size-4" />
                      </div>
                      <span>Fasilitas &amp; Keuntungan (Benefits)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {job.benefits.map((b) => (
                        <div
                          key={b}
                          className="group flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3.5 text-xs font-semibold text-foreground shadow-2xs transition-all duration-150 hover:border-primary/40 hover:bg-purple-50/20"
                        >
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70 group-hover:bg-emerald-100 transition-colors">
                            <Check className="size-3.5 stroke-[2.5]" />
                          </div>
                          <span className="leading-snug">{b}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Profil Perusahaan (PT) */}
            <div className="space-y-6">
              <div className="sticky top-24">
                {/* Profil Perusahaan */}
                <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
                <div className="border-b border-border/60 p-5 bg-gradient-to-b from-slate-50/70 to-transparent">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Profil Perusahaan
                  </span>
                  <div className="mt-2.5 flex items-center gap-3.5">
                    <CompanyAvatar name={companyName} logoUrl={org?.logoUrl} size="md" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-foreground break-words line-clamp-2" title={companyName}>
                        {companyName}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">{org?.industry ?? "Industri Bisnis"}</p>
                    </div>
                  </div>
                </div>

                <CardContent className="space-y-4 p-5 text-xs">
                  {/* Deskripsi PT */}
                  {org?.description && (
                    <div className="space-y-1.5">
                      <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                        Tentang Perusahaan
                      </p>
                      <p className="leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line text-justify sm:text-left">
                        {org.description}
                      </p>
                    </div>
                  )}

                  {/* Ukuran Perusahaan */}
                  {org?.companyScale && (
                    <div className="space-y-1">
                      <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                        Ukuran Perusahaan
                      </p>
                      <div className="flex items-center gap-2 font-semibold text-foreground">
                        <Users className="size-3.5 text-primary shrink-0" />
                        <span>{org.companyScale}</span>
                      </div>
                    </div>
                  )}

                  {/* Alamat Lengkap Kantor PT */}
                  {(org?.officeAddress || org?.city) && (
                    <div className="space-y-1">
                      <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                        Alamat Kantor
                      </p>
                      <div className="flex items-start gap-2 font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                        <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="break-words">
                          {formatOfficeAddress(org.officeAddress, org.city, org.province)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Kontak Resmi Perusahaan */}
                  <div className="space-y-2 border-t border-border/60 pt-3.5">
                    <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                      Kontak &amp; Tautan Resmi
                    </p>

                    {org?.companyEmail && (
                      <div className="flex items-center justify-between rounded-xl border border-border/70 bg-slate-50/70 p-2.5 text-xs transition-colors hover:bg-slate-100/70">
                        <span className="flex items-center gap-2 text-foreground font-medium truncate min-w-0" title={org.companyEmail}>
                          <Mail className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">{org.companyEmail}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => copyEmail(org.companyEmail!)}
                          title="Salin email"
                          aria-label="Salin email perusahaan"
                          className="text-primary hover:text-primary/80 p-1 rounded-md hover:bg-purple-100/50 transition-colors shrink-0 ml-1.5"
                        >
                          <Copy className="size-3.5" />
                        </button>
                      </div>
                    )}

                    {org?.companyPhone && (
                      <a
                        href={`tel:${org.companyPhone.replace(/[^\d+]/g, "")}`}
                        title={`Hubungi ${formatPhoneDisplay(org.companyPhone)}`}
                        className="flex items-center gap-2 rounded-xl border border-border/70 bg-slate-50/70 p-2.5 text-xs text-foreground font-medium hover:border-primary/40 hover:bg-purple-50/20 transition-colors"
                      >
                        <Phone className="size-3.5 text-primary shrink-0" />
                        <span className="truncate">{formatPhoneDisplay(org.companyPhone)}</span>
                      </a>
                    )}

                    {(org?.website || org?.linkedinUrl) && (
                      <div
                        className={cn(
                          "grid gap-2 pt-1",
                          org?.website && org?.linkedinUrl ? "grid-cols-2" : "grid-cols-1"
                        )}
                      >
                        {org?.website && (
                          <a
                            href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Buka Website Resmi"
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-2 text-[11px] font-semibold text-foreground hover:border-primary/40 hover:text-primary hover:bg-purple-50/30 transition shadow-2xs text-center"
                          >
                            <ExternalLink className="size-3 text-primary shrink-0" />
                            <span className="truncate">Website Resmi</span>
                          </a>
                        )}

                        {org?.linkedinUrl && (
                          <a
                            href={org.linkedinUrl.startsWith("http") ? org.linkedinUrl : `https://${org.linkedinUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Buka Profil LinkedIn"
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-2 text-[11px] font-semibold text-foreground hover:border-primary/40 hover:text-primary hover:bg-purple-50/30 transition shadow-2xs text-center"
                          >
                            <ExternalLink className="size-3 text-primary shrink-0" />
                            <span className="truncate">Profil LinkedIn</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Modal Kirim Lamaran */}
      {job && (
        <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
          <DialogContent className="max-w-lg p-6 rounded-2xl">
            <DialogHeader className="pb-3 border-b border-border/60">
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Send className="size-4 text-primary" />
                <span>Kirim Lamaran Anda</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Lamar posisi <strong>{job.title}</strong> di <strong>{companyName}</strong>. CV dan profil tersimpan Anda akan otomatis disertakan ke rekruter.
              </DialogDescription>
            </DialogHeader>
            <div className="pt-4">
              <ApplyForm job={job} withoutCard />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}

function State({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <div
      className={
        error
          ? "mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive"
          : "mt-4 rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground"
      }
      role={error ? "alert" : "status"}
    >
      {text}
    </div>
  );
}
