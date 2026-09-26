"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

const PAGE_LIMIT = 100;

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
      let parsed = DEMO_JOBS;
      try {
        const stored = localStorage.getItem("proofylink-demo-jobs");
        if (stored) {
          const loaded = JSON.parse(stored) as Job[];
          if (Array.isArray(loaded) && loaded.length >= DEMO_JOBS.length) {
            parsed = loaded;
          } else {
            const existingMap = new Map((loaded || []).map((j) => [j.id, j]));
            parsed = DEMO_JOBS.map((dj) => existingMap.get(dj.id) ?? dj);
            localStorage.setItem("proofylink-demo-jobs", JSON.stringify(parsed));
          }
        } else {
          localStorage.setItem("proofylink-demo-jobs", JSON.stringify(DEMO_JOBS));
        }
      } catch {
        parsed = DEMO_JOBS;
      }

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

function getPageItems(totalPages: number, currentPage: number): (number | "gap")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const wanted = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  let prev = 0;
  for (const n of pages) {
    if (n - prev > 1) items.push("gap");
    items.push(n);
    prev = n;
  }
  return items;
}

export function JobRowCard({ job }: { job: Job }) {
  const salaryText = formatSalaryDisplay(job);
  const companyName = job.organization?.name || job.organizationName || "Perusahaan Mitra";
  const isApproved = job.organization?.verificationStatus === "approved";
  const expLabel = job.experienceLevel
    ? experienceLabels[job.experienceLevel as ExperienceLevel] ?? job.experienceLevel
    : null;
  const eduLabel = job.minEducation
    ? educationLabels[job.minEducation as EducationLevel] ?? job.minEducation
    : null;

  const arrangementStyle =
    job.workArrangement === "remote"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
      : job.workArrangement === "hybrid"
      ? "bg-purple-50 text-purple-800 border-purple-200/80"
      : "bg-slate-100 text-slate-800 border-slate-200/80";

  return (
    <article
      tabIndex={0}
      className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border border-border/80 bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {/* Kolom Kiri: Avatar & Detail Utama */}
      <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
        <CompanyAvatar
          name={companyName}
          logoUrl={job.organization?.logoUrl}
          size="md"
        />

        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Perusahaan & Status Verifikasi */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-xs sm:text-[13px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors"
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
          <Link href={`/jobs/${job.id}`} className="block focus:outline-none">
            <h2
              className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1 break-words"
              title={job.title}
            >
              {job.title}
            </h2>
          </Link>

          {/* Metadata Badges: Lokasi, Tipe Kerja, Pengalaman, Pendidikan */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors",
                arrangementStyle
              )}
            >
              {arrangementLabels[job.workArrangement]}
            </span>

            <span className="inline-flex items-center rounded-md border border-border/80 bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-foreground">
              {employmentLabels[job.employmentType]}
            </span>

            {job.location && (
              <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <MapPin className="size-3 text-muted-foreground/80 shrink-0" />
                <span className="line-clamp-1 max-w-[180px] sm:max-w-[260px]">{job.location}</span>
              </span>
            )}

            {expLabel && (
              <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200/60 bg-indigo-50/70 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                <BriefcaseBusiness className="size-3 shrink-0" />
                <span>{expLabel}</span>
              </span>
            )}

            {eduLabel && (
              <span className="inline-flex items-center gap-1 rounded-md border border-purple-200/60 bg-purple-50/70 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                <GraduationCap className="size-3 shrink-0" />
                <span>{eduLabel}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kolom Tengah: Highlight Gaji & Skill Tags */}
      <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between md:justify-center gap-2 md:gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
        {/* Rentang Gaji Transparan */}
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-1 text-xs font-semibold text-emerald-800 font-mono tracking-tight shrink-0">
          <Banknote className="size-3.5 text-emerald-600 shrink-0" />
          <span>{salaryText}</span>
        </div>

        {/* Skill Badges (Maks 3 + N) */}
        {job.requirements && job.requirements.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 md:justify-end">
            {job.requirements.slice(0, 3).map((req) => (
              <span
                key={req.id}
                className="rounded-md border border-border/70 bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {req.name}
              </span>
            ))}
            {job.requirements.length > 3 && (
              <span
                title={job.requirements.slice(3).map((r) => r.name).join(", ")}
                className="rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
              >
                +{job.requirements.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Kolom Kanan: Status Penerimaan & Action Button */}
      <div className="flex items-center md:flex-col items-end justify-between md:justify-center gap-2 shrink-0 md:min-w-[130px] pt-2 md:pt-0">
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="size-3 text-muted-foreground/70 shrink-0" />
          <span>Aktif menerima pelamar</span>
        </span>

        <Button
          asChild
          size="sm"
          variant="default"
          className="rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs group-hover:shadow-sm transition-all"
        >
          <Link href={`/jobs/${job.id}`}>
            Lihat Detail
            <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

// Kompatibilitas alias jika ada penggunaan terdahulu
export const JobCard = JobRowCard;

const PAGE_SIZE = 10;

export function PublicJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const rawArrangement = searchParams.get("arrangement");
  const arrangement =
    rawArrangement === "remote" || rawArrangement === "hybrid" || rawArrangement === "onsite"
      ? rawArrangement
      : "all";

  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const currentPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const { jobs, loading, error } = useJobs();

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedJobs = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filtered.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filtered, safeCurrentPage]);

  const pageItems = useMemo(
    () => getPageItems(totalPages, safeCurrentPage),
    [totalPages, safeCurrentPage]
  );

  const syncParams = (nextQuery: string, nextArrangement: string, nextPage: number = 1) => {
    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    if (nextArrangement && nextArrangement !== "all") params.set("arrangement", nextArrangement);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    router.replace(qs ? `/jobs?${qs}` : "/jobs", { scroll: false });
  };

  const goToPage = (pageNumber: number) => {
    syncParams(query, arrangement, pageNumber);
    const container = document.getElementById("jobs-list-container");
    if (container) {
      container.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const startItem = filtered.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safeCurrentPage * PAGE_SIZE, filtered.length);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* Header Eksplorasi Lowongan */}
      <header className="rounded-2xl bg-[#181433] p-6 sm:p-8 text-white border border-white/10 shadow-xs">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
            Lowongan Kerja
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Peluang karir terverifikasi dengan rentang gaji transparan, kriteria terukur, dan profil perusahaan resmi di ekosistem ProofyLink.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-xs text-purple-200">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              100% Gaji Transparan
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              Perusahaan Terkurasi
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              Akses Langsung ke Rekruter
            </span>
          </div>
        </div>
      </header>

      {/* Filter & Search Bar */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <label className="flex items-center gap-2 rounded-xl border border-input bg-card px-3.5 py-2 shadow-xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Cari lowongan</span>
            <input
              value={query}
              onChange={(event) => syncParams(event.target.value, arrangement, 1)}
              placeholder="Cari posisi, keahlian, atau nama perusahaan (contoh: Product Designer, React, Golang)..."
              className="h-7 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={() => syncParams("", arrangement, 1)}
                className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                aria-label="Hapus kata kunci pencarian"
              >
                <X className="size-3.5" />
              </button>
            )}
          </label>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            aria-label="Filter tipe kerja"
            value={arrangement}
            onChange={(event) => syncParams(query, event.target.value, 1)}
            className="h-11 rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground shadow-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="all">Semua Penempatan</option>
            <option value="remote">100% Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site (Kantor)</option>
          </select>
        </div>
      </div>

      {/* Stats counter & active state */}
      <div id="jobs-list-container" className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">
          {loading ? (
            "Memuat lowongan pekerjaan..."
          ) : (
            <>
              Menampilkan{" "}
              <span className="text-primary font-bold">
                {filtered.length === 0 ? "0" : `${startItem}–${endItem}`}
              </span>{" "}
              dari <span className="text-primary font-bold">{filtered.length}</span> lowongan pekerjaan tersedia
            </>
          )}
        </p>

        {(query || arrangement !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => syncParams("", "all", 1)}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset filter
          </Button>
        )}
      </div>

      {/* Daftar Lowongan: One-Row-Per-Job */}
      {loading ? (
        <div className="mt-4 space-y-3" role="status" aria-label="Memuat lowongan pekerjaan">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-border/80 bg-card p-5"
            >
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <Skeleton className="size-12 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-5 w-64 max-w-full" />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Skeleton className="h-5 w-20 rounded-md" />
                    <Skeleton className="h-5 w-24 rounded-md" />
                    <Skeleton className="h-5 w-28 rounded-md" />
                  </div>
                </div>
              </div>
              <div className="flex md:flex-col items-end gap-2.5 shrink-0 pt-2 md:pt-0">
                <Skeleton className="h-7 w-36 rounded-lg" />
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-8">
          <State text={error} error />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <BriefcaseBusiness className="mx-auto size-10 text-muted-foreground/60" />
          <h2 className="mt-3 text-base font-bold text-foreground">Tidak Ada Lowongan yang Cocok</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Coba ubah kata kunci pencarian atau ganti filter pengaturan kerja Anda.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => syncParams("", "all", 1)}>
            Reset Semua Filter
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {paginatedJobs.map((job) => (
              <JobRowCard key={job.id} job={job} />
            ))}
          </div>

          {/* Navigasi Pagination */}
          {totalPages > 1 && (
            <nav
              aria-label="Navigasi halaman lowongan"
              className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/80 pt-6"
            >
              <p className="text-xs sm:text-sm text-muted-foreground">
                Halaman <span className="font-semibold text-foreground">{safeCurrentPage}</span> dari{" "}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </p>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => goToPage(safeCurrentPage - 1)}
                  className="h-8 rounded-lg px-2.5 text-xs font-medium gap-1"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="size-3.5" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </Button>

                {pageItems.map((item, idx) =>
                  item === "gap" ? (
                    <span
                      key={`gap-${idx}`}
                      className="px-1.5 text-xs text-muted-foreground"
                      aria-hidden="true"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={item === safeCurrentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(item)}
                      className="size-8 rounded-lg p-0 text-xs font-medium"
                      aria-current={item === safeCurrentPage ? "page" : undefined}
                    >
                      {item}
                    </Button>
                  )
                )}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => goToPage(safeCurrentPage + 1)}
                  className="h-8 rounded-lg px-2.5 text-xs font-medium gap-1"
                  aria-label="Halaman berikutnya"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </nav>
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
      let parsed = DEMO_JOBS;
      try {
        const stored = localStorage.getItem("proofylink-demo-jobs");
        if (stored) {
          const loaded = JSON.parse(stored) as Job[];
          if (Array.isArray(loaded) && loaded.length >= DEMO_JOBS.length) {
            parsed = loaded;
          } else {
            const existingMap = new Map((loaded || []).map((j) => [j.id, j]));
            parsed = DEMO_JOBS.map((dj) => existingMap.get(dj.id) ?? dj);
            localStorage.setItem("proofylink-demo-jobs", JSON.stringify(parsed));
          }
        } else {
          localStorage.setItem("proofylink-demo-jobs", JSON.stringify(DEMO_JOBS));
        }
      } catch {
        parsed = DEMO_JOBS;
      }
      setJob(parsed.find((item) => item.id === jobId) ?? null);
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
    <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-10 space-y-6">
      {/* Top Bar Navigation & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-2xs hover:text-foreground hover:border-border transition-all"
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
        <div className="space-y-6" role="status" aria-label="Memuat rincian lowongan pekerjaan">
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <Skeleton className="size-16 sm:size-20 rounded-2xl shrink-0" />
              <div className="space-y-2.5 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-7 w-72 max-w-full" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-5 w-20 rounded-md" />
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-5 w-28 rounded-md" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-border/60">
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-6">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          </div>
        </div>
      ) : error || !job ? (
        <State text={error ?? "Lowongan tidak ditemukan."} error />
      ) : (
        <div className="space-y-6">
          {/* Header Identitas Lowongan & Specification Ribbon */}
          <header className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
              <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
                {/* Logo Perusahaan */}
                <CompanyAvatar name={companyName} logoUrl={org?.logoUrl} size="lg" />

                <div className="space-y-1.5 min-w-0 flex-1">
                  {/* Nama Perusahaan & Status Verifikasi */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-muted-foreground" title={companyName}>
                      {companyName}
                    </span>
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

                  {/* Judul Posisi Pekerjaan */}
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {job.title}
                  </h1>

                  {/* Badge Pengaturan Kerja, Tipe Kontrak, dan Lokasi */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold",
                        job.workArrangement === "remote"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                          : job.workArrangement === "hybrid"
                          ? "bg-purple-50 text-purple-800 border-purple-200/80"
                          : "bg-slate-100 text-slate-800 border-slate-200/80"
                      )}
                    >
                      {arrangementLabels[job.workArrangement]}
                    </span>

                    <span className="inline-flex items-center rounded-md border border-border/80 bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-foreground">
                      {employmentLabels[job.employmentType]}
                    </span>

                    {job.location && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        <MapPin className="size-3 text-muted-foreground/80 shrink-0" />
                        <span>{job.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 self-start sm:self-auto">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                    job.status === "published"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  )}
                >
                  <Clock className="size-3" />
                  <span>{statusLabels[job.status]}</span>
                </span>
              </div>
            </div>

            {/* Integrated Specification Ribbon: Gaji, Pengalaman, Pendidikan, Kuota */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-border/60">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Banknote className="size-3.5 text-emerald-600 shrink-0" />
                  Rentang Gaji
                </span>
                <p className="text-sm sm:text-base font-bold font-mono text-emerald-800">
                  {salaryText}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {job.isSalaryNegotiable ? "Dapat dinegosiasikan" : "Gaji tetap"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <BriefcaseBusiness className="size-3.5 text-primary shrink-0" />
                  Pengalaman Kerja
                </span>
                <p className="text-sm sm:text-base font-semibold text-foreground">
                  {expLabel ?? "Terbuka Semua Level"}
                </p>
                <p className="text-[11px] text-muted-foreground">Tingkat kecocokan karir</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap className="size-3.5 text-primary shrink-0" />
                  Pendidikan Minimal
                </span>
                <p className="text-sm sm:text-base font-semibold text-foreground">
                  {eduLabel ?? "Semua Jurusan"}
                </p>
                <p className="text-[11px] text-muted-foreground">Kualifikasi akademik</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary shrink-0" />
                  Kuota Penerimaan
                </span>
                <p className="text-sm sm:text-base font-semibold text-foreground">
                  {job.vacanciesCount ?? 1} Kandidat
                </p>
                <p className="text-[11px] text-muted-foreground">Posisi yang dibuka</p>
              </div>
            </div>
          </header>

          {/* Main Layout: Left Document Specification, Right Sticky Action & Company Card */}
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Left Column: Unified Document Container */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs divide-y divide-border/60">
              {/* Seksi 1: Deskripsi Pekerjaan */}
              <section className="py-8 first:pt-0 last:pb-0 space-y-3">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Deskripsi Pekerjaan
                </h2>
                <p className="whitespace-pre-wrap text-sm sm:text-[15px] leading-relaxed text-slate-700">
                  {job.description}
                </p>
              </section>

              {/* Seksi 2: Tanggung Jawab Utama */}
              {job.responsibilities && (
                <section className="py-8 first:pt-0 last:pb-0 space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Tanggung Jawab Utama
                  </h2>
                  <StructuredContentList content={job.responsibilities} bulletVariant="check" />
                </section>
              )}

              {/* Seksi 3: Kualifikasi & Persyaratan */}
              {job.qualifications && (
                <section className="py-8 first:pt-0 last:pb-0 space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Kualifikasi &amp; Persyaratan
                  </h2>
                  <StructuredContentList content={job.qualifications} bulletVariant="check" />
                </section>
              )}

              {/* Seksi 4: Keahlian yang Dibutuhkan */}
              {job.requirements && job.requirements.length > 0 && (
                <section className="py-8 first:pt-0 last:pb-0 space-y-4">
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Keahlian yang Dibutuhkan
                  </h2>

                  {job.requirements.some((r) => r.type === "required") && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Keahlian Utama (Required)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {job.requirements
                          .filter((r) => r.type === "required")
                          .map((req) => (
                            <span
                              key={req.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200/80 bg-purple-50/80 px-3 py-1 text-xs font-semibold text-purple-900 shadow-2xs"
                            >
                              <Check className="size-3 text-purple-700 stroke-[2.5]" />
                              {req.name}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {job.requirements.some((r) => r.type === "preferred") && (
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Keahlian Nilai Plus (Preferred)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {job.requirements
                          .filter((r) => r.type === "preferred")
                          .map((req) => (
                            <span
                              key={req.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-muted/60 px-3 py-1 text-xs font-medium text-foreground shadow-2xs"
                            >
                              <span className="text-primary font-bold">+</span>
                              {req.name}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Seksi 5: Fasilitas & Tunjangan */}
              {job.benefits && job.benefits.length > 0 && (
                <section className="py-8 first:pt-0 last:pb-0 space-y-4">
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Fasilitas &amp; Tunjangan
                  </h2>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {job.benefits.map((benefit) => (
                      <div
                        key={benefit}
                        className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/30 p-3 text-xs font-medium text-foreground"
                      >
                        <Check className="size-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                        <span className="leading-snug">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column: Sticky Sidebar (Aksi Lamar & Profil Perusahaan) */}
            <div className="space-y-6">
              <div className="sticky top-20 space-y-6">
                {/* Box 1: Aksi Lamar Utama */}
                <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Kirim Lamaran Anda
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Profil profesional dan CV terverifikasi Anda akan langsung diteruskan ke tim rekruter {companyName}.
                    </p>
                  </div>

                  <div className="pt-1">
                    {user?.role === "candidate" ? (
                      isClosed ? (
                        <Button disabled variant="outline" className="w-full h-11 rounded-xl font-semibold text-xs opacity-70">
                          Lowongan Ditutup
                        </Button>
                      ) : existingApp ? (
                        <Button
                          asChild
                          variant="outline"
                          className="w-full h-11 rounded-xl border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100/70 font-semibold text-xs gap-1.5 shadow-2xs"
                        >
                          <Link href="/candidate/applications">
                            <CheckCircle2 className="size-4 text-emerald-600" />
                            <span>Sudah Dilamar</span>
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setApplyModalOpen(true)}
                          className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-2 shadow-xs cursor-pointer transition-all"
                        >
                          <Send className="size-4" />
                          <span>Kirim Lamaran Sekarang</span>
                        </Button>
                      )
                    ) : user?.role === "recruiter" ? (
                      <Button asChild variant="outline" className="w-full h-11 rounded-xl border-border/80 font-semibold text-xs gap-1.5 shadow-2xs">
                        <Link href="/recruiter/jobs">
                          <BriefcaseBusiness className="size-4 text-primary" />
                          <span>Kelola Lowongan di Dashboard</span>
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-2 shadow-xs">
                        <Link href={`/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`}>
                          <Send className="size-4" />
                          <span>Masuk untuk Melamar</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Box 2: Profil Resmi Perusahaan */}
                <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                    <CompanyAvatar name={companyName} logoUrl={org?.logoUrl} size="md" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-foreground truncate" title={companyName}>
                        {companyName}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{org?.industry ?? "Industri Bisnis"}</p>
                    </div>
                  </div>

                  {org?.description && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">Tentang Perusahaan</span>
                      <p className="text-xs leading-relaxed text-slate-600">
                        {org.description}
                      </p>
                    </div>
                  )}

                  {org?.companyScale && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">Skala Perusahaan</span>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <Users className="size-3.5 text-primary shrink-0" />
                        <span>{org.companyScale}</span>
                      </div>
                    </div>
                  )}

                  {(org?.officeAddress || org?.city) && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">Alamat Kantor</span>
                      <div className="flex items-start gap-1.5 text-xs text-slate-600 leading-relaxed">
                        <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{formatOfficeAddress(org.officeAddress, org.city, org.province)}</span>
                      </div>
                    </div>
                  )}

                  {/* Kontak & Tautan Resmi */}
                  <div className="space-y-2 border-t border-border/60 pt-3">
                    <span className="text-[11px] font-semibold text-muted-foreground">Kontak &amp; Tautan Resmi</span>

                    {org?.companyEmail && (
                      <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 p-2.5 text-xs">
                        <span className="flex items-center gap-2 text-foreground font-medium truncate min-w-0" title={org.companyEmail}>
                          <Mail className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">{org.companyEmail}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => copyEmail(org.companyEmail!)}
                          title="Salin email"
                          aria-label="Salin email perusahaan"
                          className="text-primary hover:text-primary/80 p-1 rounded-md hover:bg-primary/10 transition-colors shrink-0 ml-1.5 cursor-pointer"
                        >
                          <Copy className="size-3.5" />
                        </button>
                      </div>
                    )}

                    {org?.companyPhone && (
                      <a
                        href={`tel:${org.companyPhone.replace(/[^\d+]/g, "")}`}
                        title={`Hubungi ${formatPhoneDisplay(org.companyPhone)}`}
                        className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 p-2.5 text-xs text-foreground font-medium hover:border-primary/40 transition-colors"
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
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-2 text-[11px] font-semibold text-foreground hover:border-primary/40 hover:text-primary transition shadow-2xs text-center"
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
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-2 text-[11px] font-semibold text-foreground hover:border-primary/40 hover:text-primary transition shadow-2xs text-center"
                          >
                            <ExternalLink className="size-3 text-primary shrink-0" />
                            <span className="truncate">LinkedIn</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
