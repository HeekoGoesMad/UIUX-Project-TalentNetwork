"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/providers/app-provider";
import { DEMO_JOBS, arrangementLabels, employmentLabels, statusLabels, type Job } from "@/lib/jobs";
import { ApplyForm } from "@/components/applications/application-ui";

const PAGE_LIMIT = 24;

type JobsPayload = { jobs?: Job[]; hasMore?: boolean; error?: string };

function useJobs() {
  const { dbMode } = useApp();
  const [jobs, setJobs] = useState<Job[]>([]); const [loading, setLoading] = useState(true); const [loadingMore, setLoadingMore] = useState(false); const [error, setError] = useState<string | null>(null); const [page, setPage] = useState(1); const [hasMore, setHasMore] = useState(false);
  useEffect(() => { let active = true; setPage(1); if (!dbMode) { const stored = localStorage.getItem("proofylink-demo-jobs"); const parsed = stored ? JSON.parse(stored) as Job[] : DEMO_JOBS; if (active) { setJobs(parsed.filter((job) => job.status === "published")); setHasMore(false); setLoading(false); } return () => { active = false; }; }
    setLoading(true); setError(null);
    fetch(`/api/jobs?page=1&limit=${PAGE_LIMIT}`, { cache: "no-store" }).then(async (response) => { const payload = await response.json() as JobsPayload; if (!response.ok) throw new Error(payload.error ?? "Job belum dapat dimuat."); if (active) { setJobs(payload.jobs ?? []); setHasMore(payload.hasMore ?? false); } }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Job belum dapat dimuat."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [dbMode]);
  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setLoadingMore(true);
    fetch(`/api/jobs?page=${next}&limit=${PAGE_LIMIT}`, { cache: "no-store" }).then(async (response) => { const payload = await response.json() as JobsPayload; if (!response.ok) throw new Error(payload.error ?? "Job belum dapat dimuat."); setJobs((current) => [...current, ...(payload.jobs ?? [])]); setPage(next); setHasMore(payload.hasMore ?? false); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Job belum dapat dimuat.")).finally(() => setLoadingMore(false));
  };
  return { jobs, loading, loadingMore, error, hasMore, loadMore };
}

function JobCard({ job }: { job: Job }) {
  return (
    <Card className="rounded-lg shadow-xs">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Badge variant={job.status === "published" ? "secondary" : "outline"}>{statusLabels[job.status]}</Badge>
        </div>
        <div>
          <CardTitle className="text-base font-semibold">{job.title}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{job.organizationName}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{job.description}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{employmentLabels[job.employmentType]}</Badge>
          <Badge variant="secondary">{arrangementLabels[job.workArrangement]}</Badge>
          {job.location && (
            <Badge variant="secondary" className="gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {job.location}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {job.requirements.slice(0, 4).map((req) => (
            <span key={req.id} className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
              {req.name}
            </span>
          ))}
          {job.requirements.length > 4 && (
            <span className="px-1 py-1 text-xs text-muted-foreground">+{job.requirements.length - 4}</span>
          )}
        </div>
        <Button asChild variant="outline" className="w-full rounded-md">
          <Link href={`/jobs/${job.id}`}>Lihat detail</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function PublicJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const rawArrangement = searchParams.get("arrangement");
  const arrangement = rawArrangement === "remote" || rawArrangement === "hybrid" || rawArrangement === "onsite" ? rawArrangement : "all";
  const { jobs, loading, loadingMore, error, hasMore, loadMore } = useJobs();
  const filtered = useMemo(() => jobs.filter((job) => (!query || `${job.title} ${job.organizationName} ${job.description}`.toLowerCase().includes(query.toLowerCase())) && (arrangement === "all" || job.workArrangement === arrangement)), [jobs, query, arrangement]);
  const syncParams = (nextQuery: string, nextArrangement: string) => {
    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    if (nextArrangement !== "all") params.set("arrangement", nextArrangement);
    const qs = params.toString();
    router.replace(qs ? `/jobs?${qs}` : "/jobs", { scroll: false });
  };
  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Lowongan kerja</h1>
        <p className="mt-1 text-sm text-muted-foreground">Temukan peran dari organisasi dengan detail yang jelas sejak awal.</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-2 rounded-md border bg-card px-3 shadow-xs">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Cari lowongan</span>
          <input
            value={query}
            onChange={(event) => syncParams(event.target.value, arrangement)}
            placeholder="Cari judul, perusahaan, atau kata kunci"
            className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <select
          aria-label="Filter tipe kerja"
          value={arrangement}
          onChange={(event) => syncParams(query, event.target.value)}
          className="h-9 rounded-md border bg-card px-3 text-sm text-foreground shadow-xs outline-none"
        >
          <option value="all">Semua tipe kerja</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
        </select>
      </div>
      <div className="mt-6">
        <p className="text-sm text-muted-foreground" role="status">
          {filtered.length} lowongan
        </p>
      </div>
      {loading ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="rounded-lg shadow-xs border-border/80">
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-24 rounded-md" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Skeleton className="h-6 w-14 rounded-md" />
                  <Skeleton className="h-6 w-20 rounded-md" />
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
                <Skeleton className="h-9 w-full rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <State text={error} error />
      ) : filtered.length === 0 ? (
        <State text="Belum ada lowongan yang cocok. Coba ubah kata kunci atau filter." />
      ) : (
        <>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="rounded-md">
                {loadingMore ? "Memuat..." : "Muat lebih banyak"}
              </Button>
            </div>
          )}
        </>
      )}
      <p className="mt-8 text-xs text-muted-foreground">Mode demo: data lowongan di atas adalah fixture lokal dan tidak membuat application palsu.</p>
    </main>
  );
}

