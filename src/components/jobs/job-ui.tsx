"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, MapPin, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  return <Card className="overflow-hidden transition-shadow hover:shadow-md"><CardHeader className="gap-3"><div className="flex items-start justify-between gap-3"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-primary"><BriefcaseBusiness className="size-5" /></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${job.status === "published" ? "bg-emerald-50 text-emerald-700" : job.status === "closed" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"}`}>{statusLabels[job.status]}</span></div><div><CardTitle className="text-xl">{job.title}</CardTitle><p className="mt-1 text-sm font-medium text-muted-foreground">{job.organizationName}</p></div></CardHeader><CardContent className="space-y-4"><p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{job.description}</p><div className="flex flex-wrap gap-2 text-xs font-medium text-secondary-foreground"><span className="rounded-full bg-muted px-2.5 py-1">{employmentLabels[job.employmentType]}</span><span className="rounded-full bg-muted px-2.5 py-1">{arrangementLabels[job.workArrangement]}</span>{job.location && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><MapPin className="size-3" />{job.location}</span>}</div><div className="flex flex-wrap gap-1.5">{job.requirements.slice(0, 4).map((req) => <span key={req.id} className="rounded-md border px-2 py-1 text-xs text-muted-foreground">{req.name}</span>)}{job.requirements.length > 4 && <span className="px-1 py-1 text-xs text-muted-foreground">+{job.requirements.length - 4}</span>}</div><Button asChild variant="outline" className="w-full"><Link href={`/jobs/${job.id}`}>Lihat detail & apply <span aria-hidden="true">-&gt;</span></Link></Button></CardContent></Card>;
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
  return <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-12"><div className="rounded-3xl bg-[#201C45] p-6 text-white sm:p-10"><div className="max-w-2xl"><p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-fuchsia-300"><Sparkles className="size-4" /> Peluang terkurasi</p><h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Cari pekerjaan yang terasa tepat.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Temukan peran dari organisasi yang membangun produk berdampak, dengan detail yang jelas sejak awal.</p></div><div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]"><label className="flex items-center gap-3 rounded-xl bg-white px-4 text-foreground"><Search className="size-4 text-muted-foreground" /><span className="sr-only">Cari job</span><input value={query} onChange={(event) => syncParams(event.target.value, arrangement)} placeholder="Cari title, company, atau keyword" className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><select aria-label="Filter work arrangement" value={arrangement} onChange={(event) => syncParams(query, event.target.value)} className="h-12 rounded-xl border-0 bg-white px-4 text-sm text-foreground outline-none"><option value="all">Semua arrangement</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></div></div><div className="mt-8 flex items-end justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-widest text-primary">Job discovery</p><h2 className="mt-2 text-2xl font-bold">Lowongan tersedia</h2></div><span className="text-sm text-muted-foreground">{filtered.length} lowongan</span></div>{loading ? <State text="Memuat lowongan..." /> : error ? <State text={error} error /> : filtered.length === 0 ? <State text="Belum ada lowongan yang cocok. Coba ubah kata kunci atau filter." /> : <><div className="mt-5 grid gap-5 md:grid-cols-2">{filtered.map((job) => <JobCard key={job.id} job={job} />)}</div>{hasMore && <div className="mt-6 flex justify-center"><Button variant="outline" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Memuat..." : "Muat lebih banyak"}</Button></div>}</>}<p className="mt-8 text-xs text-muted-foreground">Mode demo: data lowongan di atas adalah fixture lokal dan tidak membuat application palsu.</p></main>;
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
  return <main className="container mx-auto max-w-4xl px-4 py-8 sm:py-12"><Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="size-4" /> Semua lowongan</Link>{loading ? <State text="Memuat detail job..." /> : error || !job ? <State text={error ?? "Job tidak ditemukan."} error /> : <><div className="mt-7"><p className="font-mono text-xs uppercase tracking-widest text-primary">Job detail</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">{job.title}</h1><p className="mt-2 text-lg font-medium text-muted-foreground">{job.organizationName}</p><div className="mt-5 flex flex-wrap gap-2 text-xs font-medium"><span className="rounded-full bg-muted px-3 py-1.5">{employmentLabels[job.employmentType]}</span><span className="rounded-full bg-muted px-3 py-1.5">{arrangementLabels[job.workArrangement]}</span>{job.location && <span className="rounded-full bg-muted px-3 py-1.5">{job.location}</span>}</div></div><Card className="mt-8"><CardHeader><CardTitle>Tentang peran ini</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{job.description}</p><h2 className="mt-7 font-semibold">Skills</h2><div className="mt-3 flex flex-wrap gap-2">{job.requirements.map((requirement) => <span key={requirement.id} className="rounded-md border px-2.5 py-1.5 text-xs text-muted-foreground">{requirement.name}</span>)}</div></CardContent></Card>{user?.role === "candidate" ? (isClosed ? <p className="mt-8 rounded-xl bg-muted p-4 text-sm text-muted-foreground">Lowongan ini sudah ditutup dan tidak lagi menerima lamaran.</p> : <ApplyForm job={job} />) : user?.role === "recruiter" ? <p className="mt-8 rounded-xl bg-muted p-4 text-sm text-muted-foreground">Recruiter dapat melihat detail job, tetapi tidak dapat mengirim lamaran.</p> : <Card className="mt-8"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Masuk sebagai kandidat untuk melamar job ini.</p><Button asChild className="mt-4"><Link href={`/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`}>Masuk untuk melamar</Link></Button></CardContent></Card>}</>}</main>;
}

function State({ text, error = false }: { text: string; error?: boolean }) { return <div className={`mt-5 rounded-2xl border p-8 text-center text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "bg-card text-muted-foreground"}`} role={error ? "alert" : "status"}>{text}</div>; }
