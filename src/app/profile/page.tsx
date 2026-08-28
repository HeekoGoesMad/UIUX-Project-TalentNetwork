"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProfileSection } from "@/components/profile/profile-section";
import { EmptyState } from "@/components/shared/empty-state";
import { AiSummaryCard } from "@/components/talent/ai-summary-card";
import { CandidateStatusBadge } from "@/components/talent/candidate-status-badge";
import { VerifiedBadge } from "@/components/talent/verified-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useApp } from "@/providers/app-provider";
import { CAREER_STATUS_CONFIG, CareerStatus, type AiSummary, type EducationItem } from "@/types";
import {
    BriefcaseBusiness,
    Camera,
    Check,
    ChevronDown,
    ExternalLink,
    FileText,
    GraduationCap,
    MapPin,
    Pencil,
    Wrench,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const CAREER_STATUS_DESCRIPTIONS: Record<CareerStatus, string> = {
  "open-to-work": "Aktif mencari pekerjaan.",
  "open-for-opportunities": "Tidak aktif melamar tetapi terbuka terhadap peluang baru.",
  "freelance-available": "Tersedia untuk project freelance.",
  "internship-available": "Tersedia untuk program magang.",
  "not-available": "Tidak sedang mencari peluang kerja.",
};

// Demo fallback data agar halaman tidak kosong jika belum pernah scan CV
const DEMO = {
  fullName: "Nadia Putri",
  headline: "Senior Product Designer | UX Research | Design Systems",
  location: "Jakarta",
  about:
    "Product designer yang senang mengubah masalah kompleks menjadi pengalaman digital yang jelas, berguna, dan terasa manusiawi.",
  experience: [
    {
      company: "Tokopedia",
      role: "Senior Product Designer",
      employmentType: "Full Time",
      startDate: "2021",
      endDate: "Present",
      currentPosition: true,
      dates: "2021 — Present",
      description: "Memimpin arsitektur sistem desain multi-platform dan riset pengalaman pengguna.",
      achievements: ["Memimpin design system dan discovery untuk produk commerce."],
    },
    {
      company: "Independent Studio",
      role: "Product Designer",
      employmentType: "Full Time",
      startDate: "2019",
      endDate: "2021",
      currentPosition: false,
      dates: "2019 — 2021",
      description: "Merancang desain antarmuka aplikasi mobile dan dashboard untuk berbagai klien.",
      achievements: [],
    },
  ],
  education: [
    {
      level: "S1",
      school: "Institut Teknologi Bandung",
      program: "Desain Komunikasi Visual",
      gpa: "3.80 / 4.00",
      startDate: "2015",
      endDate: "2019",
      currentlyStudying: false,
      dates: "2015 — 2019",
    },
  ] as EducationItem[],
  skills: ["Figma", "Product strategy", "User research", "Design systems", "Prototyping"],
  hardCompetencies: ["Figma", "Product strategy", "User research", "Design systems", "Prototyping"],
  tools: ["Notion", "Miro", "Jira", "Google Workspace"],
  softSkills: ["Problem Solving", "Leadership", "Team Collaboration", "Communication"],
  portfolio: [] as string[],
};

// Completeness calculator
function calcCompleteness(p: {
  about?: string;
  headline?: string;
  experience?: unknown[];
  education?: unknown[];
  skills?: string[];
  tools?: string[];
  portfolio?: string[];
}): { pct: number; missing: string[] } {
  const missing: string[] = [];
  if (!p.about) missing.push("Tentang Saya");
  if (!p.headline) missing.push("Headline");
  if (!p.experience?.length) missing.push("Pengalaman Kerja");
  if (!p.education?.length) missing.push("Pendidikan");
  if (!p.skills?.length) missing.push("Skill");
  if (!p.tools?.length) missing.push("Tools");
  if (!p.portfolio?.length) missing.push("Portofolio");
  const total = 7;
  const filled = total - missing.length;
  return { pct: Math.round((filled / total) * 100), missing };
}

export default function ProfilePage() {
  const { user, cvProfile, careerStatus, saveCareerStatus, dbMode } = useApp();
  const [statusOpen, setStatusOpen] = useState(false);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);

  // Merge cvProfile over demo data so each field gracefully falls back
  const source = cvProfile ?? (dbMode ? null : DEMO);
  const avatarUrl: string =
    (source && "avatarUrl" in source && typeof source.avatarUrl === "string" && source.avatarUrl)
      ? source.avatarUrl
      : (source?.fullName?.includes("Nadia") ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop" : "");

  const bannerUrl: string =
    (source && "bannerUrl" in source && typeof source.bannerUrl === "string" && source.bannerUrl)
      ? source.bannerUrl
      : (source?.fullName?.includes("Nadia") ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop" : "");

  const p = {
    fullName: source?.fullName ?? "",
    avatarUrl,
    bannerUrl,
    headline: source?.headline ?? "",
    location: source?.location ?? "",
    about: source?.about ?? "",
    experience: source?.experience ?? [],
    education: source?.education ?? [],
    skills: source?.hardCompetencies?.length ? source.hardCompetencies : source?.skills ?? [],
    hardCompetencies: source?.hardCompetencies?.length ? source.hardCompetencies : source?.skills ?? [],
    tools: source?.tools ?? [],
    softSkills: source?.softSkills ?? [],
    portfolio: source?.portfolio ?? [],
  };

  const { saveCvProfile } = useApp();

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto profil maksimal 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const base = cvProfile || {
          ...DEMO,
          id: "local-profile",
          email: user?.email || "candidate@proofylink.dev",
          phone: "0812-3456-7890",
          industries: [],
          certifications: [],
          targetRole: "Product Designer",
          workArrangement: "hybrid" as const,
          openToWork: true,
          careerStatus: "open-to-work" as CareerStatus,
          updatedAt: new Date().toISOString(),
        };
        void saveCvProfile({
          ...base,
          avatarUrl: dataUrl,
        });
        toast.success("Foto profil berhasil diperbarui!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Ukuran banner maksimal 8MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const base = cvProfile || {
          ...DEMO,
          id: "local-profile",
          email: user?.email || "candidate@proofylink.dev",
          phone: "0812-3456-7890",
          industries: [],
          certifications: [],
          targetRole: "Product Designer",
          workArrangement: "hybrid" as const,
          openToWork: true,
          careerStatus: "open-to-work" as CareerStatus,
          updatedAt: new Date().toISOString(),
        };
        void saveCvProfile({
          ...base,
          bannerUrl: dataUrl,
        });
        toast.success("Foto sampul profil berhasil diperbarui!");
      }
    };
    reader.readAsDataURL(file);
  };

  const summaryKey = JSON.stringify([
    source?.headline ?? "",
    source?.about ?? "",
    source?.skills ?? [],
    source?.location ?? "",
    source && "targetRole" in source ? source.targetRole : (source?.headline ?? ""),
  ]);

  const requestAiSummary = useCallback(async (): Promise<{ ok: boolean; data?: AiSummary; error?: string }> => {
    try {
      const [headline, about, skills, location, targetRole] = JSON.parse(summaryKey) as [
        string,
        string,
        string[],
        string,
        string,
      ];
      const response = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          about,
          skills,
          targetRole: targetRole || "Talent",
          location,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Gagal memuat AI Summary.");
      }
      return { ok: true, data: payload as AiSummary };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Gagal memuat AI Summary." };
    }
  }, [summaryKey]);

  const regenerateAiSummary = useCallback(() => {
    setAiLoading(true);
    setAiError(null);
    void requestAiSummary().then((outcome) => {
      if (outcome.ok && outcome.data) setAiSummary(outcome.data);
      else setAiError(outcome.error ?? "Gagal memuat AI Summary.");
      setAiLoading(false);
    });
  }, [requestAiSummary]);

  useEffect(() => {
    let active = true;
    requestAiSummary().then((outcome) => {
      if (!active) return;
      if (outcome.ok && outcome.data) {
        setAiSummary(outcome.data);
        setAiError(null);
      } else {
        setAiError(outcome.error ?? "Gagal memuat AI Summary.");
      }
      setAiLoading(false);
    });
    return () => {
      active = false;
    };
  }, [requestAiSummary]);

  const { pct, missing } = calcCompleteness(p);

  const initials = p.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <ProtectedRoute role="candidate">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Page header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-[#7C3AED]">Profil Kandidat</p>
            <h1 className="mt-2 text-3xl font-bold text-[#111827]">Profil kamu</h1>
            <p className="mt-2 text-muted-foreground">Buat recruiter memahami cerita di balik pengalamanmu.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/candidate">
              <Pencil className="size-4" />
              Edit profil
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_300px]">
          {/* ── Main column ── */}
          <div className="space-y-5">

            {/* Hero card */}
            <section className="relative rounded-2xl border bg-white shadow-xs">
              <div className="relative h-48 sm:h-56 w-full overflow-hidden rounded-t-2xl bg-gradient-to-r from-[#1e1b4b] via-[#4c1d95] to-[#7c3aed]">
                {/* Banner Photo Overlay */}
                {p.bannerUrl ? (
                  <img
                    src={p.bannerUrl}
                    alt="Foto Sampul"
                    className="h-full w-full object-cover opacity-75"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
                
                {/* Button Ubah Foto Sampul */}
                <label className="cursor-pointer absolute top-4 right-4 flex items-center gap-1.5 rounded-xl bg-black/40 hover:bg-black/60 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md border border-white/20 transition-all shadow-sm">
                  <Camera className="size-3.5" />
                  <span>Ubah Foto Sampul</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleBannerUpload}
                  />
                </label>
              </div>

              <div className="px-6 pb-6">
                {/* Avatar with Camera badge */}
                <div className="-mt-16 sm:-mt-20 relative inline-block">
                  <div className="relative flex size-28 sm:size-32 items-center justify-center rounded-3xl border-4 border-white bg-slate-100 shadow-md overflow-hidden ring-1 ring-slate-900/5">
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt={p.fullName}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : null}
                    <span className="absolute text-3xl font-bold text-[#7C3AED] -z-10">{initials}</span>
                  </div>

                  {/* Camera icon button to upload/edit avatar */}
                  <label
                    title="Ubah Foto Profil"
                    className="cursor-pointer absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md border-2 border-white transition-transform hover:scale-105"
                  >
                    <Camera className="size-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleAvatarUpload}
                    />
                  </label>
                </div>

                {/* Name + headline + location + status */}
                <div className="mt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#111827]">{p.fullName || user?.name || "Profil kamu"}</h2>
                    <VerifiedBadge />
                  </div>

                  {/* Headline */}
                  {p.headline && (
                    <p className="mt-1 text-base font-semibold text-[#7C3AED]">{p.headline}</p>
                  )}

                  {/* Location */}
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-4 text-slate-400" />
                    {p.location}
                  </p>

                  {/* Career Status Selector */}
                  <div className="relative mt-3">
                    <button
                      id="career-status-btn"
                      onClick={() => setStatusOpen((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-transparent focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-1"
                      aria-haspopup="listbox"
                      aria-expanded={statusOpen}
                    >
                      <CandidateStatusBadge status={careerStatus} />
                      <ChevronDown
                        className={cn(
                          "size-3.5 text-muted-foreground transition-transform",
                          statusOpen && "rotate-180",
                        )}
                      />
                    </button>

                    {statusOpen && (
                      <div
                        role="listbox"
                        aria-label="Pilih status karier"
                        className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border bg-white p-1.5 shadow-xl"
                      >
                        <p className="mb-1 px-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Status Karier
                        </p>
                        {(Object.keys(CAREER_STATUS_CONFIG) as CareerStatus[]).map((key) => {
                          const cfg = CAREER_STATUS_CONFIG[key];
                          const isActive = careerStatus === key;
                          return (
                            <button
                              key={key}
                              role="option"
                              aria-selected={isActive}
                              onClick={() => { saveCareerStatus(key); setStatusOpen(false); }}
                              className={cn(
                                "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-50",
                                isActive && "bg-slate-50",
                              )}
                            >
                              <span className="mt-0.5 text-base leading-none">{cfg.emoji}</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold">{cfg.label}</p>
                                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                                  {CAREER_STATUS_DESCRIPTIONS[key]}
                                </p>
                              </div>
                              {isActive && <Check className="mt-0.5 size-4 shrink-0 text-[#7C3AED]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {!cvProfile && dbMode && (
              <EmptyState
                icon={FileText}
                title="Profil belum tersedia"
                description="Belum ada profil kandidat dari database. Lengkapi CV dan profilmu agar informasi yang tampil benar-benar milikmu."
                action={<Button asChild><Link href="/candidate/cv">Lengkapi CV &amp; profil</Link></Button>}
              />
            )}

            {/* Tentang Saya & AI Summary */}
            <ProfileSection title="Tentang Saya & AI Summary">
              {p.about && <p className="max-w-2xl leading-7 text-slate-600 mb-4">{p.about}</p>}
              <AiSummaryCard
                data={aiSummary}
                loading={aiLoading}
                error={aiError}
                onRegenerate={() => void regenerateAiSummary()}
              />
            </ProfileSection>

            {/* Pengalaman Kerja */}
            {p.experience.length > 0 && (
              <ProfileSection title="Pengalaman Kerja">
                <div className="space-y-6 border-l-2 border-slate-200 pl-5">
                  {p.experience.map((exp, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#111827]">
                          {exp.role} · {exp.company}
                        </p>
                        {exp.employmentType && (
                          <span className="bg-purple-100 text-[#7C3AED] text-[11px] font-bold px-2 py-0.5 rounded-md">
                            {exp.employmentType}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">{exp.dates}</p>

                      {exp.description && (
                        <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line pt-0.5">
                          {exp.description}
                        </p>
                      )}

                      {Array.isArray(exp.achievements) && exp.achievements.length > 0 ? (
                        <div className="space-y-1 pt-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pencapaian:</p>
                          {exp.achievements.map((a, j) => (
                            <p key={j} className="text-xs leading-relaxed text-slate-600 pl-2 border-l-2 border-purple-300">
                              • {a}
                            </p>
                          ))}
                        </div>
                      ) : typeof exp.achievements === "string" && exp.achievements ? (
                        <div className="pt-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pencapaian:</p>
                          <p className="text-xs leading-relaxed text-slate-600 pl-2 border-l-2 border-purple-300">
                            • {exp.achievements}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </ProfileSection>
            )}

            {/* Pendidikan */}
            {p.education.length > 0 && (
              <ProfileSection title="Pendidikan">
                <div className="space-y-4">
                  {p.education.map((edu, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <GraduationCap className="mt-0.5 size-5 shrink-0 text-[#7C3AED]" />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#111827]">{edu.school}</p>
                          {edu.level && (
                            <span className="bg-purple-100 text-[#7C3AED] text-[11px] font-bold px-2 py-0.5 rounded-md">
                              {edu.level}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 font-medium">
                          {edu.program}
                          {edu.gpa && <span className="text-[#7C3AED] font-semibold"> · IPK: {edu.gpa}</span>}
                        </p>
                        {edu.dates && (
                          <p className="text-xs text-muted-foreground">{edu.dates}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ProfileSection>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-5">
            {/* Profile completeness */}
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Kelengkapan Profil</p>
                <p className="mt-2 text-3xl font-bold text-[#111827]">{pct}%</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[#7C3AED] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {missing.length > 0 && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Tambahkan <span className="font-medium text-[#7C3AED]">{missing[0]}</span> untuk melengkapi profil.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Framework Kompetensi */}
            <ProfileSection title="Framework Kompetensi">
              <div className="space-y-4">
                {/* 1. Hard Competencies */}
                {p.skills.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Hard Competencies</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-1 text-xs font-semibold text-[#7C3AED]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Tools */}
                {p.tools.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Tools &amp; Software</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.tools.map((tool) => (
                        <span
                          key={tool}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                        >
                          <Wrench className="size-3" />
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Soft Skills */}
                {p.softSkills.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Soft Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.softSkills.map((softSkill) => (
                        <span
                          key={softSkill}
                          className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                        >
                          {softSkill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ProfileSection>

            {/* Portfolio */}
            <ProfileSection title="Portofolio">
              {p.portfolio.length > 0 ? (
                <div className="space-y-2">
                  {p.portfolio.map((item, i) => (
                    <a
                      key={i}
                      href={item.startsWith("http") ? item : `https://${item}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-[#7C3AED] transition-colors hover:bg-slate-50"
                    >
                      <BriefcaseBusiness className="size-4 shrink-0" />
                      <span className="min-w-0 truncate">{item}</span>
                      <ExternalLink className="ml-auto size-3 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={BriefcaseBusiness}
                  title="Tampilkan karya terbaikmu"
                  description="Tambahkan case study terbaikmu."
                  action={
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/candidate">Tambah portofolio</Link>
                    </Button>
                  }
                  className="rounded-xl border-dashed bg-transparent p-5 shadow-none"
                />
              )}
            </ProfileSection>
          </aside>
        </div>
      </div>
    </ProtectedRoute>
  );
}
