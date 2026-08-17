"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ExternalLink,
  GraduationCap,
  MapPin,
  Pencil,
  Wrench,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CandidateStatusBadge } from "@/components/candidates/candidate-status-badge";
import { VerifiedBadge } from "@/components/candidates/verified-badge";
import { AiSummaryCard } from "@/components/candidates/ai-summary-card";
import { ProfileSection } from "@/components/profile/profile-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import { CAREER_STATUS_CONFIG, CareerStatus } from "@/types";
import { cn } from "@/lib/utils";

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
      dates: "2021 — Present",
      achievements: ["Memimpin design system dan discovery untuk produk commerce."],
    },
    {
      company: "Independent Studio",
      role: "Product Designer",
      dates: "2019 — 2021",
      achievements: [],
    },
  ],
  education: [
    { school: "Institut Teknologi Bandung", program: "Desain Komunikasi Visual", dates: "2015 — 2019" },
  ],
  skills: ["Figma", "Product strategy", "User research", "Design systems", "Prototyping"],
  tools: ["Notion", "Miro", "Jira", "Google Workspace"],
  portfolio: [] as string[],
};

// Completeness calculator
function calcCompleteness(p: typeof DEMO & { portfolio: string[] }): { pct: number; missing: string[] } {
  const missing: string[] = [];
  if (!p.about) missing.push("Tentang Saya");
  if (!p.headline) missing.push("Headline");
  if (!p.experience.length) missing.push("Pengalaman Kerja");
  if (!p.education.length) missing.push("Pendidikan");
  if (!p.skills.length) missing.push("Skills");
  if (!p.tools.length) missing.push("Tools");
  if (!p.portfolio.length) missing.push("Portfolio");
  const total = 7;
  const filled = total - missing.length;
  return { pct: Math.round((filled / total) * 100), missing };
}

export default function ProfilePage() {
  const { user, cvProfile, careerStatus, saveCareerStatus, dbMode } = useApp();
  const [statusOpen, setStatusOpen] = useState(false);

  // Merge cvProfile over demo data so each field gracefully falls back
  const source = cvProfile ?? (dbMode ? null : DEMO);
  const p = {
    fullName: source?.fullName ?? "",
    headline: source?.headline ?? "",
    location: source?.location ?? "",
    about: source?.about ?? "",
    experience: source?.experience ?? [],
    education: source?.education ?? [],
    skills: source?.skills ?? [],
    tools: source?.tools ?? [],
    portfolio: source?.portfolio ?? [],
  };

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
            <p className="font-mono text-xs uppercase tracking-widest text-[#7C3AED]">Candidate profile</p>
            <h1 className="mt-2 text-3xl font-bold text-[#111827]">Profil kamu</h1>
            <p className="mt-2 text-muted-foreground">Buat recruiter memahami cerita di balik pengalamanmu.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/candidate">
              <Pencil className="size-4" />
              Edit profile
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_300px]">
          {/* ── Main column ── */}
          <div className="space-y-5">

            {/* Hero card */}
            <section className="rounded-2xl border bg-white">
              <div className="h-36 overflow-hidden rounded-t-2xl bg-gradient-to-r from-[#201C45] via-[#4C1D95] to-[#7C3AED]" />
              <div className="px-6 pb-6">
                {/* Avatar */}
                <div className="-mt-12 flex size-24 items-center justify-center rounded-2xl border-4 border-white bg-slate-50 text-3xl font-bold text-[#7C3AED]">
                  {initials}
                </div>

                {/* Name + headline + location + status */}
                <div className="mt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold text-[#111827]">{p.fullName || user?.name || "Profil kamu"}</h2>
                    <VerifiedBadge />
                  </div>

                  {/* Headline */}
                  {p.headline && (
                    <p className="mt-1 font-medium text-[#7C3AED]">{p.headline}</p>
                  )}

                  {/* Location */}
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" />
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
                          Career Status
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
              <Card><CardContent className="p-6"><h2 className="text-lg font-semibold">Profil belum tersedia</h2><p className="mt-2 text-sm text-muted-foreground">Belum ada profil kandidat dari database. Lengkapi CV dan profilmu agar informasi yang tampil benar-benar milikmu.</p><Button className="mt-4" asChild><Link href="/candidate/cv">Lengkapi CV &amp; profil</Link></Button></CardContent></Card>
            )}

            {/* Tentang Saya */}
            {p.about && (
              <ProfileSection title="Tentang Saya">
                <p className="max-w-2xl leading-7 text-slate-600">{p.about}</p>
                <AiSummaryCard className="mt-4">
                  AI-generated summary based on your CV and experience profile.
                </AiSummaryCard>
              </ProfileSection>
            )}

            {/* Pengalaman Kerja */}
            {p.experience.length > 0 && (
              <ProfileSection title="Pengalaman Kerja">
                <div className="space-y-6 border-l-2 border-slate-200 pl-5">
                  {p.experience.map((exp, i) => (
                    <div key={i}>
                      <p className="font-semibold text-[#111827]">
                        {exp.role} · {exp.company}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{exp.dates}</p>
                      {exp.achievements?.map((a, j) => (
                        <p key={j} className="mt-2 text-sm leading-6 text-muted-foreground">
                          {a}
                        </p>
                      ))}
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
                      <div>
                        <p className="font-semibold text-[#111827]">{edu.school}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {edu.program}
                          {edu.dates && ` · ${edu.dates}`}
                        </p>
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
                <p className="text-sm text-muted-foreground">Profile completeness</p>
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

            {/* Skills */}
            {p.skills.length > 0 && (
              <ProfileSection title="Skills">
                <div className="flex flex-wrap gap-2">
                  {p.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#7C3AED]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </ProfileSection>
            )}

            {/* Tools */}
            {p.tools.length > 0 && (
              <ProfileSection title="Tools">
                <div className="flex flex-wrap gap-2">
                  {p.tools.map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#7C3AED]"
                    >
                      <Wrench className="size-3" />
                      {tool}
                    </span>
                  ))}
                </div>
              </ProfileSection>
            )}

            {/* Portfolio */}
            <ProfileSection title="Portfolio">
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
                <div className="rounded-xl border border-dashed p-5 text-center">
                  <BriefcaseBusiness className="mx-auto size-6 text-[#7C3AED]" />
                  <p className="mt-2 text-sm font-semibold">Showcase your work</p>
                  <p className="mt-1 text-xs text-muted-foreground">Tambahkan case study terbaikmu.</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/candidate">Tambah portfolio</Link>
                  </Button>
                </div>
              )}
            </ProfileSection>
          </aside>
        </div>
      </div>
    </ProtectedRoute>
  );
}
