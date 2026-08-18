"use client";

import { useEffect, useState } from "react";
import {
  FileUp,
  GraduationCap,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  BriefcaseBusiness,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PARTNER_CAMPUSES, type CvProfile } from "@/types";
import { CvDownload } from "./cv-download";

function blank(email = "", fullName = ""): CvProfile {
 return {
   id: "new-cv",
  fullName,
  headline: "",
  about: "",
  location: "",
  email,
  phone: "",
  skills: [],
  tools: [],
  industries: [],
  experience: [],
  education: [],
  certifications: [],
  portfolio: [],
  targetRole: "",
  workArrangement: "hybrid",
  openToWork: true,
  careerStatus: "open-to-work",
  updatedAt: new Date().toISOString(),
 };
}

// ─── Helpers ────────────────────────────────────────────────────
function Field({
  label,
  hint,
  children,
  span2,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  span2?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm font-medium${span2 ? " md:col-span-2" : ""}`}>
      {label}
      {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      {children}
    </label>
  );
}

const inputCls =
  "h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]";
const textareaCls =
  "min-h-24 w-full rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]";

// ─── Section wrapper ─────────────────────────────────────────────
function FormSection({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b pb-2">
        {icon}
        <h3 className="font-semibold text-[#111827]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export function CvWorkspace() {
  const { cvProfile, user, dbMode, saveCvProfile } = useApp();
  const [profile, setProfile] = useState<CvProfile>(cvProfile ?? blank(dbMode ? user?.email : "", dbMode ? user?.name : ""));
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!cvProfile) return;
    const timer = window.setTimeout(() => setProfile(cvProfile), 0);
    return () => window.clearTimeout(timer);
  }, [cvProfile]);

  // Generic scalar updater
  const update = <K extends keyof CvProfile>(key: K, value: CvProfile[K]) =>
    setProfile((c) => ({ ...c, [key]: value }));

  // Experience helpers
  const addExp = () =>
    setProfile((c) => ({
      ...c,
      experience: [...c.experience, { company: "", role: "", dates: "", achievements: [] }],
    }));
  const removeExp = (i: number) =>
    setProfile((c) => ({ ...c, experience: c.experience.filter((_, idx) => idx !== i) }));
  const updateExp = (i: number, key: "company" | "role" | "dates", val: string) =>
    setProfile((c) => {
      const exp = [...c.experience];
      exp[i] = { ...exp[i], [key]: val };
      return { ...c, experience: exp };
    });
  const updateExpDesc = (i: number, val: string) =>
    setProfile((c) => {
      const exp = [...c.experience];
      exp[i] = { ...exp[i], achievements: val ? [val] : [] };
      return { ...c, experience: exp };
    });

  // Education helpers
  const addEdu = () =>
    setProfile((c) => ({
      ...c,
      education: [...c.education, { school: "", program: "", dates: "" }],
    }));
  const removeEdu = (i: number) =>
    setProfile((c) => ({ ...c, education: c.education.filter((_, idx) => idx !== i) }));
  const updateEdu = (i: number, key: "school" | "program" | "dates", val: string) =>
    setProfile((c) => {
      const edu = [...c.education];
      edu[i] = { ...edu[i], [key]: val };
      return { ...c, education: edu };
    });

  // Portfolio helpers
  const addPortfolio = () =>
    setProfile((c) => ({ ...c, portfolio: [...c.portfolio, ""] }));
  const removePortfolio = (i: number) =>
    setProfile((c) => ({ ...c, portfolio: c.portfolio.filter((_, idx) => idx !== i) }));
  const updatePortfolio = (i: number, val: string) =>
    setProfile((c) => {
      const p = [...c.portfolio];
      p[i] = val;
      return { ...c, portfolio: p };
    });

  // PDF import
  async function importPdf(file: File) {
    const form = new FormData();
    form.set("file", file);
    setMessage("Membaca PDF sebagai draft...");
    const response = await fetch("/api/cv/import", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error); return; }
    setProfile((c) => ({
      ...c,
      ...data,
      id: data.cvId,
      skills: data.skills ?? c.skills,
      tools: data.tools ?? c.tools,
      experience: data.experience ?? c.experience,
      education: data.education ?? c.education,
      portfolio: data.portfolio ?? c.portfolio,
      sourceFileName: file.name,
    }));
    setMessage("Draft berhasil dibuat. Review semua field sebelum menyimpan.");
  }


  return (
    <div className="space-y-6">
      {/* Import banner */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 font-semibold text-[#111827]">
              <FileUp className="size-4 text-[#7C3AED]" />
              Import CV PDF
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              PDF only, maksimal 5 MB. Hasil AI adalah saran yang bisa kamu edit.
            </p>
          </div>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 text-sm font-semibold text-white hover:bg-[#6D28D9]">
            <input
              className="sr-only"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void importPdf(f); }}
            />
            <FileUp className="size-4" /> Pilih PDF
          </label>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#111827]">Review CV &amp; Profile</CardTitle>
          <p className="text-sm text-muted-foreground">
            Isi semua field agar recruiter mendapatkan gambaran lengkap tentang kamu.
          </p>
        </CardHeader>
        <CardContent className="space-y-8">

          {/* ── Informasi Dasar ── */}
          <FormSection title="Informasi Dasar">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama Lengkap">
                <input
                  className={inputCls}
                  value={profile.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="Nama lengkapmu"
                />
              </Field>
              <Field label="Lokasi" hint="Kota, Provinsi">
                <input
                  className={inputCls}
                  value={profile.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="Jakarta, DKI Jakarta"
                />
              </Field>
              <Field
                label="Headline"
                hint='Contoh: "Human Capital Specialist | Recruitment | Employee Relations"'
                span2
              >
                <input
                  className={inputCls}
                  value={profile.headline}
                  onChange={(e) => update("headline", e.target.value)}
                  placeholder="Posisi | Keahlian | Spesialisasi"
                />
              </Field>
              <Field label="Tentang Saya" span2>
                <textarea
                  className={textareaCls}
                  value={profile.about}
                  onChange={(e) => update("about", e.target.value)}
                  placeholder="Deskripsi profesional singkat — siapa kamu, apa yang kamu lakukan, dan nilai apa yang kamu bawa."
                  rows={4}
                />
              </Field>
            </div>
          </FormSection>

          {/* ── Pengalaman Kerja ── */}
          <FormSection
            title="Pengalaman Kerja"
            icon={<BriefcaseBusiness className="size-4 text-[#7C3AED]" />}
          >
            <div className="space-y-4">
              {profile.experience.map((exp, i) => (
                <div key={i} className="relative rounded-xl border bg-slate-50/60 p-4">
                  <button
                    type="button"
                    onClick={() => removeExp(i)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-destructive"
                    aria-label="Hapus pengalaman"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <div className="grid gap-3 md:grid-cols-2 pr-6">
                    <label className="flex flex-col gap-1 text-sm font-medium">
                      Nama Perusahaan
                      <input
                        className={inputCls}
                        value={exp.company}
                        onChange={(e) => updateExp(i, "company", e.target.value)}
                        placeholder="Tokopedia"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium">
                      Posisi
                      <input
                        className={inputCls}
                        value={exp.role}
                        onChange={(e) => updateExp(i, "role", e.target.value)}
                        placeholder="Senior Product Designer"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium">
                      Durasi
                      <input
                        className={inputCls}
                        value={exp.dates}
                        onChange={(e) => updateExp(i, "dates", e.target.value)}
                        placeholder="Jan 2021 — Present"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium md:col-span-2">
                      Deskripsi
                      <textarea
                        className={textareaCls}
                        value={exp.achievements?.[0] ?? ""}
                        onChange={(e) => updateExpDesc(i, e.target.value)}
                        placeholder="Apa yang kamu kerjakan dan capai di sini?"
                        rows={2}
                      />
                    </label>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addExp}>
                <Plus className="size-4" /> Tambah Pengalaman
              </Button>
            </div>
          </FormSection>

          {/* ── Pendidikan ── */}
          <FormSection
            title="Pendidikan & Kampus"
            icon={<GraduationCap className="size-4 text-[#7C3AED]" />}
          >
            <div className="space-y-4">
              {/* Partner suggestions chips */}
              <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 text-xs">
                <p className="font-semibold text-[#7C3AED] mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="size-3.5" /> Kampus Mitra Djoin:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PARTNER_CAMPUSES.map((campus) => (
                    <button
                      key={campus}
                      type="button"
                      onClick={() => {
                        if (profile.education.length === 0) {
                          setProfile((c) => ({ ...c, education: [{ school: campus, program: "", dates: "" }] }));
                        } else {
                          updateEdu(0, "school", campus);
                        }
                      }}
                      className="rounded-lg border border-purple-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-purple-100/60 transition-colors"
                    >
                      + {campus}
                    </button>
                  ))}
                </div>
              </div>

              {profile.education.map((edu, i) => {
                const partnerMatch = PARTNER_CAMPUSES.find((c) => edu.school.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(edu.school.toLowerCase()));
                const isVerified = profile.campusVerification?.institution === partnerMatch && profile.campusVerification?.status === "verified";

                return (
                  <div key={i} className="relative rounded-xl border bg-slate-50/60 p-4">
                    <button
                      type="button"
                      onClick={() => removeEdu(i)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-destructive"
                      aria-label="Hapus pendidikan"
                    >
                      <Trash2 className="size-4" />
                    </button>
                    <div className="grid gap-3 md:grid-cols-3 pr-6">
                      <label className="flex flex-col gap-1 text-sm font-medium md:col-span-1">
                        Universitas / Institusi
                        <input
                          className={inputCls}
                          value={edu.school}
                          onChange={(e) => updateEdu(i, "school", e.target.value)}
                          placeholder="Universitas Indonesia"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm font-medium">
                        Jurusan / Program Studi
                        <input
                          className={inputCls}
                          value={edu.program}
                          onChange={(e) => updateEdu(i, "program", e.target.value)}
                          placeholder="Teknik Informatika"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm font-medium">
                        Tahun
                        <input
                          className={inputCls}
                          value={edu.dates}
                          onChange={(e) => updateEdu(i, "dates", e.target.value)}
                          placeholder="2018 — 2022"
                        />
                      </label>
                    </div>

                    {partnerMatch && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-xs">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <GraduationCap className="size-3.5 text-[#7C3AED]" /> Terhubung ke <strong>{partnerMatch} Career Center</strong>
                        </span>
                        <span className={isVerified
                          ? "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-800"
                          : "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-800"
                        }>
                          {isVerified ? "✓ Terverifikasi Resmi Kampus" : "⏳ Menunggu Verifikasi Career Center"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              <Button type="button" variant="outline" size="sm" onClick={addEdu}>
                <Plus className="size-4" /> Tambah Pendidikan
              </Button>
            </div>
          </FormSection>

          {/* ── Skills ── */}
          <FormSection title="Skills">
            <Field
              label="Daftar Skill"
              hint="Pisahkan dengan koma. Contoh: Recruitment, Payroll, Digital Marketing"
            >
              <input
                className={inputCls}
                value={profile.skills.join(", ")}
                onChange={(e) =>
                  setProfile((c) => ({
                    ...c,
                    skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  }))
                }
                placeholder="UI/UX, Sales, Public Speaking, Data Analysis"
              />
            </Field>
            {profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <span key={s} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#7C3AED]">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </FormSection>

          {/* ── Tools ── */}
          <FormSection title="Tools">
            <Field
              label="Daftar Tools"
              hint="Pisahkan dengan koma. Contoh: Excel, Google Workspace, Figma, Meta Ads, Notion"
            >
              <input
                className={inputCls}
                value={profile.tools.join(", ")}
                onChange={(e) =>
                  setProfile((c) => ({
                    ...c,
                    tools: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  }))
                }
                placeholder="Figma, Notion, Looker Studio, Jira"
              />
            </Field>
            {profile.tools.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.tools.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#7C3AED]"
                  >
                    🔧 {t}
                  </span>
                ))}
              </div>
            )}
          </FormSection>

          {/* ── Portfolio ── */}
          <FormSection
            title="Portfolio"
            icon={<ExternalLink className="size-4 text-[#7C3AED]" />}
          >
            <div className="space-y-3">
              {profile.portfolio.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={inputCls + " flex-1"}
                    value={item}
                    onChange={(e) => updatePortfolio(i, e.target.value)}
                    placeholder="https://link-ke-project.com atau nama project"
                  />
                  <button
                    type="button"
                    onClick={() => removePortfolio(i)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label="Hapus portfolio"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addPortfolio}>
                <Plus className="size-4" /> Tambah Link / Project
              </Button>
            </div>
          </FormSection>

          {/* ── Action buttons ── */}
          <div className="flex flex-wrap gap-3 border-t pt-4">
            <Button onClick={() => { void saveCvProfile(profile).then(() => setMessage("Profil berhasil disimpan dan disinkronkan.")); }}>
              <Save className="size-4" /> Simpan Profile
            </Button>
          </div>

          {message && (
            <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-[#7C3AED]" role="status">
              {message}
            </p>
          )}
        </CardContent>
      </Card>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-[#7C3AED]" />
        Kamu mengontrol field yang dipublikasikan. Screening recruiter tidak memakai financial atau credit data.
      </p>

      {/* ── Download / Template Picker ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#111827]">Preview & Download CV</CardTitle>
          <p className="text-sm text-muted-foreground">Pilih template dan unduh CV-mu sebagai PDF. Simpan profile terlebih dahulu agar data terbaru digunakan.</p>
        </CardHeader>
        <CardContent>
          <CvDownload profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
