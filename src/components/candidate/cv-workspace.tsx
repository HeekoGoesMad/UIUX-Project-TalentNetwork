"use client";

import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Camera,
  ExternalLink,
  FileUp,
  GraduationCap,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PARTNER_CAMPUSES, type CvProfile, type EducationItem, type ExperienceItem } from "@/types";
import { CvDownload } from "./cv-download";
import { ProfessionalSummaryModal } from "./professional-summary-modal";

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

function CompetencyTagInput({
  tags,
  onChange,
  placeholder,
  colorScheme = "purple",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  colorScheme?: "purple" | "slate" | "emerald";
}) {
  const [inputVal, setInputVal] = useState("");

  const addCurrent = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    const updated = Array.from(new Set([...tags, ...parts]));
    onChange(updated);
    setInputVal("");
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const badgeStyles = {
    purple: "bg-purple-50 text-[#7C3AED] border-purple-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
  };

  return (
    <div className="rounded-lg border bg-background p-2 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeStyles[colorScheme]}`}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="hover:opacity-75 focus:outline-none"
              aria-label={`Hapus ${tag}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          className="h-7 min-w-[150px] flex-1 border-0 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
          value={inputVal}
          onChange={(e) => {
            const val = e.target.value;
            if (val.includes(",")) {
              const parts = val.split(",").map((s) => s.trim()).filter(Boolean);
              if (parts.length > 0) {
                onChange(Array.from(new Set([...tags, ...parts])));
              }
              setInputVal("");
            } else {
              setInputVal(val);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addCurrent();
            } else if (e.key === "Backspace" && !inputVal && tags.length > 0) {
              removeTag(tags.length - 1);
            }
          }}
          onBlur={addCurrent}
          placeholder={tags.length === 0 ? placeholder : "+ ketik lalu tekan koma / enter..."}
        />
      </div>
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
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

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
      experience: [
        ...c.experience,
        {
          company: "",
          role: "",
          employmentType: "Full Time",
          startDate: "",
          endDate: "",
          currentPosition: false,
          dates: "",
          description: "",
          achievements: [],
        },
      ],
    }));
  const removeExp = (i: number) =>
    setProfile((c) => ({ ...c, experience: c.experience.filter((_, idx) => idx !== i) }));
  const updateExp = (i: number, key: keyof ExperienceItem, val: unknown) =>
    setProfile((c) => {
      const exp = [...c.experience];
      const item = { ...exp[i], [key]: val };
      if (key === "startDate" || key === "endDate" || key === "currentPosition") {
        const start = key === "startDate" ? (val as string) : item.startDate || "";
        const isCurrent = key === "currentPosition" ? (val as boolean) : item.currentPosition;
        const end = isCurrent ? "Sekarang" : key === "endDate" ? (val as string) : item.endDate || "";
        if (start || end) {
          item.dates = start && end ? `${start} — ${end}` : start || end;
        }
      }
      exp[i] = item;
      return { ...c, experience: exp };
    });
  const updateExpAchievement = (i: number, j: number, val: string) =>
    setProfile((c) => {
      const exp = [...c.experience];
      const target = exp[i];
      if (!target) return c;
      const achievements = Array.isArray(target.achievements) ? [...target.achievements] : [];
      achievements[j] = val;
      exp[i] = { ...target, achievements };
      return { ...c, experience: exp };
    });
  const addExpAchievement = (i: number) =>
    setProfile((c) => ({
      ...c,
      experience: c.experience.map((exp, idx) =>
        idx === i ? { ...exp, achievements: [...(Array.isArray(exp.achievements) ? exp.achievements : []), ""] } : exp
      ),
    }));
  const removeExpAchievement = (i: number, j: number) =>
    setProfile((c) => ({
      ...c,
      experience: c.experience.map((exp, idx) =>
        idx === i
          ? {
              ...exp,
              achievements: (Array.isArray(exp.achievements) ? exp.achievements : []).filter((_, aIdx) => aIdx !== j),
            }
          : exp
      ),
    }));

  // Education helpers
  const addEdu = () =>
    setProfile((c) => ({
      ...c,
      education: [
        ...c.education,
        {
          level: "S1",
          school: "",
          program: "",
          gpa: "",
          startDate: "",
          endDate: "",
          currentlyStudying: false,
          dates: "",
        },
      ],
    }));
  const removeEdu = (i: number) =>
    setProfile((c) => ({ ...c, education: c.education.filter((_, idx) => idx !== i) }));
  const updateEdu = (i: number, key: keyof EducationItem, val: unknown) =>
    setProfile((c) => {
      const edu = [...c.education];
      const item = { ...edu[i], [key]: val };
      if (key === "startDate" || key === "endDate" || key === "currentlyStudying") {
        const start = key === "startDate" ? (val as string) : item.startDate || "";
        const isCurrent = key === "currentlyStudying" ? (val as boolean) : item.currentlyStudying;
        const end = isCurrent ? "Sekarang" : key === "endDate" ? (val as string) : item.endDate || "";
        if (start || end) {
          item.dates = start && end ? `${start} — ${end}` : start || end;
        }
      }
      edu[i] = item;
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

          <FormSection title="Informasi Dasar & Foto">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Foto Profil (Avatar)</span>
                <div className="flex items-center gap-4">
                  <div className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl border-2 border-white bg-slate-200 shadow-2xs overflow-hidden">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="Foto Profil" className="h-full w-full object-cover" />
                    ) : (
                      <User className="size-8 text-slate-400" />
                    )}
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs">
                    <Camera className="size-3.5 text-[#7C3AED]" />
                    <span>Upload Foto Profil</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) update("avatarUrl", ev.target.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Foto Sampul (Banner)</span>
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-32 shrink-0 rounded-xl border-2 border-white bg-gradient-to-r from-[#1e1b4b] to-[#7c3aed] shadow-2xs overflow-hidden">
                    {profile.bannerUrl ? (
                      <img src={profile.bannerUrl} alt="Foto Sampul" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs">
                    <Camera className="size-3.5 text-[#7C3AED]" />
                    <span>Upload Sampul</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) update("bannerUrl", ev.target.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <Field label="Nama Lengkap">
                <input
                  className={inputCls}
                  value={profile.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="Nama lengkapmu"
                />
              </Field>
              <Field label="Lokasi">
                <input
                  className={inputCls}
                  value={profile.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="Kota, Provinsi (contoh: Jakarta Selatan, DKI Jakarta)"
                />
              </Field>
              <Field label="Email">
                <input
                  className={inputCls}
                  type="email"
                  value={profile.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="nama@email.com"
                />
              </Field>
              <Field label="Nomor Telepon / WhatsApp">
                <input
                  className={inputCls}
                  value={profile.phone ?? ""}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="0812-xxxx-xxxx"
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
              <div className="md:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Tentang Saya
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSummaryModalOpen(true)}
                    className="h-7 gap-1.5 border-primary/30 text-xs font-medium text-primary hover:bg-primary/5"
                  >
                    <Sparkles className="size-3" />
                    Panduan Summary
                  </Button>
                </div>
                <p className="text-xs font-normal text-muted-foreground">
                  Deskripsi profesional singkat — siapa kamu, apa yang kamu lakukan, dan nilai apa yang kamu bawa.
                </p>
                <textarea
                  className={textareaCls}
                  value={profile.about}
                  onChange={(e) => update("about", e.target.value)}
                  placeholder="Deskripsi profesional singkat — siapa kamu, apa yang kamu lakukan, dan nilai apa yang kamu bawa."
                  rows={4}
                />
              </div>
            </div>
          </FormSection>

          {/* ── Pengalaman Kerja ── */}
          <FormSection
            title="Pengalaman Kerja"
            icon={<BriefcaseBusiness className="size-4 text-primary" />}
          >
            <div className="space-y-4">
              {profile.experience.map((exp, i) => {
                const employmentTypes = ["Full Time", "Internship", "Contract", "Freelance"];

                return (
                  <div key={i} className="relative rounded-xl border bg-muted/40 p-4 space-y-3">
                    <button
                      type="button"
                      onClick={() => removeExp(i)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-destructive"
                      aria-label="Hapus pengalaman"
                    >
                      <Trash2 className="size-4" />
                    </button>

                    {/* Row 1: Company Name & Position */}
                    <div className="grid gap-3 md:grid-cols-2 pr-6">
                      <label className="flex flex-col gap-1 text-sm font-medium">
                        Nama Perusahaan *
                        <input
                          className={inputCls}
                          value={exp.company}
                          onChange={(e) => updateExp(i, "company", e.target.value)}
                          placeholder="Contoh: PT GoTo Gojek Tokopedia"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm font-medium">
                        Posisi / Jabatan *
                        <input
                          className={inputCls}
                          value={exp.role}
                          onChange={(e) => updateExp(i, "role", e.target.value)}
                          placeholder="Contoh: Senior UI/UX Designer"
                        />
                      </label>
                    </div>

                    {/* Row 2: Employment Type */}
                    <label className="flex flex-col gap-1 text-sm font-medium">
                      Tipe Pekerjaan (Employment Type)
                      <select
                        className={inputCls}
                        value={exp.employmentType || "Full Time"}
                        onChange={(e) => updateExp(i, "employmentType", e.target.value)}
                      >
                        {employmentTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>

                    {/* Row 3: Start Date, End Date, Current Position */}
                    <div className="space-y-2">
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm font-medium">
                          Tahun / Bulan Mulai
                          <input
                            className={inputCls}
                            value={exp.startDate || ""}
                            onChange={(e) => updateExp(i, "startDate", e.target.value)}
                            placeholder="Contoh: Jan 2021 atau 2021"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-medium">
                          Tahun / Bulan Selesai
                          <input
                            className={inputCls}
                            disabled={Boolean(exp.currentPosition)}
                            value={exp.currentPosition ? "Sekarang" : exp.endDate || ""}
                            onChange={(e) => updateExp(i, "endDate", e.target.value)}
                            placeholder={exp.currentPosition ? "Sekarang" : "Contoh: Des 2023 atau 2023"}
                          />
                        </label>
                      </div>

                      <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-xs text-slate-700 font-medium">
                        <input
                          type="checkbox"
                          checked={Boolean(exp.currentPosition)}
                          onChange={(e) => updateExp(i, "currentPosition", e.target.checked)}
                          className="size-4 rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                        />
                        <span>Masih Bekerja di Sini (Current Position)</span>
                      </label>
                    </div>

                    {/* Row 4: Job Description (Mandatory) */}
                    <label className="flex flex-col gap-1 text-sm font-medium">
                      Deskripsi Pekerjaan &amp; Tanggung Jawab *
                      <textarea
                        className={`${textareaCls} min-h-20`}
                        value={exp.description || ""}
                        onChange={(e) => updateExp(i, "description", e.target.value)}
                        placeholder="Deskripsikan peran utama, cakupan kerja, dan tanggung jawab..."
                        rows={2}
                      />
                    </label>

                    {/* Row 5: Achievements (Optional) */}
                    <div className="flex flex-col gap-1 text-sm font-medium">
                      <span>Pencapaian Utama (Opsional)</span>
                      {(Array.isArray(exp.achievements) ? exp.achievements : typeof exp.achievements === "string" && exp.achievements ? [exp.achievements] : []).map((achievement, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <textarea
                            className={`${textareaCls} flex-1`}
                            aria-label={`Pencapaian ${j + 1}`}
                            value={achievement}
                            onChange={(e) => updateExpAchievement(i, j, e.target.value)}
                            placeholder={j === 0 ? "Apa hasil nyata / metrik terkuat yang kamu capai?" : "Tambahkan pencapaian lain"}
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
                );
              })}
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
              {profile.education.map((edu, i) => {
                const partnerMatch = PARTNER_CAMPUSES.find((c) => edu.school.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(edu.school.toLowerCase()));
                const isVerified = profile.campusVerification?.institution === partnerMatch && profile.campusVerification?.status === "verified";
                const educationLevels = ["SMA/SMK", "Diploma", "S1", "S2", "S3"];

                return (
                  <div key={i} className="relative rounded-xl border bg-slate-50/60 p-4 space-y-3">
                    <button
                      type="button"
                      onClick={() => removeEdu(i)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-destructive"
                      aria-label="Hapus pendidikan"
                    >
                      <Trash2 className="size-4" />
                    </button>

                    {/* Row 1: Level & Institution */}
                    <div className="grid gap-3 md:grid-cols-3 pr-6">
                      <label className="flex flex-col gap-1 text-sm font-medium">
                        Jenjang Pendidikan
                        <select
                          className={inputCls}
                          value={edu.level || "S1"}
                          onChange={(e) => updateEdu(i, "level", e.target.value)}
                        >
                          {educationLevels.map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-sm font-medium md:col-span-2">
                        Universitas / Institusi *
                        <input
                          className={inputCls}
                          value={edu.school}
                          onChange={(e) => updateEdu(i, "school", e.target.value)}
                          placeholder="Contoh: Universitas Indonesia / SMKN 1 Jakarta"
                        />
                      </label>
                    </div>

                    {/* Row 2: Major & GPA */}
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="flex flex-col gap-1 text-sm font-medium md:col-span-2">
                        Jurusan / Program Studi *
                        <input
                          className={inputCls}
                          value={edu.program}
                          onChange={(e) => updateEdu(i, "program", e.target.value)}
                          placeholder="Teknik Informatika / Ilmu Komputer"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm font-medium">
                        IPK / Nilai Akhir (GPA)
                        <input
                          className={inputCls}
                          value={edu.gpa || ""}
                          onChange={(e) => updateEdu(i, "gpa", e.target.value)}
                          placeholder="3.85 / 4.00"
                        />
                      </label>
                    </div>

                    {/* Row 3: Dates & Currently Studying */}
                    <div className="space-y-2">
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm font-medium">
                          Tahun / Bulan Mulai
                          <input
                            className={inputCls}
                            value={edu.startDate || ""}
                            onChange={(e) => updateEdu(i, "startDate", e.target.value)}
                            placeholder="Agu 2020 atau 2020"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-medium">
                          Tahun / Bulan Selesai
                          <input
                            className={inputCls}
                            disabled={Boolean(edu.currentlyStudying)}
                            value={edu.currentlyStudying ? "Sekarang" : edu.endDate || ""}
                            onChange={(e) => updateEdu(i, "endDate", e.target.value)}
                            placeholder={edu.currentlyStudying ? "Sekarang" : "Jul 2024 atau 2024"}
                          />
                        </label>
                      </div>

                      <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-xs text-slate-700 font-medium">
                        <input
                          type="checkbox"
                          checked={Boolean(edu.currentlyStudying)}
                          onChange={(e) => updateEdu(i, "currentlyStudying", e.target.checked)}
                          className="size-4 rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                        />
                        <span>Masih Menempuh Pendidikan (Currently Studying)</span>
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

          {/* ── Competency Framework ── */}
          <FormSection title="Framework Kompetensi (Competencies)">
            <div className="space-y-4">
              {/* 1. Hard Competencies */}
              <Field
                label="1. Hard Competencies (Kompetensi Teknis)"
                hint="Ketik nama kompetensi teknis lalu tekan koma (,) atau Enter. Contoh: UI/UX Design, Data Analysis, SEO"
              >
                <CompetencyTagInput
                  tags={profile.hardCompetencies?.length ? profile.hardCompetencies : profile.skills}
                  onChange={(tags) =>
                    setProfile((c) => ({
                      ...c,
                      skills: tags,
                      hardCompetencies: tags,
                    }))
                  }
                  colorScheme="purple"
                  placeholder="Ketik kompetensi teknis lalu tekan koma / Enter..."
                />
              </Field>

              {/* 2. Tools */}
              <Field
                label="2. Tools &amp; Software Pendukung"
                hint="Ketik nama software/tools lalu tekan koma (,) atau Enter. Contoh: Figma, VS Code, Notion, Docker"
              >
                <CompetencyTagInput
                  tags={profile.tools}
                  onChange={(tags) =>
                    setProfile((c) => ({
                      ...c,
                      tools: tags,
                    }))
                  }
                  colorScheme="slate"
                  placeholder="Ketik tools lalu tekan koma / Enter..."
                />
              </Field>

              {/* 3. Soft Skills */}
              <Field
                label="3. Soft Skills (Kompetensi Interpersonal)"
                hint="Ketik soft skill lalu tekan koma (,) atau Enter. Contoh: Problem Solving, Leadership, Team Collaboration"
              >
                <CompetencyTagInput
                  tags={profile.softSkills ?? []}
                  onChange={(tags) =>
                    setProfile((c) => ({
                      ...c,
                      softSkills: tags,
                    }))
                  }
                  colorScheme="emerald"
                  placeholder="Ketik soft skill lalu tekan koma / Enter..."
                />
              </Field>
            </div>
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

      <ProfessionalSummaryModal
        open={summaryModalOpen}
        onOpenChange={setSummaryModalOpen}
        currentSummary={profile.about}
        cvProfile={profile}
        onApply={async (newSummary) => {
          update("about", newSummary);
          if (profile.id && profile.id !== "new-cv") {
            await saveCvProfile({
              ...profile,
              about: newSummary,
            });
          }
        }}
      />
    </div>
  );
}
