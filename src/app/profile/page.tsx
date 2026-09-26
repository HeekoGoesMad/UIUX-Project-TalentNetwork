/* eslint-disable @next/next/no-img-element */
"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProfileSection } from "@/components/profile/profile-section";
import { EmptyState } from "@/components/shared/empty-state";
import { ProfessionalSummaryModal } from "@/components/candidate/professional-summary-modal";
import { ProfessionalSummaryCard } from "@/components/talent/professional-summary-card";
import { CandidateStatusBadge } from "@/components/talent/candidate-status-badge";
import { VerifiedBadge } from "@/components/talent/verified-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useApp } from "@/providers/app-provider";
import { CAREER_STATUS_CONFIG, CareerStatus, type EducationItem } from "@/types";
import {
    Banknote,
    Brain,
    BriefcaseBusiness,
    Camera,
    Check,
    ChevronDown,
    ExternalLink,
    FileText,
    GraduationCap,
    MapPin,
    Pencil,
    Trash2,
    Wrench,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageCropDialog } from "@/components/ui/image-crop-dialog";

const CAREER_STATUS_DESCRIPTIONS: Record<CareerStatus, string> = {
  "open-to-work": "Aktif mencari pekerjaan.",
  "open-for-opportunities": "Tidak aktif melamar tetapi terbuka terhadap peluang baru.",
  "freelance-available": "Tersedia untuk project freelance.",
  "internship-available": "Tersedia untuk program magang.",
  "not-available": "Tidak sedang mencari peluang kerja.",
};

