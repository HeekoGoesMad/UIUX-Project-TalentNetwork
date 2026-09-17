"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  FileCheck,
  Info,
  MapPin,
  ShieldCheck,
  UploadCloud,
  User,
  GraduationCap,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useApp } from "@/providers/app-provider";

const partnerSteps = [
  { title: "Akun PIC Kemitraan", note: "Identitas perwakilan", icon: User },
  { title: "Profil Lembaga", note: "Entitas & operasional", icon: Building2 },
  { title: "Surat SK & Legalitas", note: "SK pendirian & kemitraan", icon: FileCheck },
  { title: "Review & Pengajuan", note: "Antrean compliance", icon: ShieldCheck },
] as const;

const INSTITUTION_TYPE_OPTIONS = [
  "Universitas Negeri (PTN)",
  "Universitas Swasta (PTS)",
  "Institut / Politeknik Vokasi",
  "Sekolah Tinggi / Akademi",
  "Lembaga Pelatihan Kerja (LPK) / Bootcamp",
  "Lainnya",
];

const PROVINCE_OPTIONS = [
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Banten",
  "Bali",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Sulawesi Selatan",
  "Kalimantan Timur",
  "Lainnya",
];

const draftKey = "proofylink-partner-onboarding-draft";

const inputClass =
  "h-11 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";
const textareaClass =
  "min-h-24 w-full resize-none rounded-md border bg-transparent px-3 py-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

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

export type PartnerOnboardingData = {
  picName: string;
  picTitle: string;
  picEmail: string;
  picPhone: string;
  institutionName: string;
  institutionType: string;
  description: string;
  province: string;
  city: string;
  officeAddress: string;
  website: string;
  skNumber: string;
  skFileName: string;
  skFileSize?: string;
  skDocumentUrl?: string;
  confirmationAgreed: boolean;
};

const defaultForm: PartnerOnboardingData = {
  picName: "",
  picTitle: "Koordinator Career Center / Hubungan Industri",
  picEmail: "",
  picPhone: "",
  institutionName: "",
  institutionType: "Universitas Negeri (PTN)",
  description: "Lembaga pendidikan tinggi penyedia talent berkualitas dan pusat pengembangan karier mahasiswa.",
  province: "DKI Jakarta",
  city: "",
  officeAddress: "",
  website: "",
  skNumber: "SK-DIKTI-2024/001",
  skFileName: "SK_Kemitraan_Kampus.pdf",
  skFileSize: "1.2 MB",
  skDocumentUrl: "/documents/sample-sk-mitra.pdf",
  confirmationAgreed: true,
};

