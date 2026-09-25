"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  FileText,
  FileUp,
  Loader2,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Sliders,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IndonesianPhoneInput } from "@/components/ui/phone-input";
import { AccessibilitySettings } from "@/components/settings/accessibility-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { ImageCropDialog } from "@/components/ui/image-crop-dialog";
import { cn, extractIndonesianLocalPhone } from "@/lib/utils";

// Nilai value selaras dengan enum API (industry_sector / company_scale); label tetap Bahasa Indonesia.
const INDUSTRY_OPTIONS = [
  { value: "Technology", label: "Teknologi & Perangkat Lunak (SaaS / IT)" },
  { value: "Financial Services", label: "Fintech & Layanan Keuangan" },
  { value: "Retail", label: "E-Commerce & Retail Modern" },
  { value: "Manufacturing", label: "FMCG & Manufaktur" },
  { value: "Healthcare", label: "Kesehatan, Farmasi & Medtech" },
  { value: "Logistics", label: "Logistik, Transportasi & Supply Chain" },
  { value: "Professional Services", label: "Konsultan & Layanan Bisnis Profesional" },
  { value: "Education", label: "Pendidikan & Edutech" },
  { value: "Hospitality", label: "Hospitality & Pariwisata" },
  { value: "Other", label: "Lainnya" },
];

const COMPANY_SIZE_OPTIONS = [
  { id: "1-10 Karyawan", label: "1 — 10 Karyawan (Startup / Usaha Rintisan)" },
  { id: "11-50 Karyawan", label: "11 — 50 Karyawan (Pertumbuhan Awal)" },
  { id: "51-200 Karyawan", label: "51 — 200 Karyawan (Menengah / Mid-Sized)" },
  { id: "201-500 Karyawan", label: "201 — 500 Karyawan (Perusahaan Besar)" },
  { id: "500+ Karyawan", label: "500+ Karyawan (Korporasi / Enterprise)" },
];

const EMPTY_FORM = {
  picName: "",
  picEmail: "",
  picTitle: "",
  picPhone: "",
  companyName: "",
  industry: "",
  companySize: "",
  description: "",
  websiteUrl: "",
  linkedinUrl: "",
  officeAddress: "",
  city: "",
  province: "",
  companyEmail: "",
  companyPhone: "",
  logoUrl: "",
  bannerUrl: "",
  nibNumber: "",
  npwpNumber: "",
  nibDocumentUrl: "",
  npwpDocumentUrl: "",
  verificationStatus: "",
};