// Demo fallback data agar halaman tidak kosong jika belum pernah scan CV
const DEMO = {
  fullName: "Nadia Putri Rahayu",
  headline: "Senior Product Designer | UX Research | Design Systems",
  targetRole: "Lead Product Designer",
  location: "Jakarta Selatan, DKI Jakarta",
  salary: "Rp 18.000.000 – 25.000.000 / bln",
  personality: {
    type: "ENFJ",
    label: "Protagonis",
    tagline: "Pemimpin yang karismatik dan inspiratif, mampu memikat pendengarnya.",
  },
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

import { calculateCandidateReadiness } from "@/lib/candidate/onboarding-step";

export default function ProfilePage() {
  const { user, cvProfile, careerStatus, saveCareerStatus, dbMode, saveCvProfile } = useApp();
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

  useEffect(() => {
    if (!statusOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setStatusOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [statusOpen]);

  // Merge cvProfile over demo data so each field gracefully falls back
  const source = cvProfile ?? (dbMode ? null : DEMO);
  const avatarUrl: string =
    source && "avatarUrl" in source && source.avatarUrl !== undefined
      ? (source.avatarUrl || "")
      : (!dbMode && source?.fullName?.includes("Nadia")
        ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop"
        : "");

  const bannerUrl: string =
    source && "bannerUrl" in source && source.bannerUrl !== undefined
      ? (source.bannerUrl || "")
      : (!dbMode && source?.fullName?.includes("Nadia")
        ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop"
        : "");

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
    targetRole: source && "targetRole" in source ? (source.targetRole as string | undefined) : undefined,
    salary: source && "salary" in source ? source.salary : undefined,
    personality: source && "personality" in source ? source.personality : undefined,
  };

  const [cropModal, setCropModal] = useState<{
    open: boolean;
    imageSrc: string | null;
    type: "avatar" | "banner";
    fileName: string;
  }>({
    open: false,
    imageSrc: null,
    type: "avatar",
    fileName: "",
  });

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxBytes = type === "banner" ? 8 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`Ukuran ${type === "banner" ? "banner maksimal 8MB" : "foto profil maksimal 5MB"}`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropModal({
        open: true,
        imageSrc: reader.result as string,
        type,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const isAvatar = cropModal.type === "avatar";
    const toastId = toast.loading(`Mengunggah foto ${isAvatar ? "profil" : "sampul"}...`);
    try {
      const formData = new FormData();
      formData.append("file", croppedBlob, cropModal.fileName || `${cropModal.type}.webp`);
      formData.append("type", cropModal.type);

      const res = await fetch("/api/profile/media", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? `Gagal mengunggah foto ${isAvatar ? "profil" : "sampul"}.`);
      }

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

      await saveCvProfile({
        ...base,
        ...(isAvatar ? { avatarUrl: data.url } : { bannerUrl: data.url }),
      });

      toast.success(`Foto ${isAvatar ? "profil" : "sampul"} berhasil diperbarui!`, { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Gagal mengunggah ${isAvatar ? "foto profil" : "sampul"}`, { id: toastId });
    }
  };

  const handleRemoveMedia = async (type: "avatar" | "banner") => {
    const isAvatar = type === "avatar";
    const toastId = toast.loading(`Menghapus foto ${isAvatar ? "profil" : "sampul"}...`);
    try {
      const res = await fetch(`/api/profile/media?type=${type}`, { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? `Gagal menghapus foto ${isAvatar ? "profil" : "sampul"}.`);
      }

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

      await saveCvProfile({
        ...base,
        ...(isAvatar ? { avatarUrl: "" } : { bannerUrl: "" }),
      });

      toast.success(`Foto ${isAvatar ? "profil" : "sampul"} berhasil dihapus!`, { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Gagal menghapus foto ${isAvatar ? "profil" : "sampul"}`, { id: toastId });
    }
  };

  const handleApplySummary = async (newSummary: string) => {
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
    await saveCvProfile({
      ...base,
      about: newSummary,
    });
  };

  const readiness = calculateCandidateReadiness(p);

  const initials = (p.fullName || user?.name || user?.email || "P")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <ProtectedRoute role="candidate">
      <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
        {/* Page header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Profil Publik</h1>
            <p className="mt-1 text-sm text-muted-foreground">Lihat representasi profil profesionalmu saat ditinjau oleh rekruter dan mitra industri.</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-md" asChild>
            <Link href="/candidate/cv">
              <Pencil className="h-4 w-4" />
              Edit profil
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* ── Main column ── */}
          <div className="space-y-5">

            {/* Hero card */}
            <section className="relative z-20 rounded-xl border border-border/70 bg-card shadow-xs">
              <div className="relative h-36 sm:h-44 w-full overflow-hidden rounded-t-xl bg-muted">
                {/* Banner Photo Overlay */}
                {p.bannerUrl ? (
                  <img
                    src={p.bannerUrl}
                    alt="Foto Sampul"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted/40 text-xs text-muted-foreground/60">
                    Foto sampul belum diatur
                  </div>
                )}

                {/* Buttons Ubah & Hapus Foto Sampul */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <label className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-border/80 bg-card/90 backdrop-blur-sm px-2.5 py-1.5 text-xs font-medium text-foreground shadow-xs hover:bg-muted transition-colors">
                    <Camera className="size-3.5" />
                    <span className="hidden sm:inline">Ubah sampul</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => onSelectFile(e, "banner")}
                    />
                  </label>
                  {p.bannerUrl ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia("banner")}
                      title="Hapus Foto Sampul"
                      aria-label="Hapus foto sampul"
                      className="cursor-pointer flex items-center justify-center size-7 rounded-lg border border-border/80 bg-card/90 backdrop-blur-sm text-muted-foreground shadow-xs hover:bg-muted hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="px-6 pb-6">
                {/* Avatar with Camera & Remove badges */}
                <div className="-mt-12 sm:-mt-14 relative inline-block">
                  <div className="relative flex size-20 sm:size-24 items-center justify-center rounded-full border-4 border-card bg-muted shadow-sm overflow-hidden">
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt={p.fullName || "Profil"}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover z-10"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : null}
                    <span className="absolute text-xl font-bold text-muted-foreground select-none">{initials}</span>
                  </div>

                  {/* Camera & Remove buttons for avatar */}
                  <div className="absolute bottom-0 right-0 z-20 flex items-center gap-1">
                    {p.avatarUrl ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia("avatar")}
                        title="Hapus Foto Profil"
                        aria-label="Hapus foto profil"
                        className="flex size-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-xs hover:bg-muted hover:text-destructive transition-colors"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    ) : null}
                    <label
                      title="Ubah Foto Profil"
                      aria-label="Ubah foto profil"
                      className="cursor-pointer flex size-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-xs hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Camera className="size-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => onSelectFile(e, "avatar")}
                      />
                    </label>
                  </div>
                </div>

                {/* Name + headline + location + status */}
                <div className="mt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                      {p.fullName || user?.name || "Profil Saya"}
                    </h2>
                    <VerifiedBadge />
                    {p.personality && (
                      <span
                        title={`Tipe Kepribadian: ${p.personality.type} (${p.personality.label})`}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        <Brain className="size-3 text-primary" />
                        {p.personality.type} · {p.personality.label}
                      </span>
                    )}
                  </div>

                  {/* Headline */}
                  {p.headline && (
                    <p className="mt-1 text-sm font-medium text-muted-foreground sm:text-base leading-relaxed">{p.headline}</p>
                  )}

                  {/* Location, Target Role & Salary */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-muted-foreground" />
                      {p.location}
                    </span>
                    {p.targetRole && (
                      <span className="flex items-center gap-1.5">
                        <BriefcaseBusiness className="size-3.5 text-muted-foreground" />
                        Target: <span className="font-semibold text-foreground">{p.targetRole}</span>
                      </span>
                    )}
                    {p.salary && (
                      <span className="flex items-center gap-1.5">
                        <Banknote className="size-3.5 text-muted-foreground" />
                        Ekspektasi: <span className="font-semibold text-foreground">{p.salary}</span>
                      </span>
                    )}
                  </div>

                  {/* Career Status Selector */}
                  <div className="relative mt-3.5" ref={statusRef}>
                    <button
                      id="career-status-btn"
                      onClick={() => setStatusOpen((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-transparent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                      aria-haspopup="listbox"
                      aria-expanded={statusOpen}
                    >
                      <CandidateStatusBadge status={careerStatus} />
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          statusOpen && "rotate-180",
                        )}
                      />
                    </button>

                    {statusOpen && (
                      <div
                        role="listbox"
                        aria-label="Pilih status karier"
                        className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border bg-card p-1 shadow-lg"
                      >
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
                                "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted",
                                isActive && "bg-muted",
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{cfg.label}</p>
                                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                                  {CAREER_STATUS_DESCRIPTIONS[key]}
                                </p>
                              </div>
                              {isActive && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
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
                action={<Button asChild><Link href="/candidate/cv">Lengkapi CV & profil</Link></Button>}
              />
            )}

            {/* Professional Summary */}
            <ProfessionalSummaryCard
              summary={p.about}
              onOpenHelper={() => setSummaryModalOpen(true)}
            />

            {/* Pengalaman Kerja */}
            {p.experience.length > 0 && (
              <ProfileSection title="Pengalaman kerja">
                <div className="divide-y divide-border">
                  {p.experience.map((exp, i) => (
                    <div key={i} className="space-y-1.5 py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {exp.role} · {exp.company}
                        </p>
                        {exp.employmentType && (
                          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {exp.employmentType}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{exp.dates}</p>

                      {exp.description && (
                        <p className="whitespace-pre-line pt-0.5 text-sm leading-relaxed text-muted-foreground">
                          {exp.description}
                        </p>
                      )}

                      {Array.isArray(exp.achievements) && exp.achievements.length > 0 ? (
                        <ul className="list-disc space-y-1 pl-5 pt-1 text-sm text-muted-foreground">
                          {exp.achievements.map((a, j) => (
                            <li key={j} className="leading-relaxed">
                              {a}
                            </li>
                          ))}
                        </ul>
                      ) : typeof exp.achievements === "string" && exp.achievements ? (
                        <ul className="list-disc space-y-1 pl-5 pt-1 text-sm text-muted-foreground">
                          <li key="str-ach" className="leading-relaxed">
                            {exp.achievements}
                          </li>
                        </ul>
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
                      <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{edu.school}</p>
                          {edu.level && (
                            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              {edu.level}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {edu.program}
                          {edu.gpa && <span className="font-semibold"> · IPK: {edu.gpa}</span>}
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
          <aside className="space-y-4">
            {/* Profile completeness */}
            <Card className="border-border/80 bg-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">Kesiapan profil ATS</p>
                  <span className="text-xs font-medium text-muted-foreground">{readiness.tier}</span>
                </div>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{readiness.percent}%</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${readiness.percent}%` }}
                  />
                </div>
                {readiness.missingSections.length > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Lengkapi <Link href={readiness.missingSections[0].anchor} className="font-medium text-primary hover:underline">{readiness.missingSections[0].label}</Link> di CV Workspace.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Framework Kompetensi */}
            <ProfileSection title="Framework kompetensi">
              <div className="space-y-4">
                {/* 1. Hard Competencies */}
                {p.skills.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Hard competencies</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-border/80 bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground/85"
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
                    <p className="text-xs font-medium text-muted-foreground">Tools & software</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.tools.map((tool) => (
                        <span
                          key={tool}
                          className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground/85"
                        >
                          <Wrench className="h-3 w-3 text-muted-foreground" />
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Soft Skills */}
                {p.softSkills.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Soft skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.softSkills.map((softSkill) => (
                        <span
                          key={softSkill}
                          className="rounded-full border border-border/80 bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground/85"
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
                      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      <BriefcaseBusiness className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 truncate">{item}</span>
                      <ExternalLink className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                  <div className="pt-1">
                    <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                      <Link href="/candidate/cv?section=skills">Tambah portofolio</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={BriefcaseBusiness}
                  title="Tampilkan karya terbaikmu"
                  description="Tambahkan case study terbaikmu."
                  action={
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/candidate/cv?section=skills">Tambah portofolio</Link>
                    </Button>
                  }
                  className="rounded-lg border-dashed bg-transparent p-5 shadow-none"
                />
              )}
            </ProfileSection>
          </aside>
        </div>
      </div>

      <ProfessionalSummaryModal
        open={summaryModalOpen}
        onOpenChange={setSummaryModalOpen}
        currentSummary={p.about}
        cvProfile={cvProfile}
        onApply={handleApplySummary}
      />

      <ImageCropDialog
        open={cropModal.open}
        onOpenChange={(open) => setCropModal((prev) => ({ ...prev, open }))}
        imageSrc={cropModal.imageSrc}
        aspectRatio={cropModal.type === "avatar" ? 1 : 3}
        cropShape={cropModal.type === "avatar" ? "round" : "rect"}
        title={cropModal.type === "avatar" ? "Sesuaikan Foto Profil" : "Sesuaikan Foto Sampul"}
        description={
          cropModal.type === "avatar"
            ? "Geser dan perbesar untuk mengatur foto profil Anda."
            : "Geser dan perbesar untuk mengatur foto sampul (banner) Anda."
        }
        onCropComplete={handleCropComplete}
      />
    </ProtectedRoute>
  );
}

