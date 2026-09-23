"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  Calendar,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  Layers,
  MapPin,
  Plus,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useApp } from "@/providers/app-provider";
import {
  COMMON_BENEFITS,
  DEMO_JOBS,
  EDUCATION_LEVELS,
  EXPERIENCE_LEVELS,
  JOB_CATEGORIES,
  arrangementLabels,
  categoryLabels,
  educationLabels,
  employmentLabels,
  experienceLabels,
  formatSalaryDisplay,
  statusLabels,
  type EducationLevel,
  type EmploymentType,
  type ExperienceLevel,
  type Job,
  type JobStatus,
  type WorkArrangement,
} from "@/lib/jobs";

const demoRecruiterJob: Job = {
  ...DEMO_JOBS[0],
  id: "demo-job-recruiter",
  organizationName: "Demo Company",
  title: "Senior UX Designer",
  status: "draft",
  publishedAt: null,
  salaryMin: 12000000,
  salaryMax: 17000000,
  salaryCurrency: "IDR",
  salaryPeriod: "monthly",
  isSalaryNegotiable: true,
  hideSalary: false,
  experienceLevel: "3_5_years",
  minEducation: "bachelor",
  jobCategory: "design_creative",
  responsibilities:
    "• Memimpin proses perancangan desain antarmuka end-to-end.\n• Mengembangkan Design System bersama tim engineer.\n• Melakukan usability testing dan wawancara kandidat.",
  qualifications:
    "• Minimal 3 tahun pengalaman kerja profesional di bidang Product Design.\n• Mahir Figma dan design token.\n• Komunikasi baik dan kolaboratif.",
  benefits: ["BPJS Kesehatan & Ketenagakerjaan", "Laptop Kerja", "Jam Kerja Fleksibel", "Asuransi Kesehatan Swasta"],
  vacanciesCount: 1,
  requirements: [
    { id: "demo-recruiter-1", type: "required", name: "Figma" },
    { id: "demo-recruiter-2", type: "preferred", name: "Design Systems" },
  ],
};