export function JobDetailPage({ jobId }: { jobId: string }) {
  const { dbMode, user } = useApp();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!dbMode) {
      const stored = localStorage.getItem("proofylink-demo-jobs");
      const jobs = stored ? JSON.parse(stored) as Job[] : DEMO_JOBS;
      setJob(jobs.find((item) => item.id === jobId) ?? null);
      setLoading(false);
      return;
    }
    fetch(`/api/jobs/${jobId}`, { cache: "no-store" }).then(async (response) => {
      const payload = await response.json() as { job?: Job; error?: string };
      if (!response.ok || !payload.job) throw new Error(payload.error ?? "Job tidak ditemukan.");
      setJob(payload.job);
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Job tidak ditemukan.")).finally(() => setLoading(false));
  }, [dbMode, jobId]);
  const isClosed = job?.status !== "published";
  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Semua lowongan
      </Link>
      {loading ? (
        <div className="space-y-6 mt-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <div className="flex flex-wrap gap-2 pt-2">
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-6 w-28 rounded-md" />
            </div>
          </div>
          <Card className="rounded-lg shadow-xs border-border/80 p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
            <div className="pt-4">
              <Skeleton className="h-10 w-36 rounded-md" />
            </div>
          </Card>
        </div>
      ) : error || !job ? (
        <State text={error ?? "Lowongan tidak ditemukan."} error />
      ) : (
        <>
          <div className="mt-6">
            <h1 className="text-2xl font-semibold">{job.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{job.organizationName}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">{employmentLabels[job.employmentType]}</Badge>
              <Badge variant="secondary">{arrangementLabels[job.workArrangement]}</Badge>
              {job.location && <Badge variant="secondary">{job.location}</Badge>}
            </div>
          </div>
          <Card className="mt-6 rounded-lg shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Tentang peran ini</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{job.description}</p>
              <h2 className="mt-6 text-sm font-semibold">Skills</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.requirements.map((requirement) => (
                  <span key={requirement.id} className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                    {requirement.name}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          {user?.role === "candidate" ? (
            isClosed ? (
              <p className="mt-6 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                Lowongan ini sudah ditutup dan tidak lagi menerima lamaran.
              </p>
            ) : (
              <ApplyForm job={job} />
            )
          ) : user?.role === "recruiter" ? (
            <p className="mt-6 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              Recruiter dapat melihat detail lowongan, tetapi tidak dapat mengirim lamaran.
            </p>
          ) : (
            <Card className="mt-6 rounded-lg shadow-xs">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Masuk sebagai kandidat untuk melamar lowongan ini.</p>
                <Button asChild className="mt-4 rounded-md">
                  <Link href={`/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`}>Masuk untuk melamar</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </main>
  );
}

function State({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <div
      className={
        error
          ? "mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive"
          : "mt-4 rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground"
      }
      role={error ? "alert" : "status"}
    >
      {text}
    </div>
  );
}
