"use client";

import { useEffect, useState } from "react";
import {
  FileUp,
  GraduationCap,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Wrench,
  BriefcaseBusiness,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CvProfile } from "@/types";
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
  "h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";
const textareaCls =
  "min-h-24 w-full rounded-md border bg-background p-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";
const maxPdfBytes = 5 * 1024 * 1024;

// ─── Section wrapper ─────────────────────────────────────────────
function FormSection({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b pb-2">
        {icon}
        <h3 className="font-semibold text-foreground">{title}</h3>
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
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);

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
  const updateExpAchievement = (i: number, j: number, val: string) =>
    setProfile((c) => {
      const exp = [...c.experience];
      exp[i] = { ...exp[i], achievements: exp[i].achievements.map((item, idx) => (idx === j ? val : item)) };
      return { ...c, experience: exp };
    });
  const addExpAchievement = (i: number) =>
    setProfile((c) => ({
      ...c,
      experience: c.experience.map((exp, idx) => (idx === i ? { ...exp, achievements: [...exp.achievements, ""] } : exp)),
    }));
  const removeExpAchievement = (i: number, j: number) =>
    setProfile((c) => ({
      ...c,
      experience: c.experience.map((exp, idx) => (idx === i ? { ...exp, achievements: exp.achievements.filter((_, aIdx) => aIdx !== j) } : exp)),
    }));

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

  async function importPdf(file: File) {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setMessage("File harus berformat PDF.");
      toast.error("File tidak didukung", { description: "Impor CV hanya menerima berkas PDF." });
      return;
    }
    if (file.size > maxPdfBytes) {
      setMessage("Ukuran file melebihi batas 5 MB.");
      toast.error("Ukuran file terlalu besar", { description: "Ukuran PDF maksimal 5 MB. Kompres atau pilih file lain." });
      return;
    }
    setImporting(true);
    setMessage("Membaca PDF sebagai draf...");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/cv/import", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Impor gagal. Coba lagi atau isi manual.");
        toast.error("Impor gagal", { description: data.error ?? "Server tidak dapat memproses PDF ini." });
        return;
      }
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
      setMessage("Draf berhasil dibuat. Tinjau semua field sebelum menyimpan.");
      toast.success("PDF diimpor sebagai draf", { description: "Semua hasil ekstraksi tetap bisa kamu edit sebelum disimpan." });
    } catch {
      setMessage("Impor gagal. Coba lagi atau isi manual.");
      toast.error("Impor gagal", { description: "Periksa koneksi kamu lalu coba lagi." });
    } finally {
      setImporting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveCvProfile(profile);
      setMessage("Profil berhasil disimpan dan disinkronkan.");
    } catch {
      setMessage("Profil gagal disimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }


  return (
    <div className="space-y-6">
      {/* Import banner */}
      <Card className="border-border bg-muted/50">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <FileUp className="size-4 text-primary" />
              Import CV PDF
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              PDF only, maksimal 5 MB. Hasil AI adalah saran yang bisa kamu edit.
            </p>
          </div>
          <label
            aria-disabled={importing}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors ${
              importing
                ? "pointer-events-none bg-primary/60 text-primary-foreground"
                : "cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            <input
              className="sr-only"
              type="file"
              accept="application/pdf,.pdf"
              disabled={importing}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void importPdf(f);
              }}
            />
            {importing ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
            {importing ? "Memproses..." : "Pilih PDF"}
          </label>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Tinjau CV &amp; Profil</CardTitle>
          <p className="text-sm text-muted-foreground">
            Isi semua field agar recruiter mendapatkan gambaran lengkap tentang kamu.
          </p>
        </CardHeader>
        <CardContent className="space-y-8">

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
            icon={<BriefcaseBusiness className="size-4 text-primary" />}
          >
            <div className="space-y-4">
              {profile.experience.map((exp, i) => (
                <div key={i} className="relative rounded-xl border bg-muted/40 p-4">
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
                    <div className="flex flex-col gap-1 text-sm font-medium md:col-span-2">
                      <span>Pencapaian</span>
                      {exp.achievements.length === 0 && (
                        <span className="text-xs font-normal text-muted-foreground">
                          Belum ada pencapaian. Tambahkan hasil terkuatmu di peran ini.
                        </span>
                      )}
                      {exp.achievements.map((achievement, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <textarea
                            className={`${textareaCls} flex-1`}
                            aria-label={`Pencapaian ${j + 1}`}
                            value={achievement}
                            onChange={(e) => updateExpAchievement(i, j, e.target.value)}
                            placeholder={j === 0 ? "Apa yang kamu kerjakan dan capai di sini?" : "Tambahkan pencapaian lain"}
                            rows={2}
                          />
                          <button
                            type="button"
                            onClick={() => removeExpAchievement(i, j)}
                            className="mt-2 shrink-0 text-muted-foreground hover:text-destructive"
                            aria-label={`Hapus pencapaian ${j + 1}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="self-start px-2"
                        onClick={() => addExpAchievement(i)}
                      >
                        <Plus className="size-4" /> Tambah Pencapaian
                      </Button>
                    </div>
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
            title="Pendidikan"
            icon={<GraduationCap className="size-4 text-primary" />}
          >
            <div className="space-y-4">
              {profile.education.map((edu, i) => (
                <div key={i} className="relative rounded-xl border bg-muted/40 p-4">
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
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addEdu}>
                <Plus className="size-4" /> Tambah Pendidikan
              </Button>
            </div>
          </FormSection>

          {/* ── Skills ── */}
          <FormSection title="Skill">
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
                  <span key={s} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground"
                  >
                    <Wrench className="size-3.5" /> {t}
                  </span>
                ))}
              </div>
            )}
          </FormSection>

          {/* ── Portfolio ── */}
          <FormSection
            title="Portofolio"
            icon={<ExternalLink className="size-4 text-primary" />}
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
                    aria-label="Hapus portofolio"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addPortfolio}>
                <Plus className="size-4" /> Tambah Link / Proyek
              </Button>
            </div>
          </FormSection>

          {/* ── Action buttons ── */}
          <div className="flex flex-wrap gap-3 border-t pt-4">
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? "Menyimpan..." : "Simpan Profil"}
            </Button>
          </div>

          {message && (
            <p className="rounded-lg bg-muted px-4 py-3 text-sm text-primary" role="status">
              {message}
            </p>
          )}
        </CardContent>
      </Card>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-primary" />
        Kamu mengontrol field yang dipublikasikan. Screening recruiter tidak memakai financial atau credit data.
      </p>

      {/* ── Download / Template Picker ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Pratinjau &amp; Unduh CV</CardTitle>
          <p className="text-sm text-muted-foreground">Pilih template dan unduh CV-mu sebagai PDF. Simpan profil terlebih dahulu agar data terbaru digunakan.</p>
        </CardHeader>
        <CardContent>
          <CvDownload profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