function useJobs(recruiter = false) {
  const { dbMode } = useApp();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    if (!dbMode) {
      const stored = localStorage.getItem("proofylink-demo-jobs");
      const parsed = stored ? (JSON.parse(stored) as Job[]) : [demoRecruiterJob, ...DEMO_JOBS];
      const visible = recruiter ? parsed : parsed.filter((job) => job.status === "published");
      setJobs(visible);
      setLoading(false);
      return () => {
        active = false;
      };
    }
    fetch(`/api/jobs${recruiter ? "?status=all" : ""}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { jobs?: Job[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Job belum dapat dimuat.");
        if (active) setJobs(payload.jobs ?? []);
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
  }, [dbMode, recruiter]);

  return { jobs, setJobs, loading, error, dbMode };
}

function JobCard({ job, manage = false }: { job: Job; manage?: boolean }) {
  const salaryText = formatSalaryDisplay(job);
  const expLabel = job.experienceLevel
    ? experienceLabels[job.experienceLevel as ExperienceLevel] ?? job.experienceLevel
    : null;
  const eduLabel = job.minEducation
    ? educationLabels[job.minEducation as EducationLevel] ?? job.minEducation
    : null;

  return (
    <Card className="flex flex-col justify-between overflow-hidden transition-all duration-200 hover:shadow-md border-border/80">
      <CardHeader className="gap-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-primary">
            <BriefcaseBusiness className="size-5" />
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              job.status === "published"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                : job.status === "closed"
                ? "bg-slate-100 text-slate-600"
                : "bg-amber-50 text-amber-700 border border-amber-200/60"
            }`}
          >
            {statusLabels[job.status]}
          </span>
        </div>
        <div>
          <CardTitle className="text-lg font-bold tracking-tight hover:text-primary transition-colors">
            {job.title}
          </CardTitle>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{job.organizationName}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Highlight Gaji ala Glints */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50/70 border border-emerald-200/60 rounded-lg px-2.5 py-1.5 w-fit">
          <Banknote className="size-3.5" />
          <span>{salaryText}</span>
        </div>

        <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{job.description}</p>

        {/* Kriteria & Penempatan */}
        <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-secondary-foreground">
          <span className="rounded-md bg-muted px-2 py-0.5">{employmentLabels[job.employmentType]}</span>
          <span className="rounded-md bg-muted px-2 py-0.5">{arrangementLabels[job.workArrangement]}</span>
          {job.location && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
              <MapPin className="size-3" />
              {job.location}
            </span>
          )}
          {expLabel && (
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 text-indigo-700 px-2 py-0.5">
              <BriefcaseBusiness className="size-3" />
              {expLabel}
            </span>
          )}
          {eduLabel && (
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 text-purple-700 px-2 py-0.5">
              <GraduationCap className="size-3" />
              {eduLabel}
            </span>
          )}
        </div>

        {/* Skill badges */}
        <div className="flex flex-wrap gap-1">
          {job.requirements.slice(0, 3).map((req) => (
            <span key={req.id} className="rounded border bg-white px-2 py-0.5 text-[11px] text-muted-foreground">
              {req.name}
            </span>
          ))}
          {job.requirements.length > 3 && (
            <span className="px-1 py-0.5 text-[11px] text-muted-foreground">+{job.requirements.length - 3}</span>
          )}
        </div>

        {manage ? (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/recruiter/jobs/${job.id}`}>
              Kelola Lowongan <span aria-hidden="true">&rarr;</span>
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/jobs/${job.id}`}>
              Lihat detail &amp; apply <span aria-hidden="true">&rarr;</span>
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function State({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <div
      className={`mt-5 rounded-2xl border p-8 text-center text-sm ${
        error ? "border-red-200 bg-red-50 text-red-700" : "bg-card text-muted-foreground"
      }`}
      role={error ? "alert" : "status"}
    >
      {text}
    </div>
  );
}

export function RecruiterJobsPage() {
  const { jobs, loading, error, dbMode } = useJobs(true);
  const [filter, setFilter] = useState<JobStatus | "all">("all");
  const visible = filter === "all" ? jobs : jobs.filter((job) => job.status === filter);

  return (
    <ProtectedRoute role="recruiter">
      <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Recruiter workspace</p>
            <h1 className="mt-2 text-3xl font-bold">Lowongan Kerja</h1>
            <p className="mt-2 text-muted-foreground">
              Kelola lowongan aktif, pantau kriteria kualifikasi, dan buka kesempatan bagi talenta terverifikasi.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/recruiter/jobs/new">
              <Plus className="size-4" /> Buat Lowongan Baru
            </Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {(["all", "draft", "published", "closed"] as const).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? "default" : "outline"}
              onClick={() => setFilter(value)}
            >
              {value === "all" ? "Semua Status" : statusLabels[value]}
            </Button>
          ))}
        </div>

        {loading ? (
          <State text="Memuat daftar lowongan pekerjaan..." />
        ) : error ? (
          <State text={error} error />
        ) : visible.length === 0 ? (
          <State text="Belum ada lowongan pada kategori ini. Silakan buat lowongan pertama Anda." />
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((job) => (
              <JobCard key={job.id} job={job} manage />
            ))}
          </div>
        )}

        {!dbMode && (
          <p className="mt-8 text-xs text-muted-foreground">
            Mode demo recruiter aktif: penambahan dan perubahan tersimpan di memori browser lokal ini.
          </p>
        )}
      </main>
    </ProtectedRoute>
  );
}

type FormValues = {
  title: string;
  jobCategory: string;
  employmentType: EmploymentType;
  workArrangement: WorkArrangement;
  location: string;
  vacanciesCount: number;
  expiresAt: string;
  // Gaji
  showSalary: boolean;
  salaryMin: string;
  salaryMax: string;
  salaryPeriod: string;
  isSalaryNegotiable: boolean;
  // Kriteria
  experienceLevel: string;
  minEducation: string;
  requiredSkills: string;
  preferredSkills: string;
  // Deskripsi & Rincian
  description: string;
  responsibilities: string;
  qualifications: string;
  benefits: string[];
};

