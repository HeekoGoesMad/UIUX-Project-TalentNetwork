"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  FileCheck,
  FileText,
  FileUp,
  Globe,
  Info,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UploadCloud,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import type { RecruiterOnboardingData } from "@/types";

const recruiterSteps = [
  { title: "Akun PIC Rekruter", note: "Identitas perwakilan", icon: User },
  { title: "Profil Perusahaan", note: "Entitas & operasional", icon: Building2 },
  { title: "Dokumen Legalitas", note: "NIB, NPWP & KTP", icon: FileCheck },
  { title: "Review & Pengajuan", note: "Antrean compliance", icon: ShieldCheck },
] as const;

const INDUSTRY_OPTIONS = [
  "Teknologi & Perangkat Lunak (SaaS / IT)",
  "Fintech & Layanan Keuangan",
  "E-Commerce & Retail Modern",
  "FMCG & Manufaktur",
  "Kesehatan, Farmasi & Medtech",
  "Logistik, Transportasi & Supply Chain",
  "Konsultan & Layanan Bisnis Profesional",
  "Media, Entertainment & Kreatif",
  "Pendidikan & Edutech",
  "Lainnya",
];

const COMPANY_SIZE_OPTIONS = [
  { id: "1-10", label: "1 — 10 Karyawan", desc: "Startup / Usaha Rintisan" },
  { id: "11-50", label: "11 — 50 Karyawan", desc: "Pertumbuhan Awal (Early Growth)" },
  { id: "51-200", label: "51 — 200 Karyawan", desc: "Menengah (Mid-Sized Company)" },
  { id: "201-500", label: "201 — 500 Karyawan", desc: "Perusahaan Besar (Large Company)" },
  { id: "500+", label: "500+ Karyawan", desc: "Korporasi / Enterprise Nasional" },
];

const draftKey = "proofylink-recruiter-onboarding-draft";

const inputClass =
  "h-11 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";
const textareaClass =
  "min-h-28 w-full resize-none rounded-md border bg-transparent px-3 py-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="block text-xs font-medium text-destructive">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

function Intro({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
      {children}
    </div>
  );
}

const defaultForm: RecruiterOnboardingData = {
  picName: "Budi Santoso",
  picTitle: "Head of Talent Acquisition",
  picPhone: "0812-9876-5432",
  picEmail: "budi@perusahaan.com",
  companyName: "PT Inovasi Digital Nusantara",
  industry: "Teknologi & Perangkat Lunak (SaaS / IT)",
  companySize: "51-200",
  description: "Perusahaan teknologi penyedia platform digital & ekosistem automasi bisnis terintegrasi.",
  websiteUrl: "https://inovasidigital.co.id",
  linkedinUrl: "https://linkedin.com/company/inovasi-digital-nusantara",
  officeAddress: "Gedung Cyber 2 Lt. 18, Jl. HR Rasuna Said Blok X-5 No. 13",
  city: "Jakarta Selatan, DKI Jakarta",
  nibNumber: "9120001234567",
  nibFileName: "NIB_PT_Inovasi_Digital.pdf",
  npwpNumber: "01.234.567.8-012.000",
  npwpFileName: "NPWP_Badan_Usaha.pdf",
  ktpFileName: "KTP_PIC_Budi_Santoso.jpg",
  verificationStatus: "draft",
};

