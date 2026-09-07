"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  FileCheck,
  Lock,
  Save,
  ShieldCheck,
  User,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AccessibilitySettings } from "@/components/settings/accessibility-settings";
import { SecuritySettings } from "@/components/settings/security-settings";

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
  { id: "1-10", label: "1 — 10 Karyawan (Startup / Usaha Rintisan)" },
  { id: "11-50", label: "11 — 50 Karyawan (Pertumbuhan Awal)" },
  { id: "51-200", label: "51 — 200 Karyawan (Menengah / Mid-Sized)" },
  { id: "201-500", label: "201 — 500 Karyawan (Perusahaan Besar)" },
  { id: "500+", label: "500+ Karyawan (Korporasi / Enterprise)" },
];

export function RecruiterSettingsView() {
  const [activeTab, setActiveTab] = useState<"profile" | "accessibility" | "security">("profile");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    picName: "Budi Santoso",
    picEmail: "budi@perusahaan.com",
    picTitle: "Head of Talent Acquisition",
    picPhone: "0812-9876-5432",
    companyName: "PT Berkah Sinarindo",
    industry: "Teknologi & Perangkat Lunak (SaaS / IT)",
    companySize: "51-200",
    description: "Perusahaan teknologi penyedia platform digital & ekosistem automasi bisnis terintegrasi.",
    websiteUrl: "https://berkahsinarindo.co.id",
    linkedinUrl: "https://linkedin.com/company/berkah-sinarindo",
    officeAddress: "Gedung Cyber 2 Lt. 18, Jl. HR Rasuna Said Blok X-5",
    city: "Jakarta Selatan, DKI Jakarta",
    nibNumber: "9120001234567",
    npwpNumber: "01.234.567.8-012.000",
    verificationStatus: "approved",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/recruiter/profile");
        const json = await res.json();
        if (json?.data) {
          setForm((prev) => ({ ...prev, ...json.data }));
        }
      } catch {
        // use fallback initial
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
      const res = await fetch("/api/recruiter/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan perubahan");

      toast.success("Profil dan data perusahaan berhasil diperbarui!");
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
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      Terverifikasi Resmi
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Dokumen legalitas entitas Anda telah disetujui untuk membuka profil kandidat berbasis consent.
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
                <label className="text-xs font-semibold text-foreground">Nama Lengkap PIC</label>
                <input
                  type="text"
                  required
                  value={form.picName}
                  onChange={(e) => setForm({ ...form, picName: e.target.value })}
                  className={inputClass}
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Jabatan / Role PIC</label>
                <input
                  type="text"
                  value={form.picTitle}
                  onChange={(e) => setForm({ ...form, picTitle: e.target.value })}
                  className={inputClass}
                  placeholder="Contoh: Talent Acquisition Lead"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Email Akun PIC</label>
                <input
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
                <label className="text-xs font-semibold text-foreground">Nomor Telepon / WhatsApp</label>
                <input
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
                  <label className="text-xs font-semibold text-foreground">Nama Resmi Perusahaan (PT/CV)</label>
                  <input
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className={inputClass}
                    placeholder="Nama badan hukum perusahaan"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Sektor Industri</label>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className={inputClass}
                  >
                    {INDUSTRY_OPTIONS.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Skala / Ukuran Perusahaan</label>
                  <select
                    value={form.companySize}
                    onChange={(e) => setForm({ ...form, companySize: e.target.value })}
                    className={inputClass}
                  >
                    {COMPANY_SIZE_OPTIONS.map((sz) => (
                      <option key={sz.id} value={sz.id}>
                        {sz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Kota Kantor</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className={inputClass}
                    placeholder="Contoh: Jakarta Selatan"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Deskripsi Perusahaan</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={textareaClass}
                  placeholder="Ceritakan tentang model bisnis, produk, atau nilai perusahaan..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Website Resmi</label>
                  <input
                    type="url"
                    value={form.websiteUrl}
                    onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                    className={inputClass}
                    placeholder="https://perusahaan.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Profil LinkedIn Perusahaan</label>
                  <input
                    type="url"
                    value={form.linkedinUrl}
                    onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                    className={inputClass}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Alamat Kantor Lengkap</label>
                <input
                  type="text"
                  value={form.officeAddress}
                  onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
                  className={inputClass}
                  placeholder="Gedung, lantai, nomor, dan nama jalan"
                />
              </div>
            </CardContent>
          </Card>

          {/* Bagian 3: Legalitas & NPWP/NIB */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <FileCheck className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Dokumen Legalitas &amp; Perpajakan</CardTitle>
                  <CardDescription className="text-xs">
                    Nomor identifikasi izin berusaha dan NPWP yang terdaftar di sistem ProofyLink.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nomor Induk Berusaha (NIB)</label>
                <input
                  type="text"
                  value={form.nibNumber}
                  onChange={(e) => setForm({ ...form, nibNumber: e.target.value })}
                  className={inputClass}
                  placeholder="Contoh: 9120001234567"
                />
                <span className="text-[11px] text-muted-foreground">
                  NIB terdaftar di Online Single Submission (OSS).
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nomor Pokok Wajib Pajak (NPWP)</label>
                <input
                  type="text"
                  value={form.npwpNumber}
                  onChange={(e) => setForm({ ...form, npwpNumber: e.target.value })}
                  className={inputClass}
                  placeholder="01.234.567.8-012.000"
                />
                <span className="text-[11px] text-muted-foreground">
                  NPWP Badan Usaha yang valid.
                </span>
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