export function PartnerOnboarding() {
  const router = useRouter();
  const { user, reloadBootstrap, setProvisioningStatus, setActivePartnerInstitution } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PartnerOnboardingData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof PartnerOnboardingData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [revisionNotes, setRevisionNotes] = useState<string | null>(null);
  const skInputRef = useRef<HTMLInputElement>(null);

  // Load existing data from API or draft
  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const res = await fetch("/api/partner/onboarding", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.partnership && active) {
            const p = data.partnership;
            let city = "";
            let province = "DKI Jakarta";
            if (p.location) {
              const parts = p.location.split(",");
              city = parts[0]?.trim() || "";
              province = parts[1]?.trim() || "DKI Jakarta";
            }

            setForm((prev) => ({
              ...prev,
              institutionName: p.name || prev.institutionName,
              skNumber: p.skNumber || prev.skNumber,
              skDocumentUrl: p.skDocumentUrl || prev.skDocumentUrl,
              skFileName: p.skDocumentUrl ? p.skDocumentUrl.split("/").pop() || "Surat_SK_Mitra.pdf" : prev.skFileName,
              city: city || prev.city,
              province: province || prev.province,
              picName: data.profile?.displayName || user?.name || prev.picName,
              picEmail: user?.email || prev.picEmail,
              picPhone: data.profile?.phone || prev.picPhone,
            }));

            if (p.verificationNotes) {
              setRevisionNotes(p.verificationNotes);
            }
          }
        }
      } catch {
        try {
          const saved = localStorage.getItem(draftKey);
          if (saved && active) {
            setForm(JSON.parse(saved));
          }
        } catch {}
      } finally {
        if (active) {
          setForm((prev) => ({
            ...prev,
            institutionName: prev.institutionName || user?.companyName || user?.name || "Universitas Indonesia",
            picEmail: prev.picEmail || user?.email || "",
            picName: prev.picName || user?.name || "Dr. Perwakilan Kampus",
          }));
          if (user?.provisioningReason) {
            setRevisionNotes(user.provisioningReason);
          }
          setInitialLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [user]);

  // Save to draft
  useEffect(() => {
    if (!initialLoading) {
      try {
        localStorage.setItem(draftKey, JSON.stringify(form));
      } catch {}
    }
  }, [form, initialLoading]);

  const update = <K extends keyof PartnerOnboardingData>(key: K, value: PartnerOnboardingData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleFileUpload = (file: File | null) => {
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Format file harus PDF, JPG, atau PNG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB.");
      return;
    }

    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    setForm((prev) => ({
      ...prev,
      skFileName: file.name,
      skFileSize: sizeStr,
      skDocumentUrl: `/uploads/documents/${file.name}`,
    }));
    toast.success(`Berkas ${file.name} (${sizeStr}) siap dilampirkan.`);
  };

  const validateStep = (currentStep: number): boolean => {
    const nextErrors: Partial<Record<keyof PartnerOnboardingData, string>> = {};

    if (currentStep === 0) {
      if (!form.picName.trim() || form.picName.trim().length < 2) {
        nextErrors.picName = "Nama lengkap PIC wajib diisi.";
      }
      if (!form.picTitle.trim()) {
        nextErrors.picTitle = "Jabatan / Posisi wajib diisi.";
      }
    } else if (currentStep === 1) {
      if (!form.institutionName.trim() || form.institutionName.trim().length < 2) {
        nextErrors.institutionName = "Nama lembaga/kampus wajib diisi.";
      }
      if (!form.city.trim()) {
        nextErrors.city = "Kota domisili kampus wajib diisi.";
      }
    } else if (currentStep === 2) {
      // Step 2 (SK & Dokumen) bypassable
    } else if (currentStep === 3) {
      if (!form.confirmationAgreed) {
        nextErrors.confirmationAgreed = "Anda harus menyetujui pernyataan keabsahan dokumen.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, partnerSteps.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast.error("Mohon lengkapi kolom yang bertanda merah.");
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveAndExit = () => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(form));
    } catch {}
    toast.info("Draf berhasil disimpan. Anda dapat melanjutkan kapan saja.");
    router.push("/");
  };

  const handleSubmit = async () => {
    if (!form.confirmationAgreed) {
      toast.error("Mohon centang persetujuan keabsahan data.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        institutionName: form.institutionName.trim() || "Universitas Indonesia",
        institutionType: form.institutionType,
        city: form.city.trim() || "Jakarta Pusat",
        province: form.province,
        location: `${form.city.trim() || "Jakarta Pusat"}, ${form.province}`,
        officeAddress: form.officeAddress.trim() || undefined,
        website: form.website.trim() || undefined,
        skNumber: form.skNumber.trim() || "SK-DIKTI-2024/001",
        skFileName: form.skFileName || "SK_Kemitraan_Kampus.pdf",
        skDocumentUrl: form.skDocumentUrl || `/documents/${form.skFileName || "sample-sk-mitra.pdf"}`,
        picName: form.picName.trim() || "Dr. Perwakilan Kampus",
        picEmail: form.picEmail.trim() || user?.email || "mitra@kampus.ac.id",
        picPhone: form.picPhone.trim() || "081234567890",
        picPosition: form.picTitle.trim() || "Koordinator Career Center",
      };

      const res = await fetch("/api/partner/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal mengirim data pengajuan kemitraan.");
      }

      try {
        localStorage.removeItem(draftKey);
      } catch {}

      setActivePartnerInstitution(payload.institutionName);
      setProvisioningStatus("pending", null);
      await reloadBootstrap();

      toast.success("Pengajuan kemitraan berhasil dikirim untuk compliance review!");
      router.push("/partner/pending");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses pengajuan.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="size-8 animate-spin text-[#7C3AED] mx-auto" />
          <p className="text-sm text-muted-foreground">Menyiapkan workspace onboarding kemitraan...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen w-full flex-col md:h-screen md:overflow-hidden md:p-6 lg:p-8">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col md:flex-row overflow-hidden border-border bg-card md:rounded-2xl md:border md:shadow-2xl">
          {/* Mobile Brand Top Bar */}
          <div className="flex items-center justify-between border-b bg-[#0b2342] px-4 py-3 text-white md:hidden">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#7C3AED] text-white shadow-xs">
                <GraduationCap className="size-4" />
              </span>
              <span>ProofyLink</span>
            </div>
            <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-[#7aaee0]">
              Partnership
            </span>
          </div>

          {/* ─── LEFT SIDEBAR (DARK ENTERPRISE BLUE) ─── */}
          <aside className="hidden w-[295px] shrink-0 flex-col bg-[#0b2342] p-7 text-white md:flex">
            <div className="flex items-center gap-2.5 font-bold text-base">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#7C3AED] text-white shadow-xs">
                <GraduationCap className="size-5" />
              </span>
              <span>ProofyLink</span>
            </div>

            <div className="mt-12">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#7aaee0]">Onboarding Kemitraan</p>
              <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-white">
                Verifikasi Lembaga &amp; Akses Talent Network.
              </h1>
              <p className="mt-3 text-xs leading-5 text-[#b7c8dc]">
                Lengkapi identitas PIC, legalitas instansi, dan dokumen compliance untuk standar kemitraan terpercaya.
              </p>
            </div>

            {/* Stepper Navigation */}
            <div className="mt-auto space-y-2">
              {partnerSteps.map((item, index) => {
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
            <div className="border-b bg-card px-4 py-3.5 sm:px-8 sm:py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-[#0b2342] font-semibold">
                    Langkah {String(step + 1).padStart(2, "0")} / {String(partnerSteps.length).padStart(2, "0")}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-foreground md:text-2xl">{partnerSteps[step].title}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {Math.round(((step + 1) / partnerSteps.length) * 100)}% selesai
                  </p>
                  <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-muted sm:w-40">
                    <div
                      className="h-full rounded-full bg-[#0b2342] transition-all duration-300"
                      style={{ width: `${((step + 1) / partnerSteps.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-1 md:hidden">
                {partnerSteps.map((item, index) => (
                  <span
                    key={item.title}
                    className={`h-1 flex-1 rounded-full ${index <= step ? "bg-[#0b2342]" : "bg-muted"}`}
                  />
                ))}
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-7">
              <div className="mx-auto max-w-2xl">
                {/* Revision alert if returned by admin */}
                {revisionNotes && (
                  <div className="mb-6 rounded-xl border border-orange-300 bg-orange-50/80 p-4 text-xs text-orange-950 space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-2 font-bold text-orange-900">
                      <AlertCircle className="size-4.5 text-orange-600" />
                      <span>Catatan Revisi dari Tim Compliance</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed pl-6">{revisionNotes}</p>
                  </div>
                )}

                {/* ── STEP 0: AKUN PIC KEMITRAAN ── */}
                {step === 0 && (
                  <Intro
                    title="Identitas PIC Kemitraan *"
                    text="Data perwakilan resmi career center kampus yang akan mengelola verifikasi mahasiswa & kemitraan industri."
                  >
                    <div className="space-y-4">
                      <Field label="Nama Lengkap PIC *" error={errors.picName}>
                        <input
                          required
                          className={inputClass}
                          value={form.picName}
                          onChange={(e) => update("picName", e.target.value)}
                          placeholder="Nama lengkap PIC / Koordinator"
                        />
                      </Field>

                      <Field label="Jabatan / Posisi di Lembaga *" error={errors.picTitle}>
                        <input
                          required
                          className={inputClass}
                          value={form.picTitle}
                          onChange={(e) => update("picTitle", e.target.value)}
                          placeholder="Contoh: Koordinator Career Center / Hubungan Industri"
                        />
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Email Resmi PIC *" hint="Email untuk notifikasi akun" error={errors.picEmail}>
                          <input
                            type="email"
                            className={inputClass}
                            value={form.picEmail}
                            onChange={(e) => update("picEmail", e.target.value)}
                            placeholder="email@kampus.ac.id"
                          />
                        </Field>

                        <Field label="WhatsApp / No Telepon PIC *" hint="Dapat dihubungi untuk konfirmasi" error={errors.picPhone}>
                          <input
                            type="tel"
                            className={inputClass}
                            value={form.picPhone}
                            onChange={(e) => update("picPhone", e.target.value)}
                            placeholder="0812xxxxxxxx"
                          />
                        </Field>
                      </div>

                      <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
                        <ShieldCheck className="size-4 text-[#7C3AED] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[#0b2342] block font-semibold">Keamanan Profil Mitra Terverifikasi</strong>
                          <span className="text-slate-600">
                            PIC yang terdaftar memiliki hak untuk memvalidasi status kelulusan alumni &amp; menerbitkan lencana Campus Verified.
                          </span>
                        </div>
                      </div>
                    </div>
                  </Intro>
                )}

                {/* ── STEP 1: PROFIL LEMBAGA ── */}
                {step === 1 && (
                  <Intro
                    title="Profil Lembaga / Institusi Kampus *"
                    text="Informasi entitas pendidikan resmi sesuai Surat Keputusan dan operasional kampus."
                  >
                    <div className="space-y-4">
                      <Field label="Nama Lembaga / Instansi *" error={errors.institutionName}>
                        <input
                          required
                          className={inputClass}
                          value={form.institutionName}
                          onChange={(e) => update("institutionName", e.target.value)}
                          placeholder="Contoh: Universitas Gadjah Mada / Institut Teknologi Bandung"
                        />
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Jenis Lembaga / Kategori *">
                          <select
                            className={inputClass}
                            value={form.institutionType}
                            onChange={(e) => update("institutionType", e.target.value)}
                          >
                            {INSTITUTION_TYPE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Provinsi Domisili *">
                          <select
                            className={inputClass}
                            value={form.province}
                            onChange={(e) => update("province", e.target.value)}
                          >
                            {PROVINCE_OPTIONS.map((prov) => (
                              <option key={prov} value={prov}>
                                {prov}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Kota / Kabupaten *" error={errors.city}>
                          <input
                            required
                            className={inputClass}
                            value={form.city}
                            onChange={(e) => update("city", e.target.value)}
                            placeholder="Kota lokasi kampus"
                          />
                        </Field>

                        <Field label="Website Resmi Lembaga">
                          <input
                            type="url"
                            className={inputClass}
                            value={form.website}
                            onChange={(e) => update("website", e.target.value)}
                            placeholder="https://..."
                          />
                        </Field>
                      </div>

                      <Field label="Alamat Kantor / Sekretariat Career Center">
                        <textarea
                          className={textareaClass}
                          value={form.officeAddress}
                          onChange={(e) => update("officeAddress", e.target.value)}
                          placeholder="Alamat lengkap gedung rektorat atau sekretariat kemitraan..."
                        />
                      </Field>
                    </div>
                  </Intro>
                )}

                {/* ── STEP 2: SURAT SK & LEGALITAS (BYPASSABLE) ── */}
                {step === 2 && (
                  <Intro
                    title="Surat Keputusan (SK) &amp; Berkas Legalitas"
                    text="Lampirkan nomor SK dan dokumen pendirian atau surat tugas resmi kemitraan (Opsional / Dapat Di-bypass)."
                  >
                    <div className="space-y-5">
                      <Field
                        label="Nomor Surat Keputusan (SK) Resmi (Opsional / Bypass)"
                        hint="Dapat dikosongkan (default: SK-DIKTI-2024/001)"
                      >
                        <input
                          className={inputClass}
                          value={form.skNumber}
                          onChange={(e) => update("skNumber", e.target.value)}
                          placeholder="Nomor SK resmi dari Kemendikbud / Kemenag / Rektorat"
                        />
                      </Field>

                      <Field
                        label="Unggah Salinan Berkas Surat SK (PDF / JPG) (Opsional / Bypass)"
                        hint="Maksimal 10MB. Jika tidak diunggah, dokumen kemitraan default akan disiapkan."
                      >
                        <input
                          ref={skInputRef}
                          type="file"
                          accept=".pdf,image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
                        />

                        <div
                          onClick={() => skInputRef.current?.click()}
                          className={`mt-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all cursor-pointer ${
                            form.skFileName
                              ? "border-purple-300 bg-purple-50/40"
                              : "border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-[#7C3AED]"
                          }`}
                        >
                          <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED] shadow-2xs mb-3">
                            <UploadCloud className="size-6" />
                          </div>
                          {form.skFileName ? (
                            <div className="text-center space-y-1">
                              <p className="text-sm font-bold text-purple-950 flex items-center justify-center gap-1.5">
                                <FileCheck className="size-4 text-emerald-600" /> {form.skFileName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {form.skFileSize || "Berkas terlampir"} · Klik untuk mengganti dokumen
                              </p>
                            </div>
                          ) : (
                            <div className="text-center space-y-1">
                              <p className="text-sm font-semibold text-slate-800">
                                Klik untuk memilih berkas Surat SK (Opsional)
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Mendukung format PDF, PNG, atau JPG hingga 10MB
                              </p>
                            </div>
                          )}
                        </div>
                      </Field>

                      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
                        <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
                        <p>
                          Berkas Surat SK menjamin validitas lembaga sehingga mahasiswa universitas Anda dapat memperoleh lencana <strong>Campus Verified Talent</strong> di ProofyLink.
                        </p>
                      </div>
                    </div>
                  </Intro>
                )}

                {/* ── STEP 3: REVIEW & PENGAJUAN (EXACT MOCKUP STYLE) ── */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-foreground">Satu langkah lagi.</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Tinjau detail lembaga dan berkas legalitas sebelum dikirimkan ke antrean compliance review.
                      </p>
                    </div>

                    {/* Dark Navy Review Card (Matching Screenshot) */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="bg-[#0b2342] p-6 text-white space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-emerald-900/70 px-2.5 py-1 text-xs font-semibold text-emerald-300 border border-emerald-700/50">
                            Status: Siap Ditinjau
                          </span>
                          <span className="rounded-md bg-purple-900/70 px-2.5 py-1 text-xs font-semibold text-purple-200 border border-purple-700/50">
                            {form.institutionType}
                          </span>
                        </div>

                        <h3 className="text-2xl font-bold tracking-tight text-white">
                          {form.institutionName || "Universitas Indonesia"}
                        </h3>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {form.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-emerald-400" />
                            {form.city || "Jakarta Pusat"}, {form.province}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <GraduationCap className="size-3.5 text-purple-300" />
                            {form.institutionType}
                          </span>
                          <span>•</span>
                          <span>
                            PIC: <strong>{form.picName || "Budi Santoso"}</strong> ({form.picTitle})
                          </span>
                        </div>
                      </div>

                      {/* White Details Section */}
                      <div className="p-6 space-y-5 text-xs text-slate-700">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                          <div>
                            <span className="text-muted-foreground block text-[11px]">Email PIC</span>
                            <strong className="text-slate-900 font-semibold text-xs">{form.picEmail || user?.email || "mitra@kampus.ac.id"}</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[11px]">WhatsApp PIC</span>
                            <strong className="text-slate-900 font-semibold text-xs">{form.picPhone || "0812-9876-5432"}</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[11px]">Website Lembaga</span>
                            <strong className="text-slate-900 font-semibold text-xs">{form.website || "https://kampus.ac.id"}</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[11px]">Alamat Kantor</span>
                            <strong className="text-slate-900 font-semibold text-xs leading-relaxed">
                              {form.officeAddress || "Gedung Rektorat Lt. 2, Kampus Pusat"}
                            </strong>
                          </div>
                        </div>

                        {/* Berkas Terlampir Checklist */}
                        <div>
                          <p className="font-bold text-slate-900 text-xs mb-2.5">Berkas Terlampir:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2 text-slate-800">
                              <Check className="size-4 text-emerald-600 shrink-0" />
                              <span>Surat SK: <strong>{form.skFileName || "SK_Kemitraan_Kampus.pdf"}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-800">
                              <Check className="size-4 text-emerald-600 shrink-0" />
                              <span>Nomor SK: <strong>{form.skNumber || "SK-DIKTI-2024/001"}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-800">
                              <Check className="size-4 text-emerald-600 shrink-0" />
                              <span>Akta / Dokumen Resmi: <strong>SK_Kemenkumham.pdf</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-800">
                              <Check className="size-4 text-emerald-600 shrink-0" />
                              <span>KTP / Identitas PIC: <strong>KTP_PIC_Perwakilan.jpg</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Confirmation Checkbox Card */}
                    <label className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4 cursor-pointer text-xs leading-relaxed text-slate-700 transition-colors hover:bg-blue-50/70">
                      <input
                        type="checkbox"
                        checked={form.confirmationAgreed}
                        onChange={(e) => update("confirmationAgreed", e.target.checked)}
                        className="mt-0.5 size-4 rounded border-slate-300 text-[#0b2342] focus:ring-[#0b2342]"
                      />
                      <span>
                        Saya menyatakan bahwa seluruh data dan dokumen yang dilampirkan adalah benar, sah, dan saya memiliki wewenang resmi mewakili entitas lembaga bersangkutan untuk mendaftar di ProofyLink Talent Network.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* ─── BOTTOM NAVIGATION BAR (MATCHING MOCKUP) ─── */}
            <div className="flex items-center justify-between border-t bg-card px-4 py-3.5 sm:px-8 sm:py-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSaveAndExit}
                className="text-xs text-muted-foreground hover:text-foreground font-medium"
              >
                Simpan &amp; Keluar
              </Button>

              <div className="flex items-center gap-3">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={submitting}
                    className="gap-1.5 text-xs h-9 px-4 rounded-lg font-medium"
                  >
                    <ArrowLeft className="size-3.5" /> Kembali
                  </Button>
                )}

                {step < partnerSteps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-1.5 text-xs h-9 px-5 rounded-lg font-semibold bg-[#0b2342] hover:bg-[#1a3460] text-white shadow-xs"
                  >
                    Lanjutkan <ArrowRight className="size-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="gap-1.5 text-xs h-9 px-5 rounded-lg font-semibold bg-[#059669] hover:bg-[#047857] text-white shadow-xs"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        Kirim untuk Compliance Review <ShieldCheck className="size-3.5" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
