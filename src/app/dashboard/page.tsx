"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Briefcase,
  Building2,
  Database,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Users,
  WalletCards,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { candidates as demoCandidates } from "@/data/candidates";
import { maskName } from "@/lib/candidate-display";
import { useApp } from "@/providers/app-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Candidate } from "@/types";
import {
  DEMO_JOBS,
  arrangementLabels,
  employmentLabels,
  statusLabels,
  type Job,
} from "@/lib/jobs";
import { useRouter } from "next/navigation";

const demoRecruiterJob: Job = {
  ...DEMO_JOBS[0],
  id: "demo-job-recruiter",
  organizationName: "Demo Company",
  title: "Senior UX Designer",
  status: "draft",
  publishedAt: null,
  requirements: [
    { id: "demo-recruiter-1", type: "required", name: "Figma" },
    { id: "demo-recruiter-2", type: "preferred", name: "Design Systems" },
  ],
};

function ActionRow({
  icon: Icon,
  title,
  desc,
  href,
  cta,
  iconBg = "bg-muted text-muted-foreground",
  buttonVariant = "outline",
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  href: string;
  cta: string;
  iconBg?: string;
  buttonVariant?: "default" | "outline";
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Button
        size="sm"
        variant={buttonVariant}
        asChild
        className="shrink-0 text-xs font-semibold"
      >
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

export default function Dashboard() {
  const router = useRouter();
  const {
    tokens,
    scans,
    shortlisted,
    recentlyViewed,
    user,
    dbMode,
    bootstrapped,
    databaseError,
    previewsUsed = 0,
  } = useApp();
  const [remoteCandidates, setRemoteCandidates] = useState<Candidate[]>([]);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [jobs, setJobs] = useState<Job[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("proofylink-demo-jobs");
      if (stored) {
        try {
          return JSON.parse(stored) as Job[];
        } catch {
          return [demoRecruiterJob, ...DEMO_JOBS];
        }
      }
    }
    return [demoRecruiterJob, ...DEMO_JOBS];
  });

  useEffect(() => {
    if (!user) return;
    if (user.role === "partner") {
      router.replace("/partner");
    }
  }, [user, router]);

  useEffect(() => {
    if (!dbMode || !bootstrapped) return;
    void fetch("/api/candidates?limit=12", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { candidates?: Candidate[] };
        if (response.ok) setRemoteCandidates(payload.candidates ?? []);
      })
      .catch(() => setRemoteCandidates([]))
      .finally(() => setRemoteLoaded(true));
  }, [dbMode, bootstrapped, user?.email]);

  useEffect(() => {
    if (!dbMode) return;
    let active = true;
    void fetch("/api/jobs?status=all", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { jobs?: Job[]; error?: string };
        if (response.ok && active) setJobs(payload.jobs ?? []);
      })
      .catch(() => {
        if (active) setJobs([]);
      });
    return () => {
      active = false;
    };
  }, [dbMode, user?.email]);

  const candidatesList = dbMode && remoteCandidates.length > 0 ? remoteCandidates : demoCandidates;
  const databaseEmpty = dbMode && bootstrapped && !databaseError && remoteLoaded && remoteCandidates.length === 0;

  const displayNameFor = (candidate: Candidate) =>
    scans.some((scan) => scan.candidateId === candidate.id) ? candidate.name : maskName(candidate.name);

  const recent = recentlyViewed
    .map((id) => candidatesList.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is Candidate => Boolean(candidate))
    .slice(0, 3);

  const scanned = scans
    .slice()
    .reverse()
    .map((scan) => {
      const candidate = candidatesList.find((c) => c.id === scan.candidateId);
      return candidate ? { candidate, scan } : null;
    })
    .filter((item): item is { candidate: Candidate; scan: (typeof scans)[0] } => Boolean(item));

  const shortlist = candidatesList
    .filter((candidate) => shortlisted.includes(candidate.id))
    .slice(0, 3);

  const remainingPreviewQuota = Math.max(0, 5 - previewsUsed);

  const stats = [
    {
      href: "/pricing",
      icon: WalletCards,
      label: "Saldo token",
      value: tokens,
      unit: "token",
      hint: tokens === 0 ? "Token akun habis" : "Kredit buka profil",
      colorClass: tokens === 0 ? "text-destructive" : "text-foreground",
    },
    {
      href: "/recruiter/discover",
      icon: Users,
      label: "Profil dibuka",
      value: scans.length,
      unit: "kandidat",
      hint: scans.length > 0 ? "Akses profil penuh" : "Belum ada profil dibuka",
      colorClass: "text-foreground",
    },
    {
      href: "/shortlist",
      icon: Bookmark,
      label: "Dalam shortlist",
      value: shortlisted.length,
      unit: "kandidat",
      hint: shortlisted.length > 0 ? "Siap diajukan screening" : "Belum ada kandidat",
      colorClass: shortlisted.length > 0 ? "text-primary" : "text-foreground",
    },
    {
      href: "/recruiter",
      icon: ShieldCheck,
      label: "Kuota trial",
      value: remainingPreviewQuota,
      unit: "pratinjau",
      hint: "Pratinjau profil gratis",
      colorClass: "text-emerald-600",
    },
  ];

  return (
    <ProtectedRoute role="recruiter">
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Halo, {user?.companyName || user?.name || "Recruiter"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Pantau saldo token, kandidat tersimpan, dan alur rekrutmen Anda.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild className="text-xs font-medium">
                <Link href="/recruiter/operations">
                  <Workflow className="mr-1.5 size-3.5" />
                  Pipeline
                </Link>
              </Button>
              <Button size="sm" asChild className="text-xs font-semibold">
                <Link href="/search">
                  <Search className="mr-1.5 size-3.5" />
                  Cari Talent
                </Link>
              </Button>
            </div>
          </div>

          {/* Action Alert (Perlu Perhatian) */}
          {tokens === 0 ? (
            <section aria-label="Perlu perhatian" className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Perlu perhatian</h2>
              <Card className="overflow-hidden border-border/80 bg-card shadow-xs">
                <div className="divide-y divide-border/60">
                  <ActionRow
                    icon={WalletCards}
                    title="Saldo token akun habis"
                    desc="Anda memerlukan token untuk membuka kontak dan resume kandidat lengkap."
                    href="/pricing"
                    cta="Beli Token"
                    iconBg="bg-red-100 text-destructive"
                    buttonVariant="default"
                  />
                </div>
              </Card>
            </section>
          ) : (
            tokens <= 5 && (
              <section aria-label="Perlu perhatian" className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">Perlu perhatian</h2>
                <Card className="overflow-hidden border-border/80 bg-card shadow-xs">
                  <div className="divide-y divide-border/60">
                    <ActionRow
                      icon={WalletCards}
                      title="Saldo token hampir habis"
                      desc={`Tersisa ${tokens} token untuk membuka profil kandidat baru.`}
                      href="/pricing"
                      cta="Top Up Token"
                      iconBg="bg-amber-100 text-amber-700"
                      buttonVariant="outline"
                    />
                  </div>
                </Card>
              </section>
            )
          )}

          {/* Database Mode Messages */}
          {dbMode && !bootstrapped ? (
            <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground" role="status">
              Memuat data database...
            </div>
          ) : dbMode && databaseError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700" role="alert">
              Data dashboard belum dapat dimuat. {databaseError}
            </div>
          ) : databaseEmpty ? (
            <EmptyState
              icon={Database}
              title="Belum ada kandidat di database."
              description="Mode database aktif dan daftar kandidat masih kosong, sehingga dashboard tidak mencampur data demo ke dalam sesi ini. Untuk melihat alur dengan data contoh, coba mode demo."
              action={
                <Button asChild>
                  <Link href="/search">Coba cari talent</Link>
                </Button>
              }
            />
          ) : (
            <>
              {/* Quick Stats Grid (Identical to Candidate Workspace) */}
              <section aria-label="Statistik utama">
                <Card className="overflow-hidden border-border/80 bg-border/60 shadow-xs">
                  <div className="grid grid-cols-2 gap-px sm:grid-cols-4">
                    {stats.map((stat) => (
                      <StatCell key={stat.label} {...stat} />
                    ))}
                  </div>
                </Card>
              </section>

              {/* Featured Recruitment Workflow Banner */}
              <section aria-label="Fitur utama rekruter">
                <Card className="overflow-hidden border-border/80 bg-card shadow-xs">
                  <ActionRow
                    icon={Workflow}
                    title="Pipeline Rekrutmen"
                    desc="Pantau alur seleksi, evaluasi kandidat aktif, dan kelola proses hiring secara langsung."
                    href="/recruiter/operations"
                    cta="Buka Pipeline"
                  />
                </Card>
              </section>

              {/* Job Management Section (Kelola Lowongan Pekerjaan) */}
              <section aria-label="Kelola lowongan pekerjaan" className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Kelola lowongan pekerjaan</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Pantau lowongan aktif dan publikasikan peran yang siap menerima kandidat
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {jobs.length > 0 && (
                      <Button variant="ghost" size="sm" asChild className="text-xs font-medium text-primary hover:text-primary">
                        <Link href="/recruiter/jobs">
                          Lihat Semua ({jobs.length})
                          <ArrowRight className="ml-1 size-3.5" />
                        </Link>
                      </Button>
                    )}
                    <Button size="sm" asChild className="h-7 px-2.5 text-xs font-semibold">
                      <Link href="/recruiter/jobs/new">
                        <Plus className="mr-1 size-3" />
                        Buat Lowongan
                      </Link>
                    </Button>
                  </div>
                </div>

                {jobs.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {jobs.slice(0, 3).map((job) => (
                      <Card key={job.id} className="border-border/80 bg-card shadow-xs transition-colors hover:bg-muted/40">
                        <CardContent className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold text-foreground">
                                {job.title}
                              </h3>
                              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <Building2 className="size-3 shrink-0" />
                                {job.organizationName || user?.companyName || "Perusahaan"}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <MapPin className="size-3 shrink-0" />
                                {job.location || "Indonesia"} · {employmentLabels[job.employmentType]}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                job.status === "published"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : job.status === "closed"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {statusLabels[job.status]}
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
                            <span className="text-muted-foreground">
                              {job.workArrangement ? arrangementLabels[job.workArrangement] : "Full-time"}
                            </span>
                            <Button variant="outline" size="sm" asChild className="h-7 px-2.5 text-xs">
                              <Link href={`/recruiter/jobs/${job.id}`}>
                                Kelola
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
                    <h3 className="text-sm font-semibold text-foreground">Belum ada lowongan pekerjaan</h3>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                      Publikasikan peran baru untuk mulai menerima lamaran dan mencocokkan talenta terverifikasi.
                    </p>
                    <Button size="sm" asChild className="mt-4 text-xs font-semibold">
                      <Link href="/recruiter/jobs/new">
                        <Plus className="mr-1.5 size-3.5" />
                        Buat lowongan pekerjaan
                      </Link>
                    </Button>
                  </Card>
                )}
              </section>

              {/* Shortlisted Candidates */}
              {shortlist.length > 0 && (
                <section aria-label="Shortlist kandidat" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">Kandidat di shortlist</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">Kandidat tersimpan yang siap diproses ke alur screening</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="text-xs font-medium text-primary hover:text-primary">
                      <Link href="/shortlist">
                        Lihat Semua ({shortlist.length})
                        <ArrowRight className="ml-1 size-3.5" />
                      </Link>
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {shortlist.map((candidate) => (
                      <Card key={candidate.id} className="border-border/80 bg-card shadow-xs transition-colors hover:bg-muted/40">
                        <CardContent className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold text-foreground">
                                {displayNameFor(candidate)}
                              </h3>
                              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <Briefcase className="size-3 shrink-0" />
                                {candidate.role}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <MapPin className="size-3 shrink-0" />
                                {candidate.location}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                              Shortlisted
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
                            <span className="text-muted-foreground">
                              {candidate.salary || "Gaji fleksibel"}
                            </span>
                            <Button variant="outline" size="sm" asChild className="h-7 px-2.5 text-xs">
                              <Link href={`/talent/${candidate.id}`}>
                                Detail
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Recent Sourcing Activity (Only if recent viewed exist) */}
              {recent.length > 0 && (
                <section aria-label="Kandidat terakhir dilihat" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">Kandidat terakhir dilihat</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">Profil yang baru saja Anda tinjau di jaringan talent</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="text-xs font-medium text-primary hover:text-primary">
                      <Link href="/search">
                        Lihat Semua ({recent.length})
                        <ArrowRight className="ml-1 size-3.5" />
                      </Link>
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {recent.map((candidate) => {
                      const isUnlocked = scans.some((s) => s.candidateId === candidate.id);
                      return (
                        <Card key={candidate.id} className="border-border/80 bg-card shadow-xs transition-colors hover:bg-muted/40">
                          <CardContent className="space-y-3 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold text-foreground">
                                  {displayNameFor(candidate)}
                                </h3>
                                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                                  <Briefcase className="size-3 shrink-0" />
                                  {candidate.role}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                                  <MapPin className="size-3 shrink-0" />
                                  {candidate.location}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                  isUnlocked
                                    ? "bg-emerald-50 text-emerald-700"
                                    : candidate.talentCategory === "djoin-verified"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {isUnlocked
                                  ? "Terbuka"
                                  : candidate.talentCategory === "djoin-verified"
                                  ? "Verified"
                                  : "Pratinjau"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
                              <span className="text-muted-foreground">
                                {candidate.experience} thn pengalaman
                              </span>
                              <Button variant="outline" size="sm" asChild className="h-7 px-2.5 text-xs">
                                <Link href={`/recruiter/discover/${candidate.id}`}>
                                  Detail
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Profile Unlock History (Audit Log - Scrollable Window) */}
              {scanned.length > 0 && (
                <section aria-label="Riwayat buka profil" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">Riwayat buka profil</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">Kandidat yang telah dibuka menggunakan token akun</p>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{scanned.length} profil dibuka</span>
                  </div>
                  <Card className="overflow-hidden border-border/80 bg-card shadow-xs">
                    <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
                      {scanned.map(({ candidate }) => (
                        <div key={candidate.id} className="flex items-center justify-between gap-4 p-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
                              {candidate.initials || candidate.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-medium text-foreground">
                                  {displayNameFor(candidate)}
                                </span>
                                <span className="rounded bg-slate-100 px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
                                  -1 Token
                                </span>
                              </div>
                              <p className="truncate text-xs text-muted-foreground">
                                {candidate.role} • {candidate.location}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild className="h-7 shrink-0 px-2.5 text-xs">
                            <Link href={`/talent/${candidate.id}`}>
                              Buka Profil
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