const initialForm: FormValues = {
  title: "",
  jobCategory: "engineering_it",
  employmentType: "full_time",
  workArrangement: "hybrid",
  location: "",
  vacanciesCount: 1,
  expiresAt: "",
  showSalary: true,
  salaryMin: "",
  salaryMax: "",
  salaryPeriod: "monthly",
  isSalaryNegotiable: false,
  experienceLevel: "1_3_years",
  minEducation: "bachelor",
  requiredSkills: "",
  preferredSkills: "",
  description: "",
  responsibilities: "",
  qualifications: "",
  benefits: ["BPJS Ketenagakerjaan", "BPJS Kesehatan", "Jam Kerja Fleksibel"],
};

function skillNames(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function JobFormPage() {
  const router = useRouter();
  const { dbMode } = useApp();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [customBenefit, setCustomBenefit] = useState("");
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleBenefit = (benefit: string) => {
    setForm((prev) => {
      const exists = prev.benefits.includes(benefit);
      return {
        ...prev,
        benefits: exists ? prev.benefits.filter((b) => b !== benefit) : [...prev.benefits, benefit],
      };
    });
  };

  const addCustomBenefit = () => {
    const trimmed = customBenefit.trim();
    if (!trimmed) return;
    if (!form.benefits.includes(trimmed)) {
      setForm((prev) => ({ ...prev, benefits: [...prev.benefits, trimmed] }));
    }
    setCustomBenefit("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const minSal = form.salaryMin ? parseInt(form.salaryMin.replace(/\D/g, ""), 10) : null;
    const maxSal = form.salaryMax ? parseInt(form.salaryMax.replace(/\D/g, ""), 10) : null;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      jobCategory: form.jobCategory,
      employmentType: form.employmentType,
      workArrangement: form.workArrangement,
      location: form.location.trim() || null,
      vacanciesCount: Number(form.vacanciesCount) || 1,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      // Gaji
      hideSalary: !form.showSalary,
      salaryMin: minSal,
      salaryMax: maxSal,
      salaryCurrency: "IDR",
      salaryPeriod: form.salaryPeriod,
      isSalaryNegotiable: form.isSalaryNegotiable,
      // Kriteria
      experienceLevel: form.experienceLevel || null,
      minEducation: form.minEducation || null,
      requiredSkills: skillNames(form.requiredSkills),
      preferredSkills: skillNames(form.preferredSkills),
      // Rincian
      responsibilities: form.responsibilities.trim() || null,
      qualifications: form.qualifications.trim() || null,
      benefits: form.benefits,
    };

    try {
      if (dbMode) {
        const response = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = (await response.json()) as { job?: Job; error?: string };
        if (!response.ok || !result.job) throw new Error(result.error ?? "Job tidak dapat dibuat.");

        if (publishImmediately) {
          await fetch(`/api/jobs/${result.job.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "published" }),
          });
        }
        router.push(`/recruiter/jobs/${result.job.id}`);
      } else {
        const job: Job = {
          ...payload,
          id: `demo-job-${Date.now()}`,
          organizationName: "Perusahaan Anda",
          status: publishImmediately ? "published" : "draft",
          publishedAt: publishImmediately ? new Date().toISOString() : null,
          closedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          requirements: [
            ...payload.requiredSkills.map((name, index) => ({
              id: `req-${Date.now()}-${index}`,
              name,
              type: "required" as const,
            })),
            ...payload.preferredSkills.map((name, index) => ({
              id: `pref-${Date.now()}-${index}`,
              name,
              type: "preferred" as const,
            })),
          ],
        };
        const jobs = JSON.parse(
          localStorage.getItem("proofylink-demo-jobs") ?? JSON.stringify([demoRecruiterJob, ...DEMO_JOBS])
        ) as Job[];
        localStorage.setItem("proofylink-demo-jobs", JSON.stringify([job, ...jobs]));
        router.push(`/recruiter/jobs/${job.id}`);
      }
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Job tidak dapat dibuat.");
    } finally {
      setSaving(false);
    }
  };

  const fieldInputClass =
    "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";
  const fieldTextareaClass =
    "min-h-24 w-full rounded-lg border border-input bg-transparent p-3 text-sm shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

  return (
    <ProtectedRoute role="recruiter">
      <main className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <Link href="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" /> Kembali ke kelola lowongan
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-primary">Formulir Rekrutmen Glints</span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Pasang Lowongan Pekerjaan</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Lengkapi kriteria, rentang gaji, dan deskripsi terstruktur agar lowongan Anda diminati kandidat terbaik.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-8">
          {/* Section 1: Informasi Posisi & Penempatan */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BriefcaseBusiness className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">1. Informasi Pekerjaan &amp; Penempatan</CardTitle>
                  <CardDescription className="text-xs">
                    Identitas posisi yang akan dicari kandidat di halaman eksplorasi.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>Judul Posisi Pekerjaan</span>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded px-1.5 py-0.2 uppercase">
                      Wajib
                    </span>
                  </label>
                  <Input
                    required
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="Contoh: Senior Frontend Engineer / Product Designer"
                    className={fieldInputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Kategori / Fungsi Pekerjaan</label>
                  <select
                    value={form.jobCategory}
                    onChange={(e) => update("jobCategory", e.target.value)}
                    className={fieldInputClass}
                  >
                    {JOB_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Tipe Ikatan Kerja</label>
                  <select
                    value={form.employmentType}
                    onChange={(e) => update("employmentType", e.target.value as EmploymentType)}
                    className={fieldInputClass}
                  >
                    {Object.entries(employmentLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Pengaturan Kerja</label>
                  <select
                    value={form.workArrangement}
                    onChange={(e) => update("workArrangement", e.target.value as WorkArrangement)}
                    className={fieldInputClass}
                  >
                    {Object.entries(arrangementLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Lokasi Kerja / Penempatan Kantor</label>
                  <Input
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="Contoh: Jakarta Selatan, DKI Jakarta atau Remote"
                    className={fieldInputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Jumlah Kuota Lowongan</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.vacanciesCount}
                    onChange={(e) => update("vacanciesCount", Number(e.target.value) || 1)}
                    className={fieldInputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="size-3 text-muted-foreground" />
                    <span>Batas Akhir Pendaftaran (Opsional)</span>
                  </label>
                  <Input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => update("expiresAt", e.target.value)}
                    className={fieldInputClass}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Kompensasi & Gaji Ala Glints */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Banknote className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">2. Kompensasi &amp; Estimasi Gaji</CardTitle>
                    <CardDescription className="text-xs">
                      Standar transparansi Glints untuk menarik pelamar berkualitas tinggi.
                    </CardDescription>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => update("showSalary", !form.showSalary)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    form.showSalary
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {form.showSalary ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                  <span>{form.showSalary ? "Gaji Ditampilkan" : "Gaji Dirahasiakan"}</span>
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {form.showSalary ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Gaji Minimum (IDR)</label>
                      <Input
                        type="number"
                        step={500000}
                        placeholder="Contoh: 8000000"
                        value={form.salaryMin}
                        onChange={(e) => update("salaryMin", e.target.value)}
                        className={fieldInputClass}
                      />
                      {form.salaryMin && (
                        <p className="text-[11px] font-medium text-emerald-600">
                          Rp {parseInt(form.salaryMin, 10).toLocaleString("id-ID")}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Gaji Maksimum (IDR)</label>
                      <Input
                        type="number"
                        step={500000}
                        placeholder="Contoh: 15000000"
                        value={form.salaryMax}
                        onChange={(e) => update("salaryMax", e.target.value)}
                        className={fieldInputClass}
                      />
                      {form.salaryMax && (
                        <p className="text-[11px] font-medium text-emerald-600">
                          Rp {parseInt(form.salaryMax, 10).toLocaleString("id-ID")}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Periode Gaji</label>
                      <select
                        value={form.salaryPeriod}
                        onChange={(e) => update("salaryPeriod", e.target.value)}
                        className={fieldInputClass}
                      >
                        <option value="monthly">Per Bulan (Bulanan)</option>
                        <option value="yearly">Per Tahun (Tahunan)</option>
                        <option value="hourly">Per Jam</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={form.isSalaryNegotiable}
                      onChange={(e) => update("isSalaryNegotiable", e.target.checked)}
                      className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-medium text-foreground">
                      Gaji dapat dinegosiasikan dengan kandidat (Negotiable)
                    </span>
                  </label>
                </>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-800">
                  <p className="font-semibold flex items-center gap-1.5">
                    <EyeOff className="size-4 text-amber-700" />
                    <span>Rentang gaji disembunyikan dari publik</span>
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Pada kartu lowongan kandidat, status gaji akan ditampilkan sebagai &quot;Gaji Kompetitif / Sesuai
                    Kesepakatan&quot;.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 3: Kriteria & Kualifikasi */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <GraduationCap className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">3. Kriteria &amp; Kualifikasi Kandidat</CardTitle>
                  <CardDescription className="text-xs">
                    Tentukan batas pengalaman, pendidikan minimal, dan keahlian spesifik.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Minimal Pengalaman Kerja</label>
                  <select
                    value={form.experienceLevel}
                    onChange={(e) => update("experienceLevel", e.target.value)}
                    className={fieldInputClass}
                  >
                    {EXPERIENCE_LEVELS.map((exp) => (
                      <option key={exp} value={exp}>
                        {experienceLabels[exp]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Minimal Jenjang Pendidikan</label>
                  <select
                    value={form.minEducation}
                    onChange={(e) => update("minEducation", e.target.value)}
                    className={fieldInputClass}
                  >
                    {EDUCATION_LEVELS.map((edu) => (
                      <option key={edu} value={edu}>
                        {educationLabels[edu]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Keahlian Wajib (Required Skills)</span>
                    <span className="text-[11px] font-normal text-muted-foreground">Pisahkan dengan koma</span>
                  </label>
                  <Input
                    value={form.requiredSkills}
                    onChange={(e) => update("requiredSkills", e.target.value)}
                    placeholder="Contoh: React, TypeScript, Next.js, Tailwind CSS"
                    className={fieldInputClass}
                  />
                  {form.requiredSkills && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {skillNames(form.requiredSkills).map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 text-xs font-medium"
                        >
                          <Check className="size-3" />
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Keahlian Tambahan / Nilai Plus (Preferred Skills)</span>
                    <span className="text-[11px] font-normal text-muted-foreground">Pisahkan dengan koma</span>
                  </label>
                  <Input
                    value={form.preferredSkills}
                    onChange={(e) => update("preferredSkills", e.target.value)}
                    placeholder="Contoh: Docker, GraphQL, Unit Testing"
                    className={fieldInputClass}
                  />
                  {form.preferredSkills && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {skillNames(form.preferredSkills).map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 text-xs font-medium"
                        >
                          +{s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Deskripsi & Rincian Tugas */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 text-primary">
                  <Layers className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">4. Deskripsi &amp; Fasilitas Pekerjaan</CardTitle>
                  <CardDescription className="text-xs">
                    Rincikan job description, tanggung jawab, kualifikasi lengkap, dan benefit.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>Ringkasan Peran (Overview)</span>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded px-1.5 py-0.2 uppercase">
                    Wajib
                  </span>
                </label>
                <Textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Jelaskan peran ini secara garis besar, tujuan divisi, serta lingkungan kerja..."
                  className={fieldTextareaClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Tanggung Jawab Utama (Job Responsibilities)</span>
                  <span className="text-[11px] font-normal text-muted-foreground">Bisa menggunakan poin &bull;</span>
                </label>
                <Textarea
                  rows={4}
                  value={form.responsibilities}
                  onChange={(e) => update("responsibilities", e.target.value)}
                  placeholder="• Memimpin pengembangan fitur antarmuka web&#10;• Bekerja sama erat dengan product manager&#10;• Menjaga standar kode dan performa aplikasi"
                  className={fieldTextareaClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Kualifikasi Khusus (Qualifications &amp; Requirements)</span>
                  <span className="text-[11px] font-normal text-muted-foreground">Bisa menggunakan poin &bull;</span>
                </label>
                <Textarea
                  rows={4}
                  value={form.qualifications}
                  onChange={(e) => update("qualifications", e.target.value)}
                  placeholder="• Minimal 2 tahun pengalaman kerja di bidang terkait&#10;• Memiliki portofolio proyek yang dapat ditunjukkan&#10;• Disiplin dan mampu bekerja mandiri maupun tim"
                  className={fieldTextareaClass}
                />
              </div>

              {/* Tunjangan & Fasilitas ala Glints */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>Tunjangan &amp; Keuntungan (Benefits &amp; Perks)</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Pilih fasilitas yang disediakan perusahaan untuk memikat pelamar:
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {COMMON_BENEFITS.map((benefit) => {
                    const active = form.benefits.includes(benefit);
                    return (
                      <button
                        type="button"
                        key={benefit}
                        onClick={() => toggleBenefit(benefit)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                          active
                            ? "bg-primary text-white shadow-xs"
                            : "bg-muted text-muted-foreground hover:bg-slate-200"
                        }`}
                      >
                        {active && <Check className="size-3" />}
                        <span>{benefit}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Input custom perk */}
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="Tambah fasilitas lain (misal: Kursus Bahasa Asing Gratis)"
                    value={customBenefit}
                    onChange={(e) => setCustomBenefit(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomBenefit();
                      }
                    }}
                    className={fieldInputClass}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addCustomBenefit} className="shrink-0">
                    <Plus className="size-3.5 mr-1" /> Tambah
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/80 bg-card p-5 shadow-xs">
            <div className="text-xs text-muted-foreground">
              Pastikan seluruh kriteria telah akurat sebelum menerbitkan ke jaringan ProofyLink.
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                variant="outline"
                disabled={saving}
                onClick={() => setPublishImmediately(false)}
              >
                {saving && !publishImmediately ? "Menyimpan..." : "Simpan sebagai Draft"}
              </Button>
              <Button
                type="submit"
                disabled={saving}
                onClick={() => setPublishImmediately(true)}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {saving && publishImmediately ? "Menerbitkan..." : "Terbitkan Lowongan Sekarang"}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </ProtectedRoute>
  );
}

export function JobManagePage({ jobId }: { jobId: string }) {
  const { dbMode } = useApp();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dbMode) {
      const jobs = JSON.parse(
        localStorage.getItem("proofylink-demo-jobs") ?? JSON.stringify([demoRecruiterJob, ...DEMO_JOBS])
      ) as Job[];
      setJob(jobs.find((item) => item.id === jobId) ?? null);
      setLoading(false);
      return;
    }
    fetch(`/api/jobs/${jobId}`, { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { job?: Job; error?: string };
        if (!response.ok || !data.job) throw new Error(data.error ?? "Job tidak ditemukan.");
        setJob(data.job);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Job tidak ditemukan."))
      .finally(() => setLoading(false));
  }, [dbMode, jobId]);

  const changeStatus = async (status: "published" | "closed") => {
    if (!job) return;
    if (dbMode) {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as { job?: Job; error?: string };
      if (!response.ok || !data.job) {
        setError(data.error ?? "Status job tidak dapat diubah.");
        return;
      }
      setJob(data.job);
    } else {
      const next: Job = {
        ...job,
        status,
        publishedAt: status === "published" ? new Date().toISOString() : job.publishedAt,
        closedAt: status === "closed" ? new Date().toISOString() : job.closedAt,
      };
      const jobs = JSON.parse(localStorage.getItem("proofylink-demo-jobs") ?? "[]") as Job[];
      localStorage.setItem("proofylink-demo-jobs", JSON.stringify(jobs.map((item) => (item.id === job.id ? next : item))));
      setJob(next);
    }
  };

  const expLabel = job?.experienceLevel
    ? experienceLabels[job.experienceLevel as ExperienceLevel] ?? job.experienceLevel
    : null;
  const eduLabel = job?.minEducation
    ? educationLabels[job.minEducation as EducationLevel] ?? job.minEducation
    : null;

  return (
    <ProtectedRoute role="recruiter">
      <main className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {loading ? (
          <State text="Memuat data lowongan..." />
        ) : error || !job ? (
          <State text={error ?? "Job tidak ditemukan."} error />
        ) : (
          <>
            <Link href="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <ArrowLeft className="size-4" /> Kembali ke jobs
            </Link>

            <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-primary">Job Management</p>
                <h1 className="mt-1 text-3xl font-bold">{job.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {job.organizationName} &middot; {employmentLabels[job.employmentType]} &middot;{" "}
                  {arrangementLabels[job.workArrangement]}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold">
                  {statusLabels[job.status]}
                </span>
                <Button asChild>
                  <Link href={`/recruiter/jobs/${job.id}/pipeline`}>
                    <Workflow className="size-4 mr-1.5" /> Pipeline Pelamar
                  </Link>
                </Button>
              </div>
            </div>

            {/* Quick Glints Overview */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border/80 bg-card p-3.5">
                <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Banknote className="size-3.5 text-emerald-600" />
                  <span>Estimasi Gaji</span>
                </p>
                <p className="mt-1 text-xs font-bold text-foreground">{formatSalaryDisplay(job)}</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-card p-3.5">
                <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <BriefcaseBusiness className="size-3.5 text-indigo-600" />
                  <span>Pengalaman</span>
                </p>
                <p className="mt-1 text-xs font-bold text-foreground">{expLabel ?? "Tidak ditentukan"}</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-card p-3.5">
                <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <GraduationCap className="size-3.5 text-purple-600" />
                  <span>Pendidikan</span>
                </p>
                <p className="mt-1 text-xs font-bold text-foreground">{eduLabel ?? "Semua Jurusan"}</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-card p-3.5">
                <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Users className="size-3.5 text-amber-600" />
                  <span>Kuota Terbuka</span>
                </p>
                <p className="mt-1 text-xs font-bold text-foreground">{job.vacanciesCount ?? 1} Orang</p>
              </div>
            </div>

            <Card className="mt-6 border-border/80 shadow-xs">
              <CardContent className="space-y-7 p-6">
                <section>
                  <h2 className="text-base font-bold">Ringkasan Pekerjaan (Overview)</h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{job.description}</p>
                </section>

                {job.responsibilities && (
                  <section>
                    <h2 className="text-base font-bold">Tanggung Jawab Utama</h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                      {job.responsibilities}
                    </p>
                  </section>
                )}

                {job.qualifications && (
                  <section>
                    <h2 className="text-base font-bold">Kualifikasi &amp; Persyaratan</h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                      {job.qualifications}
                    </p>
                  </section>
                )}

                <section>
                  <h2 className="text-base font-bold">Keahlian (Skills)</h2>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    {(["required", "preferred"] as const).map((type) => (
                      <div key={type}>
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          {type === "required" ? "Keahlian Wajib" : "Keahlian Nilai Plus"}
                        </p>
                        <ul className="mt-2 space-y-2">
                          {job.requirements
                            .filter((req) => req.type === type)
                            .map((req) => (
                              <li key={req.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Check className="size-3.5 text-emerald-500" />
                                {req.name}
                              </li>
                            ))}
                          {!job.requirements.some((req) => req.type === type) && (
                            <li className="text-xs text-muted-foreground">Belum ada data skill.</li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>

                {job.benefits && job.benefits.length > 0 && (
                  <section>
                    <h2 className="text-base font-bold">Tunjangan &amp; Keuntungan (Benefits)</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.benefits.map((b) => (
                        <span
                          key={b}
                          className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 px-3 py-1 text-xs font-medium"
                        >
                          <Check className="size-3 text-purple-600" />
                          <span>{b}</span>
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {job.location && (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-4" /> {job.location}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
                  <div className="flex flex-wrap gap-2">
                    {job.status === "draft" && (
                      <Button onClick={() => changeStatus("published")}>Terbitkan Lowongan (Publish)</Button>
                    )}
                    {job.status === "published" && (
                      <Button variant="destructive" onClick={() => changeStatus("closed")}>
                        Tutup Lowongan (Close)
                      </Button>
                    )}
                    {job.status === "closed" && (
                      <p className="text-xs text-muted-foreground">
                        Lowongan ini sudah ditutup dan tidak menerima pelamar baru.
                      </p>
                    )}
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={`/recruiter/jobs/${job.id}/pipeline`}>
                      <Workflow className="size-4 mr-1.5" /> Buka Pipeline Pelamar &rarr;
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
