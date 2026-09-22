"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  FileText,
  FileUp,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
  User,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AccessibilitySettings } from "@/components/settings/accessibility-settings";
import { SecuritySettings } from "@/components/settings/security-settings";

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

// Form kosong: jangan pernah tampilkan data demo seolah data asli.
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

  const [form, setForm] = useState({ ...EMPTY_FORM });

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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah berkas PDF.");
    } finally {
      setUploadingDoc(null);
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      delete (payload as Record<string, unknown>).picEmail;
      delete (payload as Record<string, unknown>).verificationStatus;
      const res = await fetch("/api/recruiter/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan perubahan");

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
                <label htmlFor="picName" className="text-xs font-semibold text-foreground">Nama Lengkap PIC</label>
                <Input
                  id="picName"
                  type="text"
                  required
                  value={form.picName}
                  onChange={(e) => setForm({ ...form, picName: e.target.value })}
                  className={inputClass}
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="picTitle" className="text-xs font-semibold text-foreground">Jabatan / Role PIC</label>
                <Input
                  id="picTitle"
                  type="text"
                  value={form.picTitle}
                  onChange={(e) => setForm({ ...form, picTitle: e.target.value })}
                  className={inputClass}
                  placeholder="Contoh: Talent Acquisition Lead"
                />
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
                <label htmlFor="picPhone" className="text-xs font-semibold text-foreground">Nomor Telepon / WhatsApp</label>
                <Input
                  id="picPhone"
                  type="tel"
                  required
                  value={form.picPhone}
                  onChange={(e) => setForm({ ...form, picPhone: e.target.value })}
                  className={inputClass}
                  placeholder="0812-xxxx-xxxx"
                />
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
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="companyName" className="text-xs font-semibold text-foreground">Nama Resmi Perusahaan (PT/CV)</label>
                  <Input
                    id="companyName"
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className={inputClass}
                    placeholder="Nama badan hukum perusahaan"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="industry" className="text-xs font-semibold text-foreground">Sektor Industri</label>
                  <select
                    id="industry"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Pilih sektor industri</option>
                    {INDUSTRY_OPTIONS.map((ind) => (
                      <option key={ind.value} value={ind.value}>
                        {ind.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="companySize" className="text-xs font-semibold text-foreground">Skala / Ukuran Perusahaan</label>
                  <select
                    id="companySize"
                    value={form.companySize}
                    onChange={(e) => setForm({ ...form, companySize: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Pilih skala perusahaan</option>
                    {COMPANY_SIZE_OPTIONS.map((sz) => (
                      <option key={sz.id} value={sz.id}>
                        {sz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="city" className="text-xs font-semibold text-foreground">Kota Kantor</label>
                  <Input
                    id="city"
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className={inputClass}
                    placeholder="Contoh: Jakarta Selatan"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="description" className="text-xs font-semibold text-foreground">Deskripsi Perusahaan</label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={textareaClass}
                  placeholder="Ceritakan tentang model bisnis, produk, atau nilai perusahaan..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="websiteUrl" className="text-xs font-semibold text-foreground">Website Resmi</label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={form.websiteUrl}
                    onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                    className={inputClass}
                    placeholder="https://perusahaan.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="linkedinUrl" className="text-xs font-semibold text-foreground">Profil LinkedIn Perusahaan</label>
                  <Input
                    id="linkedinUrl"
                    type="url"
                    value={form.linkedinUrl}
                    onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                    className={inputClass}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="officeAddress" className="text-xs font-semibold text-foreground">Alamat Kantor Lengkap</label>
                <Input
                  id="officeAddress"
                  type="text"
                  value={form.officeAddress}
                  onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
                  className={inputClass}
                  placeholder="Gedung, lantai, nomor, dan nama jalan"
                />
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
    </div>
  );
}