function getSavedDraft(): { form: RecruiterOnboardingData; step: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.form) {
      return {
        form: { ...defaultForm, ...parsed.form },
        step: typeof parsed.step === "number" ? parsed.step : 0,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function RecruiterOnboarding() {
  const router = useRouter();
  const { user } = useApp();

  const [step, setStep] = useState<number>(() => {
    const draft = getSavedDraft();
    return draft?.step ?? 0;
  });

  const [form, setForm] = useState<RecruiterOnboardingData>(() => {
    const draft = getSavedDraft();
    return {
      ...(draft?.form ?? defaultForm),
      companyName: draft?.form?.companyName || user?.companyName || (user?.role === "recruiter" && user?.name ? user.name : defaultForm.companyName),
      picName: draft?.form?.picName || (user?.role === "recruiter" ? defaultForm.picName : user?.name || defaultForm.picName),
      picEmail: draft?.form?.picEmail || user?.email || defaultForm.picEmail,
    };
  });

  const [password, setPassword] = useState("PasswordRahasia123!");
  const [showPassword, setShowPassword] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editsRef = useRef(0);

  // Save draft
  useEffect(() => {
    if (editsRef.current === 0) return;
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify({ form, step }));
      } catch {
        // ignore
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form, step]);

  const update = <K extends keyof RecruiterOnboardingData>(key: K, val: RecruiterOnboardingData[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    editsRef.current += 1;
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleFileUpload = (field: "nibFileName" | "npwpFileName" | "ktpFileName", file: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran berkas maksimal 10MB");
      return;
    }
    update(field, file.name);
    toast.success(`Berkas ${file.name} berhasil diunggah!`);
  };

  const validateStep = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!form.picName.trim()) errs.picName = "Nama lengkap PIC wajib diisi.";
      if (!form.picTitle.trim()) errs.picTitle = "Jabatan PIC wajib diisi.";
    } else if (s === 1) {
      if (!form.companyName.trim()) errs.companyName = "Nama resmi entitas bisnis (PT/CV) wajib diisi.";
      if (!form.picEmail.trim() || !form.picEmail.includes("@")) errs.picEmail = "Email resmi perusahaan wajib diisi.";
      if (!form.picPhone.trim()) errs.picPhone = "Nomor WhatsApp / telepon perusahaan wajib diisi.";
      if (!form.description.trim()) errs.description = "Deskripsi operasional bisnis wajib diisi.";
      if (!form.city.trim()) errs.city = "Kota kantor wajib diisi.";
      if (!form.officeAddress.trim()) errs.officeAddress = "Alamat kantor operasional wajib diisi.";
    } else if (s === 2) {
      if (!form.nibNumber.trim() || !form.nibFileName) errs.nibNumber = "Nomor dan berkas NIB wajib dilampirkan.";
      if (!form.npwpNumber.trim() || !form.npwpFileName) errs.npwpNumber = "Nomor dan berkas NPWP wajib dilampirkan.";
      if (!form.ktpFileName) errs.ktpFileName = "Foto KTP PIC wajib diunggah.";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Mohon lengkapi isian wajib sebelum melanjutkan.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step < recruiterSteps.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      handleSubmitFinal();
    }
  };

  const handleSubmitFinal = async () => {
    if (!agreementChecked) {
      toast.error("Anda harus menyetujui pernyataan keabsahan dokumen.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/recruiter/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan berkas pendaftaran.");

      try {
        window.localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
      toast.success("Dokumen legalitas berhasil dikirim ke antrean review compliance!");
      router.push("/recruiter/pending");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim berkas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exitWithoutPublishing = () => {
    try {
      window.localStorage.setItem(draftKey, JSON.stringify({ form, step }));
      toast.info("Draf onboarding tersimpan");
    } catch {
      // ignore
    }
    router.push("/recruiter/pending");
  };

  return (
    <ProtectedRoute role="recruiter">
      <div className="fixed inset-0 z-10 overflow-hidden bg-background pt-20">
        <div className="mx-auto flex h-full max-w-7xl overflow-hidden border-x border-border bg-card shadow-xl">
          {/* ─── LEFT SIDEBAR (DARK ENTERPRISE BLUE) ─── */}
          <aside className="hidden w-[295px] shrink-0 flex-col bg-[#0b2342] p-7 text-white md:flex">
            <div className="flex items-center gap-2.5 font-bold text-base">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#7C3AED] text-white shadow-xs">
                <ShieldCheck className="size-5" />
              </span>
              <span>ProofyLink</span>
            </div>

            <div className="mt-12">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#7aaee0]">Onboarding Rekruter</p>
              <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-white">
                Verifikasi Organisasi &amp; Akses Talent Network.
              </h1>
              <p className="mt-3 text-xs leading-5 text-[#b7c8dc]">
                Lengkapi identitas PIC, legalitas entitas, dan dokumen compliance untuk standar rekrutmen terpercaya.
              </p>
            </div>

            {/* Stepper Navigation */}
            <div className="mt-auto space-y-2">
              {recruiterSteps.map((item, index) => {
                const Icon = item.icon;
                const isCurrent = index === step;
                const isDone = index < step;
                return (
                  <div
                    key={item.title}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                      isCurrent
                        ? "bg-white text-[#0b2342] font-semibold shadow-xs"
                        : isDone
                        ? "text-[#8de0be] bg-white/5"
                        : "text-[#8fa7c0] hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isCurrent
                          ? "bg-[#0b2342] text-white"
                          : isDone
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      {isDone ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                    </span>
                    <span className="truncate">
                      <strong className="block text-xs font-semibold">{item.title}</strong>
                      <small className={`text-[11px] block truncate ${isCurrent ? "text-slate-500" : "text-[#8fa7c0]"}`}>
                        {item.note}
                      </small>
                    </span>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* ─── RIGHT CONTENT PANEL ─── */}
          <main className="flex min-w-0 flex-1 flex-col">
            {/* Top Bar with Step and Progress */}
            <div className="border-b bg-card px-5 py-4 sm:px-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-[#0b2342] font-semibold">
                    Langkah {String(step + 1).padStart(2, "0")} / {String(recruiterSteps.length).padStart(2, "0")}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-foreground md:text-2xl">{recruiterSteps[step].title}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {Math.round(((step + 1) / recruiterSteps.length) * 100)}% selesai
                  </p>
                  <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-muted sm:w-40">
                    <div
                      className="h-full rounded-full bg-[#0b2342] transition-all duration-300"
                      style={{ width: `${((step + 1) / recruiterSteps.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-10">
              <div className="mx-auto max-w-2xl">
                {/* ── STEP 0: AKUN PIC REKRUTER ── */}
                {step === 0 && (
                  <Intro
                    title="Identitas PIC Rekruter *"
                    text="Data perwakilan resmi yang akan mengelola pencarian kandidat dan rekrutmen atas nama perusahaan."
                  >
                    <div className="space-y-4">
                      <Field label="Nama Lengkap PIC *" error={errors.picName}>
                        <input
                          required
                          className={inputClass}
                          value={form.picName}
                          onChange={(e) => update("picName", e.target.value)}
                          placeholder="Nama lengkap PIC"
                        />
                      </Field>

                      <Field label="Jabatan / Posisi di Perusahaan *" error={errors.picTitle}>
                        <input
                          required
                          className={inputClass}
                          value={form.picTitle}
                          onChange={(e) => update("picTitle", e.target.value)}
                          placeholder="Contoh: Head of Talent Acquisition / HR Manager"
                        />
                      </Field>

                      <Field label="Kata Sandi Akun *">
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 size-4 text-slate-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            className={`${inputClass} pl-9 pr-10`}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimal 8 karakter"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </Field>

                      {/* Email OTP Verification Notice */}
                      <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
                        <ShieldCheck className="size-4 text-[#7C3AED] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[#0b2342] block font-semibold">Verifikasi Email OTP 6-Digit</strong>
                          <span className="text-slate-600">
                            Kode OTP 6-digit akan dikirimkan ke email resmi perusahaan pada pengajuan di langkah terakhir untuk mengaktifkan workspace.
                          </span>
                        </div>
                      </div>
                    </div>
                  </Intro>
                )}

                {/* ── STEP 1: PROFIL PERUSAHAAN ── */}
                {step === 1 && (
                  <Intro
                    title="Profil Entitas Perusahaan *"
                    text="Informasi badan usaha sesuai NIB, kontak operasional, dan profil bisnis aktif."
                  >
                    <div className="space-y-4">
                      <Field label="Nama Resmi Entitas Bisnis (Sesuai NIB / PT/CV) *" error={errors.companyName}>
                        <input
                          required
                          className={inputClass}
                          value={form.companyName}
                          onChange={(e) => update("companyName", e.target.value)}
                          placeholder="Contoh: PT Inovasi Digital Nusantara"
                        />
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Kategori Industri *">
                          <select
                            className={inputClass}
                            value={form.industry}
                            onChange={(e) => update("industry", e.target.value)}
                          >
                            {INDUSTRY_OPTIONS.map((ind) => (
                              <option key={ind} value={ind}>
                                {ind}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Ukuran / Skala Perusahaan *">
                          <select
                            className={inputClass}
                            value={form.companySize}
                            onChange={(e) => update("companySize", e.target.value)}
                          >
                            {COMPANY_SIZE_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label} ({opt.desc})
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                          label="Email Resmi Perusahaan *"
                          hint="Gunakan email domain perusahaan"
                          error={errors.picEmail}
                        >
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 size-4 text-slate-400" />
                            <input
                              required
                              type="email"
                              className={`${inputClass} pl-9`}
                              value={form.picEmail}
                              onChange={(e) => update("picEmail", e.target.value)}
                              placeholder="nama@perusahaan.com"
                            />
                          </div>
                        </Field>

                        <Field label="Nomor WhatsApp / Telepon *" error={errors.picPhone}>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 size-4 text-slate-400" />
                            <input
                              required
                              className={`${inputClass} pl-9`}
                              value={form.picPhone}
                              onChange={(e) => update("picPhone", e.target.value)}
                              placeholder="0812-xxxx-xxxx"
                            />
                          </div>
                        </Field>
                      </div>

                      <Field label="Deskripsi Singkat Operasional Bisnis *" error={errors.description}>
                        <textarea
                          required
                          rows={3}
                          className={textareaClass}
                          value={form.description}
                          onChange={(e) => update("description", e.target.value)}
                          placeholder="Jelaskan produk, solusi, atau fokus layanan utama perusahaan..."
                        />
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Website Resmi Perusahaan">
                          <div className="relative">
                            <Globe className="absolute left-3 top-3 size-4 text-slate-400" />
                            <input
                              className={`${inputClass} pl-9`}
                              value={form.websiteUrl}
                              onChange={(e) => update("websiteUrl", e.target.value)}
                              placeholder="https://perusahaan.com"
                            />
                          </div>
                        </Field>

                        <Field label="LinkedIn / Media Sosial Perusahaan">
                          <input
                            className={inputClass}
                            value={form.linkedinUrl}
                            onChange={(e) => update("linkedinUrl", e.target.value)}
                            placeholder="https://linkedin.com/company/nama"
                          />
                        </Field>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Kota & Provinsi Kantor *" error={errors.city}>
                          <input
                            required
                            className={inputClass}
                            value={form.city}
                            onChange={(e) => update("city", e.target.value)}
                            placeholder="Contoh: Jakarta Selatan, DKI Jakarta"
                          />
                        </Field>

                        <Field label="Alamat Kantor Operasional *" error={errors.officeAddress}>
                          <input
                            required
                            className={inputClass}
                            value={form.officeAddress}
                            onChange={(e) => update("officeAddress", e.target.value)}
                            placeholder="Nama gedung, lantai, jalan, nomor"
                          />
                        </Field>
                      </div>
                    </div>
                  </Intro>
                )}

                {/* ── STEP 2: DOKUMEN LEGALITAS ── */}
                {step === 2 && (
                  <Intro
                    title="Unggah Dokumen Legalitas & KTP PIC *"
                    text="Berkas resmi ini digunakan tim compliance untuk memverifikasi keabsahan entitas sebelum akun diaktifkan."
                  >
                    <div className="space-y-4">
                      {/* NIB */}
                      <Card className="p-4 border-border shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <FileText className="size-4 text-[#0b2342]" /> 1. Nomor Induk Berusaha (NIB OSS) *
                          </span>
                          {form.nibFileName && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Terunggah
                            </span>
                          )}
                        </div>
                        <input
                          className={inputClass}
                          value={form.nibNumber}
                          onChange={(e) => update("nibNumber", e.target.value)}
                          placeholder="Nomor 13 digit NIB"
                        />
                        <label className="cursor-pointer flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-3 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                          <FileUp className="size-4 text-[#0b2342]" />
                          <span className="truncate">{form.nibFileName || "Pilih Berkas NIB (PDF / JPG)"}</span>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="sr-only"
                            onChange={(e) => handleFileUpload("nibFileName", e.target.files?.[0] || null)}
                          />
                        </label>
                      </Card>

                      {/* NPWP */}
                      <Card className="p-4 border-border shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <FileText className="size-4 text-[#0b2342]" /> 2. NPWP Badan Usaha *
                          </span>
                          {form.npwpFileName && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Terunggah
                            </span>
                          )}
                        </div>
                        <input
                          className={inputClass}
                          value={form.npwpNumber}
                          onChange={(e) => update("npwpNumber", e.target.value)}
                          placeholder="Nomor 16 digit NPWP Badan"
                        />
                        <label className="cursor-pointer flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-3 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                          <FileUp className="size-4 text-[#0b2342]" />
                          <span className="truncate">{form.npwpFileName || "Pilih Berkas NPWP (PDF / JPG)"}</span>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="sr-only"
                            onChange={(e) => handleFileUpload("npwpFileName", e.target.files?.[0] || null)}
                          />
                        </label>
                      </Card>

                      {/* KTP PIC */}
                      <Card className="p-4 border-border shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <User className="size-4 text-[#0b2342]" /> 3. Foto KTP PIC / Rekruter ({form.picName}) *
                          </span>
                          {form.ktpFileName && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Terunggah
                            </span>
                          )}
                        </div>
                        <label className="cursor-pointer flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-3 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                          <FileUp className="size-4 text-[#0b2342]" />
                          <span className="truncate">{form.ktpFileName || "Pilih Foto KTP PIC (JPG / PNG / PDF)"}</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="sr-only"
                            onChange={(e) => handleFileUpload("ktpFileName", e.target.files?.[0] || null)}
                          />
                        </label>
                      </Card>

                      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 text-xs text-slate-700 flex items-start gap-2.5">
                        <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          Seluruh berkas legalitas dan identitas disimpan terenkripsi dengan standar kepatuhan tinggi untuk verifikasi manual internal ProofyLink.
                        </p>
                      </div>
                    </div>
                  </Intro>
                )}

                {/* ── STEP 3: REVIEW & SUBMIT ── */}
                {step === 3 && (
                  <Intro
                    title="Satu langkah lagi."
                    text="Tinjau detail organisasi dan berkas legalitas sebelum dikirimkan ke antrean compliance review."
                  >
                    <div className="space-y-5">
                      <Card className="overflow-hidden border-border shadow-sm">
                        <div className="bg-[#0b2342] p-6 text-white">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded-full font-medium text-[#8de0be]">
                              Status: Siap Ditinjau
                            </span>
                            <span className="text-xs bg-purple-500/30 text-purple-200 px-2.5 py-0.5 rounded-full font-medium">
                              {form.industry}
                            </span>
                          </div>
                          <h3 className="mt-3 text-2xl font-bold">{form.companyName || "Nama Perusahaan"}</h3>
                          <p className="mt-1 text-xs text-[#b7c8dc]">{form.description}</p>
                          <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#b7c8dc]">
                            <MapPin className="size-3.5 text-emerald-400" />
                            <span>{form.city}</span>
                            <span className="text-[#55718f]">•</span>
                            <span>{form.companySize} Karyawan</span>
                            <span className="text-[#55718f]">•</span>
                            <span>PIC: {form.picName} ({form.picTitle})</span>
                          </p>
                        </div>

                        <div className="grid gap-4 p-6 sm:grid-cols-2 text-xs border-b">
                          <div>
                            <p className="text-muted-foreground">Email Resmi Perusahaan</p>
                            <p className="font-semibold text-foreground mt-0.5">{form.picEmail}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Nomor WhatsApp / Telepon</p>
                            <p className="font-semibold text-foreground mt-0.5">{form.picPhone}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Website Perusahaan</p>
                            <p className="font-semibold text-foreground mt-0.5">{form.websiteUrl || "-"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Alamat Kantor</p>
                            <p className="font-semibold text-foreground mt-0.5">{form.officeAddress}</p>
                          </div>
                        </div>

                        <div className="p-6 bg-slate-50/50 space-y-2 text-xs">
                          <strong className="text-foreground block">Berkas Terlampir:</strong>
                          <div className="grid sm:grid-cols-3 gap-2 text-slate-700">
                            <p className="flex items-center gap-1.5">
                              <Check className="size-3.5 text-emerald-600" /> NIB: {form.nibFileName}
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Check className="size-3.5 text-emerald-600" /> NPWP: {form.npwpFileName}
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Check className="size-3.5 text-emerald-600" /> KTP PIC: {form.ktpFileName}
                            </p>
                          </div>
                        </div>
                      </Card>

                      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 cursor-pointer text-xs leading-relaxed text-slate-700">
                        <input
                          type="checkbox"
                          checked={agreementChecked}
                          onChange={(e) => setAgreementChecked(e.target.checked)}
                          className="size-4 mt-0.5 rounded border-slate-300 text-[#0b2342] focus:ring-[#0b2342]"
                        />
                        <span>
                          Saya menyatakan bahwa seluruh data dan dokumen yang dilampirkan adalah benar, sah, dan saya memiliki wewenang resmi mewakili entitas bisnis bersangkutan untuk mendaftar di ProofyLink Talent Network.
                        </span>
                      </label>
                    </div>
                  </Intro>
                )}
              </div>
            </div>

            {/* ─── BOTTOM FIXED ACTION BAR ─── */}
            <div className="border-t bg-card px-5 py-4 sm:px-10">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={exitWithoutPublishing}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Simpan &amp; Keluar
                </Button>

                <div className="flex items-center gap-3">
                  {step > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep((prev) => prev - 1)}
                      className="border-border rounded-xl"
                    >
                      <ArrowLeft className="size-4 mr-1.5" /> Kembali
                    </Button>
                  )}

                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className={`rounded-xl px-6 font-bold text-white shadow-xs ${
                      step === recruiterSteps.length - 1
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-[#0b2342] hover:bg-[#1a3460]"
                    }`}
                  >
                    {isSubmitting ? (
                      "Mengirim..."
                    ) : step === recruiterSteps.length - 1 ? (
                      <>
                        Kirim untuk Compliance Review <UploadCloud className="size-4 ml-1.5" />
                      </>
                    ) : (
                      <>
                        Lanjut <ArrowRight className="size-4 ml-1.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