export function RecruiterSettingsView() {
  const [activeTab, setActiveTab] = useState<"profile" | "accessibility" | "security">("profile");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<"nib" | "npwp" | null>(null);
  const [openingDoc, setOpeningDoc] = useState<"nib" | "npwp" | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [cropModal, setCropModal] = useState<{
    open: boolean;
    imageSrc: string | null;
    fileName: string;
  }>({
    open: false,
    imageSrc: null,
    fileName: "",
  });

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChangeField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleOpenDocument = async (type: "nib" | "npwp") => {
    setOpeningDoc(type);
    try {
      const res = await fetch(`/api/recruiter/legal-docs?type=${type}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengambil URL dokumen.");
      }
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else if (data.isMock) {
        toast.info(data.message || "Dokumen diunggah dalam mode mock development.");
      } else {
        toast.error(data.message || "Dokumen belum diunggah.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuka dokumen PDF.";
      toast.error(msg);
    } finally {
      setOpeningDoc(null);
    }
  };

  const handleUploadDocument = async (type: "nib" | "npwp", file: File | null) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Format berkas tidak valid. Hanya berkas PDF (.pdf) yang diperbolehkan.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran berkas PDF maksimal 10MB");
      return;
    }

    setUploadingDoc(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", type);

      const res = await fetch("/api/recruiter/legal-docs", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah berkas PDF");
      }

      setForm((prev) => ({
        ...prev,
        [type === "nib" ? "nibDocumentUrl" : "npwpDocumentUrl"]: data.storagePath,
      }));
      toast.success(`Berkas PDF ${file.name} berhasil diunggah!`);
    } finally {
      setUploadingDoc(null);
    }
  };

  const uploadLogoBlob = async (blob: Blob, fileName: string) => {
    setUploadingLogo(true);
    const toastId = toast.loading("Mengunggah foto / logo perusahaan...");
    try {
      const formData = new FormData();
      formData.append("file", blob, fileName);

      const res = await fetch("/api/recruiter/company-logo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah logo");
      handleChangeField("logoUrl", data.url);
      toast.success("Foto / Logo perusahaan berhasil diperbarui!", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah logo.", { id: toastId });
    } finally {
      setUploadingLogo(false);
    }
  };

  const onSelectLogoFile = (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran logo maksimal 5MB");
      return;
    }

    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    if (isSvg) {
      void uploadLogoBlob(file, file.name);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropModal({
        open: true,
        imageSrc: reader.result as string,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const cleanBase = (cropModal.fileName || "company-logo").replace(/\.[^/.]+$/, "");
    await uploadLogoBlob(croppedBlob, `${cleanBase}.webp`);
  };

  const handleRemoveLogo = async () => {
    if (!form.logoUrl) return;
    const toastId = toast.loading("Menghapus foto / logo perusahaan...");
    try {
      const res = await fetch("/api/recruiter/company-logo", { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Gagal menghapus logo.");
      handleChangeField("logoUrl", "");
      toast.success("Logo perusahaan berhasil dihapus!", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus logo.", { id: toastId });
    }
  };


  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/recruiter/profile");
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error || "Gagal memuat profil perusahaan.");
        setIsDemo(json?.isDemo === true);
        if (json?.data && typeof json.data === "object") {
          setForm((prev) => {
            const next = { ...prev };
            for (const key of Object.keys(prev) as (keyof typeof prev)[]) {
              const v = json.data[key];
              next[key] = typeof v === "string" ? v : "";
            }

            // Autofill Jabatan / Role PIC jika belum terisi dari server: fallback ke draft onboarding di localStorage
            if (!next.picTitle) {
              try {
                const draftRaw = window.localStorage.getItem("proofylink-recruiter-onboarding-draft");
                if (draftRaw) {
                  const draft = JSON.parse(draftRaw);
                  if (typeof draft?.form?.picTitle === "string" && draft.form.picTitle.trim()) {
                    next.picTitle = draft.form.picTitle.trim();
                  }
                }
              } catch {}
            }

            return next;
          });
        }
        setLoadError(null);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Gagal memuat profil perusahaan.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const validateForm = () => {
    const errs: Record<string, string> = {};

    // 1. Identitas PIC
    if (!form.picName.trim()) {
      errs.picName = "Nama lengkap PIC wajib diisi.";
    } else if (form.picName.trim().length < 2) {
      errs.picName = "Nama lengkap PIC minimal 2 karakter.";
    }

    if (!form.picTitle.trim()) {
      errs.picTitle = "Jabatan / Role PIC wajib diisi.";
    } else if (form.picTitle.trim().length < 2) {
      errs.picTitle = "Jabatan / Role PIC minimal 2 karakter.";
    }

    const phoneDigits = extractIndonesianLocalPhone(form.picPhone);
    if (!phoneDigits) {
      errs.picPhone = "Nomor WhatsApp / telepon wajib diisi.";
    } else if (phoneDigits.length < 8) {
      errs.picPhone = "Nomor telepon minimal 8 digit angka.";
    } else if (phoneDigits.length > 15) {
      errs.picPhone = "Nomor telepon maksimal 15 digit angka.";
    }

    // 2. Profil Entitas Bisnis & Operasional
    if (!form.companyName.trim()) {
      errs.companyName = "Nama resmi perusahaan (PT/CV) wajib diisi.";
    } else if (form.companyName.trim().length < 2) {
      errs.companyName = "Nama resmi perusahaan minimal 2 karakter.";
    }

    if (!form.industry) {
      errs.industry = "Sektor industri wajib dipilih.";
    }

    if (!form.companySize) {
      errs.companySize = "Skala / ukuran perusahaan wajib dipilih.";
    }

    if (!form.city.trim()) {
      errs.city = "Kota & Provinsi kantor operasional wajib diisi.";
    } else if (form.city.trim().length < 2) {
      errs.city = "Kota & Provinsi kantor minimal 2 karakter.";
    }

    if (!form.description.trim()) {
      errs.description = "Deskripsi perusahaan wajib diisi.";
    } else if (form.description.trim().length < 10) {
      errs.description = "Deskripsi perusahaan minimal 10 karakter.";
    }

    // Website Resmi (Opsional, tetapi jika diisi harus URL valid)
    const rawWebsite = form.websiteUrl.trim();
    if (rawWebsite) {
      const fullWebsite = /^https?:\/\//i.test(rawWebsite) ? rawWebsite : `https://${rawWebsite}`;
      try {
        const u = new URL(fullWebsite);
        if (!u.hostname.includes(".") || u.hostname.length < 4) {
          errs.websiteUrl = "Format URL website tidak valid (contoh: https://perusahaan.com).";
        }
      } catch {
        errs.websiteUrl = "Format URL website tidak valid (contoh: https://perusahaan.com).";
      }
    }

    // Profil LinkedIn Perusahaan (Opsional, tetapi jika diisi harus URL LinkedIn valid)
    const rawLinkedIn = form.linkedinUrl.trim();
    if (rawLinkedIn) {
      const fullLinkedIn = /^https?:\/\//i.test(rawLinkedIn) ? rawLinkedIn : `https://${rawLinkedIn}`;
      try {
        const u = new URL(fullLinkedIn);
        const host = u.hostname.toLowerCase();
        const isLinkedInHost = host === "linkedin.com" || host.endsWith(".linkedin.com");
        if ((u.protocol !== "http:" && u.protocol !== "https:") || !isLinkedInHost) {
          errs.linkedinUrl = "URL harus mengarah ke profil LinkedIn perusahaan (contoh: https://linkedin.com/company/nama-perusahaan).";
        }
      } catch {
        errs.linkedinUrl = "Format URL LinkedIn tidak valid.";
      }
    }

    // Email Resmi Perusahaan (Opsional, jika diisi harus email valid)
    if (form.companyEmail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.companyEmail.trim())) {
        errs.companyEmail = "Format email perusahaan tidak valid (contoh: careers@perusahaan.com).";
      }
    }

    // Nomor Telepon Kantor Resmi (Opsional, jika diisi min 6 karakter)
    if (form.companyPhone.trim() && form.companyPhone.trim().length < 6) {
      errs.companyPhone = "Nomor telepon kantor minimal 6 karakter.";
    }

    if (!form.officeAddress.trim()) {
      errs.officeAddress = "Alamat kantor lengkap wajib diisi.";
    } else if (form.officeAddress.trim().length < 5) {
      errs.officeAddress = "Alamat kantor minimal 5 karakter.";
    }

    setErrors(errs);
    return errs;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    const errorKeys = Object.keys(validationErrors);
    if (errorKeys.length > 0) {
      toast.error("Mohon lengkapi seluruh kolom wajib sebelum menyimpan profil.");
      const firstKey = errorKeys[0];
      setTimeout(() => {
        const el = document.getElementById(firstKey) || document.querySelector(`[name="${firstKey}"]`);
        if (el) {
          (el as HTMLElement).focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
      return;
    }

    setSaving(true);
    try {
      const rawWebsite = form.websiteUrl.trim();
      const normalizedWebsite = rawWebsite
        ? /^https?:\/\//i.test(rawWebsite)
          ? rawWebsite
          : `https://${rawWebsite}`
        : "";

      const rawLinkedIn = form.linkedinUrl.trim();
      const normalizedLinkedIn = rawLinkedIn
        ? /^https?:\/\//i.test(rawLinkedIn)
          ? rawLinkedIn
          : `https://${rawLinkedIn}`
        : "";

      const payload = {
        ...form,
        websiteUrl: normalizedWebsite,
        linkedinUrl: normalizedLinkedIn,
      };
      delete (payload as Record<string, unknown>).picEmail;
      delete (payload as Record<string, unknown>).verificationStatus;

      const res = await fetch("/api/recruiter/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan perubahan");

      setForm((prev) => ({
        ...prev,
        websiteUrl: normalizedWebsite,
        linkedinUrl: normalizedLinkedIn,
      }));

      // Sinkronkan ke draft onboarding lokal jika ada
      try {
        const draftRaw = window.localStorage.getItem("proofylink-recruiter-onboarding-draft");
        if (draftRaw) {
          const draft = JSON.parse(draftRaw);
          if (draft && draft.form) {
            draft.form.picName = form.picName;
            draft.form.picTitle = form.picTitle;
            draft.form.picPhone = form.picPhone;
            draft.form.companyName = form.companyName;
            draft.form.industry = form.industry;
            draft.form.companySize = form.companySize;
            draft.form.city = form.city;
            draft.form.province = form.province;
            draft.form.companyEmail = form.companyEmail;
            draft.form.companyPhone = form.companyPhone;
            draft.form.logoUrl = form.logoUrl;
            draft.form.bannerUrl = form.bannerUrl;
            draft.form.description = form.description;
            draft.form.websiteUrl = normalizedWebsite;
            draft.form.linkedinUrl = normalizedLinkedIn;
            draft.form.officeAddress = form.officeAddress;
            window.localStorage.setItem("proofylink-recruiter-onboarding-draft", JSON.stringify(draft));
          }
        }
      } catch {}

      if (data?.isDemo) {
        toast.success("Tersimpan sebagai demo (tanpa database).");
      } else {
        toast.success("Profil dan data perusahaan berhasil diperbarui!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";
  const textareaClass =
    "min-h-24 w-full resize-none rounded-lg border border-input bg-transparent p-3 text-sm shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

  if (loading) {
    return (
      <div className="container mx-auto flex max-w-5xl items-center justify-center px-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const verificationStatus = form.verificationStatus;
  const isVerified = verificationStatus === "approved";
  const isPendingVerification =
    verificationStatus === "" ||
    verificationStatus === "pending" ||
    verificationStatus === "need_revision";

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
      {/* Header Halaman */}
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Workspace Rekruter
        </span>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Pengaturan Akun &amp; Perusahaan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola informasi perwakilan PIC, profil entitas bisnis, aksesibilitas antarmuka, dan keamanan akun.
        </p>
      </div>

      {loadError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50/70 p-4 sm:p-5">
          <p className="text-sm font-semibold text-red-800">Profil belum dapat dimuat.</p>
          <p className="mt-0.5 text-xs text-red-700">{loadError}</p>
        </div>
      )}

      {isDemo && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
          <p className="text-sm font-semibold text-amber-800">Mode demo aktif.</p>
          <p className="mt-0.5 text-xs text-amber-700">
            Data yang tampil bukan data asli dan perubahan tidak disimpan ke database.
          </p>
        </div>
      )}

      {/* Tabs Navigasi */}
      <div className="mb-8 flex flex-wrap gap-2 border-b border-border/80 pb-3">
        {[
          { id: "profile", label: "Profil & Perusahaan", icon: Building2 },
          { id: "accessibility", label: "Aksesibilitas", icon: Sliders },
          { id: "security", label: "Keamanan & Sandi", icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as "profile" | "accessibility" | "security")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                active
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Konten Tab 1: Profil & Perusahaan */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Status Kepatuhan & Verifikasi Legalitas */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">Status Kepatuhan Perusahaan:</h3>
                    {isVerified ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        Terverifikasi Resmi
                      </span>
                    ) : isPendingVerification ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                        Menunggu Verifikasi
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                        Verifikasi Bermasalah
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {isVerified
                      ? "Dokumen legalitas entitas Anda telah disetujui untuk membuka profil kandidat berbasis consent."
                      : "Status verifikasi mengikuti hasil peninjauan dokumen legalitas entitas Anda."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 1: Data PIC Rekruter */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <User className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Identitas PIC / Penanggung Jawab</CardTitle>
                  <CardDescription className="text-xs">
                    Informasi perwakilan resmi dari tim Talent Acquisition atau HR.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="picName" className="text-xs font-semibold text-foreground flex items-center gap-1.5 select-none">
                  <span>Nama Lengkap PIC</span>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-md px-1.5 py-0.5 leading-none tracking-wide uppercase">
                    Wajib
                  </span>
                </label>
                <Input
                  id="picName"
                  name="picName"
                  type="text"
                  value={form.picName}
                  onChange={(e) => handleChangeField("picName", e.target.value)}
                  className={cn(
                    inputClass,
                    errors.picName && "border-destructive focus-visible:border-destructive ring-destructive/20"
                  )}
                  placeholder="Contoh: Budi Santoso"
                  aria-invalid={Boolean(errors.picName)}
                />
                {errors.picName && (
                  <p role="alert" className="text-xs font-medium text-destructive flex items-center gap-1.5 mt-1">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{errors.picName}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="picTitle" className="text-xs font-semibold text-foreground flex items-center gap-1.5 select-none">
                  <span>Jabatan / Role PIC</span>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-md px-1.5 py-0.5 leading-none tracking-wide uppercase">
                    Wajib
                  </span>
                </label>
                <Input
                  id="picTitle"
                  name="picTitle"
                  type="text"
                  value={form.picTitle}
                  onChange={(e) => handleChangeField("picTitle", e.target.value)}
                  className={cn(
                    inputClass,
                    errors.picTitle && "border-destructive focus-visible:border-destructive ring-destructive/20"
                  )}
                  placeholder="Contoh: Talent Acquisition Lead"
                  aria-invalid={Boolean(errors.picTitle)}
                />
                {errors.picTitle && (
                  <p role="alert" className="text-xs font-medium text-destructive flex items-center gap-1.5 mt-1">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{errors.picTitle}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="picEmail" className="text-xs font-semibold text-foreground">Email Akun PIC</label>
                <Input
                  id="picEmail"
                  type="email"
                  disabled
                  value={form.picEmail}
                  className={`${inputClass} bg-slate-50 text-muted-foreground cursor-not-allowed`}
                />
                <span className="text-[11px] text-muted-foreground">
                  Email login terikat dengan akun dan tidak dapat diubah langsung.
                </span>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="picPhone" className="text-xs font-semibold text-foreground flex items-center gap-1.5 select-none">
                  <span>Nomor Telepon / WhatsApp</span>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-md px-1.5 py-0.5 leading-none tracking-wide uppercase">
                    Wajib
                  </span>
                </label>
                <IndonesianPhoneInput
                  id="picPhone"
                  name="picPhone"
                  value={form.picPhone}
                  onChange={(val) => handleChangeField("picPhone", val)}
                  error={Boolean(errors.picPhone)}
                  placeholder="812-3456-7890"
                />
                {errors.picPhone ? (
                  <p role="alert" className="text-xs font-medium text-destructive flex items-center gap-1.5 mt-1">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{errors.picPhone}</span>
                  </p>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    Hanya angka, otomatis menggunakan format kode negara +62.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bagian 2: Profil Perusahaan (Data Onboarding) */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Building2 className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Profil Entitas Bisnis &amp; Operasional</CardTitle>
                  <CardDescription className="text-xs">
                    Informasi entitas perusahaan yang ditampilkan pada kandidat saat permintaan screening.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Branding Perusahaan: Logo */}
              <div className="rounded-xl border border-border/80 bg-slate-50/60 p-4 sm:p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  {/* Preview Logo */}
                  <div className="flex flex-col items-center gap-2 w-24 sm:w-28 shrink-0">
                    <div className="relative flex size-24 sm:size-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-white shadow-2xs transition-all hover:bg-slate-50/70">
                      {form.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.logoUrl}
                          alt="Logo Perusahaan"
                          className="size-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-2 text-center select-none">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-primary/70 shadow-2xs border border-slate-200/80 mb-1.5 ring-1 ring-slate-100">
                            <Building2 className="size-5 text-primary/70" />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-600 whitespace-nowrap tracking-tight">
                            Belum ada logo
                          </span>
                          <span className="mt-0.5 text-[9px] text-muted-foreground whitespace-nowrap">
                            PNG, JPG, WebP
                          </span>
                        </div>
                      )}
                      {uploadingLogo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white backdrop-blur-2xs">
                          <Loader2 className="size-5 animate-spin" />
                        </div>
                      )}
                    </div>
                    {form.logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="inline-flex w-full items-center justify-center gap-1 text-[11px] font-medium text-destructive hover:text-destructive/80 hover:underline transition-colors text-center"
                      >
                        <Trash2 className="size-3" />
                        <span>Hapus Logo</span>
                      </button>
                    )}
                  </div>

                  {/* Kontrol Upload Berkas Logo & Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <span>Foto / Logo Resmi Perusahaan</span>
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-md px-1.5 py-0.5 leading-none tracking-wide uppercase">
                          Direkomendasikan
                        </span>
                      </h4>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Logo ini akan langsung ditampilkan kepada kandidat pada kartu pencarian dan halaman detail lowongan kerja. Gunakan format PNG, JPG, atau WebP (disesuaikan otomatis 512x512) atau SVG vektor (maks. 5MB).
                      </p>
                    </div>

                    <div>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-xs transition hover:bg-accent">
                        <Upload className="size-4 text-primary" />
                        <span>{uploadingLogo ? "Mengunggah berkas..." : "Unggah Berkas Logo"}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="sr-only"
                          disabled={uploadingLogo}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            onSelectLogoFile(file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="companyName" className="text-xs font-semibold text-foreground flex items-center gap-1.5 select-none">
                    <span>Nama Resmi Perusahaan (PT/CV)</span>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-md px-1.5 py-0.5 leading-none tracking-wide uppercase">
                      Wajib
                    </span>
                  </label>
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={form.companyName}
                    onChange={(e) => handleChangeField("companyName", e.target.value)}
                    className={cn(
                      inputClass,
                      errors.companyName && "border-destructive focus-visible:border-destructive ring-destructive/20"
                    )}
                    placeholder="Nama badan hukum perusahaan"
                    aria-invalid={Boolean(errors.companyName)}
                  />
                  {errors.companyName && (
                    <p role="alert" className="text-xs font-medium text-destructive flex items-center gap-1.5 mt-1">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>{errors.companyName}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="industry" className="text-xs font-semibold text-foreground flex items-center gap-1.5 select-none">
                    <span>Sektor Industri</span>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-md px-1.5 py-0.5 leading-none tracking-wide uppercase">
                      Wajib
                    </span>
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    value={form.industry}
                    onChange={(e) => handleChangeField("industry", e.target.value)}
                    className={cn(
                      inputClass,
                      errors.industry && "border-destructive focus-visible:border-destructive ring-destructive/20"
                    )}
                    aria-invalid={Boolean(errors.industry)}
                  >
                    <option value="">Pilih sektor industri</option>
                    {INDUSTRY_OPTIONS.map((ind) => (
                      <option key={ind.value} value={ind.value}>
                        {ind.label}
                      </option>
                    ))}
                  </select>
                  {errors.industry && (
                    <p role="alert" className="text-xs font-medium text-destructive flex items-center gap-1.5 mt-1">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>{errors.industry}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="companySize" className="text-xs font-semibold text-foreground flex items-center gap-1.5 select-none">
                    <span>Skala / Ukuran Perusahaan</span>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-md px-1.5 py-0.5 leading-none tracking-wide uppercase">
                      Wajib
                    </span>
                  </label>
                  <select
                    id="companySize"
                    name="companySize"
                    value={form.companySize}
                    onChange={(e) => handleChangeField("companySize", e.target.value)}
                    className={cn(
                      inputClass,
                      errors.companySize && "border-destructive focus-visible:border-destructive ring-destructive/20"
                    )}
                    aria-invalid={Boolean(errors.companySize)}
                  >
                    <option value="">Pilih skala perusahaan</option>
                    {COMPANY_SIZE_OPTIONS.map((sz) => (
                      <option key={sz.id} value={sz.id}>
                        {sz.label}
                      </option>
                    ))}
                  </select>
                  {errors.companySize && (
                    <p role="alert" className="text-xs font-medium text-destructive flex items-center gap-1.5 mt-1">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>{errors.companySize}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="city" className="text-xs font-semibold text-foreground flex items-center gap-1.5 select-none">
                    <span>Kota &amp; Provinsi Kantor</span>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-md px-1.5 py-0.5 leading-none tracking-wide uppercase">
                      Wajib
                    </span>
                  </label>
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    value={form.city}
                    onChange={(e) => handleChangeField("city", e.target.value)}
                    className={cn(
                      inputClass,
                      errors.city && "border-destructive focus-visible:border-destructive ring-destructive/20"
                    )}
                    placeholder="Contoh: Denpasar, Bali atau Jakarta Selatan, DKI Jakarta"
                    aria-invalid={Boolean(errors.city)}
                  />
                  {errors.city && (
                    <p role="alert" className="text-xs font-medium text-destructive flex items-center gap-1.5 mt-1">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>{errors.city}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Kontak Resmi Perusahaan */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="companyEmail" className="text-xs font-semibold text-foreground flex items-center gap-1.5 select-none">
                    <Mail className="size-3.5 text-primary" />
                    <span>Email Resmi Rekrutmen / Kantor</span>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-md px-1.5 py-0.5 leading-none tracking-wide uppercase">
                      Penting
                    </span>
                  </label>
                  <Input
                    id="companyEmail"
                    name="companyEmail"
                    type="email"
                    value={form.companyEmail}
                    onChange={(e) => handleChangeField("companyEmail", e.target.value)}
                    className={cn(
                      inputClass,
                      errors.companyEmail && "border-destructive focus-visible:border-destructive ring-destructive/20"
                    )}
                    placeholder="Contoh: careers@perusahaan.com"
                    aria-invalid={Boolean(errors.companyEmail)}
                  />
                  {errors.companyEmail && (
                    <p role="alert" className="text-xs font-medium text-destructive flex items-center gap-1.5 mt-1">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>{errors.companyEmail}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="companyPhone" className="text-xs font-semibold text-foreground flex items-center gap-1.5 select-none">
                    <Phone className="size-3.5 text-primary" />
                    <span>Telepon / Kontak Kantor Resmi</span>
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 border border-border/70 rounded-md px-1.5 py-0.5 leading-none">
                      Opsional
                    </span>
                  </label>
                  <IndonesianPhoneInput
                    id="companyPhone"
                    name="companyPhone"
                    value={form.companyPhone}
                    onChange={(val) => handleChangeField("companyPhone", val)}
                    error={Boolean(errors.companyPhone)}
                    placeholder="361-555-0148 atau 812-3456-7890"
                  />
                  {errors.companyPhone ? (
                    <p role="alert" className="text-xs font-medium text-destructive flex items-center gap-1.5 mt-1">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>{errors.companyPhone}</span>
                    </p>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      Hanya angka, otomatis menggunakan format kode negara +62.
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="description" className="text-xs font-semibold text-foreground flex items-center gap-1.5 select-none">
                  <span>Deskripsi Perusahaan</span>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-md px-1.5 py-0.5 leading-none tracking-wide uppercase">
                    Wajib
                  </span>
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={(e) => handleChangeField("description", e.target.value)}
                  className={cn(
                    textareaClass,
                    errors.description && "border-destructive focus-visible:border-destructive ring-destructive/20"
                  )}
                  placeholder="Ceritakan tentang model bisnis, produk, atau nilai perusahaan (minimal 10 karakter)..."
                  aria-invalid={Boolean(errors.description)}
                />
                {errors.description && (
                  <p role="alert" className="text-xs font-medium text-destructive flex items-center gap-1.5 mt-1">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{errors.description}</span>
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="websiteUrl" className="text-xs font-semibold text-foreground flex items-center gap-1.5 select-none">
                    <span>Website Resmi</span>
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 border border-border/70 rounded-md px-1.5 py-0.5 leading-none">
                      Opsional
                    </span>
                  </label>
                  <Input
                    id="websiteUrl"
                    name="websiteUrl"
                    type="text"
                    value={form.websiteUrl}
                    onChange={(e) => handleChangeField("websiteUrl", e.target.value)}
                    className={cn(
                      inputClass,
                      errors.websiteUrl && "border-destructive focus-visible:border-destructive ring-destructive/20"
                    )}
                    placeholder="https://perusahaan.com (opsional)"
                    aria-invalid={Boolean(errors.websiteUrl)}
                  />
                  {errors.websiteUrl && (
                    <p role="alert" className="text-xs font-medium text-destructive flex items-center gap-1.5 mt-1">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>{errors.websiteUrl}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="linkedinUrl" className="text-xs font-semibold text-foreground flex items-center gap-1.5 select-none">
                    <span>Profil LinkedIn Perusahaan</span>
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 border border-border/70 rounded-md px-1.5 py-0.5 leading-none">
                      Opsional
                    </span>
                  </label>
                  <Input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    type="text"
                    value={form.linkedinUrl}
                    onChange={(e) => handleChangeField("linkedinUrl", e.target.value)}
                    className={cn(
                      inputClass,
                      errors.linkedinUrl && "border-destructive focus-visible:border-destructive ring-destructive/20"
                    )}
                    placeholder="https://linkedin.com/company/nama-perusahaan (opsional)"
                    aria-invalid={Boolean(errors.linkedinUrl)}
                  />
                  {errors.linkedinUrl && (
                    <p role="alert" className="text-xs font-medium text-destructive flex items-center gap-1.5 mt-1">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>{errors.linkedinUrl}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="officeAddress" className="text-xs font-semibold text-foreground flex items-center gap-1.5 select-none">
                  <span>Alamat Kantor Lengkap</span>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-md px-1.5 py-0.5 leading-none tracking-wide uppercase">
                    Wajib
                  </span>
                </label>
                <Input
                  id="officeAddress"
                  name="officeAddress"
                  type="text"
                  value={form.officeAddress}
                  onChange={(e) => handleChangeField("officeAddress", e.target.value)}
                  className={cn(
                    inputClass,
                    errors.officeAddress && "border-destructive focus-visible:border-destructive ring-destructive/20"
                  )}
                  placeholder="Gedung, lantai, nomor, dan nama jalan (minimal 5 karakter)"
                  aria-invalid={Boolean(errors.officeAddress)}
                />
                {errors.officeAddress && (
                  <p role="alert" className="text-xs font-medium text-destructive flex items-center gap-1.5 mt-1">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{errors.officeAddress}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bagian 3: Legalitas & NPWP/NIB (Khusus PDF) */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <FileCheck className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Dokumen Legalitas &amp; Perpajakan Resmi (PDF)</CardTitle>
                  <CardDescription className="text-xs">
                    Unggah berkas resmi NIB OSS dan NPWP Badan Usaha dalam format PDF untuk verifikasi kepatuhan hukum oleh tim admin ProofyLink.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {/* NIB OSS Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="size-4 text-primary" /> Nomor Induk Berusaha (NIB OSS)
                  </span>
                  {form.nibDocumentUrl ? (
                    <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200">
                      <CheckCircle2 className="size-3 mr-1 text-emerald-600" /> PDF Tersimpan
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200">
                      Belum Diunggah
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Dokumen legalitas izin berusaha OSS berbasis risiko. Format resmi hanya PDF (maks. 10MB).
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {form.nibDocumentUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={openingDoc === "nib"}
                      onClick={() => handleOpenDocument("nib")}
                      className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5 font-medium"
                    >
                      {openingDoc === "nib" ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="size-3.5" />
                      )}
                      Lihat Berkas NIB
                    </Button>
                  )}
                  <label className={`cursor-pointer inline-flex items-center gap-1.5 rounded-md border border-input bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-slate-50 transition-colors shadow-xs ${uploadingDoc === "nib" ? "pointer-events-none opacity-60" : ""}`}>
                    {uploadingDoc === "nib" ? (
                      <Loader2 className="size-3.5 animate-spin text-primary" />
                    ) : (
                      <FileUp className="size-3.5 text-muted-foreground" />
                    )}
                    <span>{uploadingDoc === "nib" ? "Mengunggah..." : form.nibDocumentUrl ? "Ganti Berkas PDF" : "Unggah Berkas NIB (.pdf)"}</span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      disabled={uploadingDoc === "nib"}
                      onChange={(e) => handleUploadDocument("nib", e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>

              {/* NPWP Badan Usaha Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="size-4 text-primary" /> NPWP Badan Usaha
                  </span>
                  {form.npwpDocumentUrl ? (
                    <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200">
                      <CheckCircle2 className="size-3 mr-1 text-emerald-600" /> PDF Tersimpan
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200">
                      Belum Diunggah
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Kartu NPWP Badan atau Surat Keterangan Terdaftar (SKT) Pajak. Format resmi hanya PDF (maks. 10MB).
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {form.npwpDocumentUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={openingDoc === "npwp"}
                      onClick={() => handleOpenDocument("npwp")}
                      className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5 font-medium"
                    >
                      {openingDoc === "npwp" ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="size-3.5" />
                      )}
                      Lihat Berkas NPWP
                    </Button>
                  )}
                  <label className={`cursor-pointer inline-flex items-center gap-1.5 rounded-md border border-input bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-slate-50 transition-colors shadow-xs ${uploadingDoc === "npwp" ? "pointer-events-none opacity-60" : ""}`}>
                    {uploadingDoc === "npwp" ? (
                      <Loader2 className="size-3.5 animate-spin text-primary" />
                    ) : (
                      <FileUp className="size-3.5 text-muted-foreground" />
                    )}
                    <span>{uploadingDoc === "npwp" ? "Mengunggah..." : form.npwpDocumentUrl ? "Ganti Berkas PDF" : "Unggah Berkas NPWP (.pdf)"}</span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      disabled={uploadingDoc === "npwp"}
                      onChange={(e) => handleUploadDocument("npwp", e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tombol Simpan */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="size-4" />
              {saving ? "Menyimpan Perubahan..." : "Simpan Profil & Perusahaan"}
            </Button>
          </div>
        </form>
      )}

      {/* Konten Tab 2: Aksesibilitas */}
      {activeTab === "accessibility" && <AccessibilitySettings />}

      {/* Konten Tab 3: Keamanan & Sandi */}
      {activeTab === "security" && <SecuritySettings />}

      {/* Dialog Crop & Kompresi Logo Perusahaan (Rasio 1:1, Max 512x512 WebP) */}
      <ImageCropDialog
        open={cropModal.open}
        onOpenChange={(open) => setCropModal((prev) => ({ ...prev, open }))}
        imageSrc={cropModal.imageSrc}
        aspectRatio={1}
        cropShape="rect"
        targetWidth={512}
        title="Sesuaikan Logo Perusahaan"
        description="Geser dan sesuaikan zoom untuk mengatur posisi logo perusahaan Anda (rasio 1:1)."
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
