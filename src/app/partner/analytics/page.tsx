"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Download,
  GraduationCap,
  Target,
  TrendingUp,
  Users,
  Building2,
  FileSpreadsheet,
  Clock,
  Sparkles,
  MapPin,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/providers/app-provider";

const QUARTERLY_DATA = [
  { q: "Q1 2024", registered: 312, verified: 188, hired: 142, rate: "75.5%" },
  { q: "Q2 2024", registered: 401, verified: 264, hired: 206, rate: "78.0%" },
  { q: "Q3 2024", registered: 487, verified: 356, hired: 284, rate: "79.7%" },
  { q: "Q4 2024", registered: 647, verified: 482, hired: 388, rate: "80.5%" },
];

const PLACEMENT_BY_PROGRAM = [
  { program: "S1 Sistem Informasi", placed: 148, total: 172, rate: 86, avgWait: "1.4 bln", avgSalary: "Rp 6.8 jt" },
  { program: "S1 Sistem Komputer", placed: 112, total: 135, rate: 83, avgWait: "1.7 bln", avgSalary: "Rp 6.5 jt" },
  { program: "S1 Teknologi Informasi", placed: 96, total: 118, rate: 81, avgWait: "1.9 bln", avgSalary: "Rp 7.2 jt" },
  { program: "D3 Manajemen Informatika", placed: 64, total: 84, rate: 76, avgWait: "2.1 bln", avgSalary: "Rp 5.2 jt" },
  { program: "S1 Bisnis Digital", placed: 58, total: 76, rate: 76, avgWait: "2.3 bln", avgSalary: "Rp 5.8 jt" },
];

const PLACEMENT_DISTRIBUTION = [
  { label: "Bali & Nusa Tenggara", pct: 44, count: 210, color: "bg-[#7C3AED]" },
  { label: "Jabodetabek (Hybrid/Onsite)", pct: 32, count: 153, color: "bg-sky-500" },
  { label: "Remote Global & Nasional", pct: 16, count: 76, color: "bg-emerald-500" },
  { label: "Wilayah Lainnya", pct: 8, count: 39, color: "bg-amber-500" },
];

const IKU_INDICATORS = [
  {
    code: "IKU 1.1",
    title: "Mendapat Pekerjaan Layak (>1.2x UMR)",
    achievement: "78.2%",
    target: "60.0%",
    status: "Melampaui Target",
    statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    code: "IKU 1.2",
    title: "Melanjutkan Studi (Pascasarjana / Sertifikasi)",
    achievement: "12.4%",
    target: "10.0%",
    status: "Tercapai",
    statusColor: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    code: "IKU 1.3",
    title: "Wirausaha Berpenghasilan Cukup",
    achievement: "9.4%",
    target: "8.0%",
    status: "Tercapai",
    statusColor: "bg-purple-50 text-[#7C3AED] border-purple-200",
  },
];

export default function PartnerAnalyticsPage() {
  const { user, activePartnerInstitution } = useApp();
  const partnerInstitution = user?.companyName || activePartnerInstitution || "ITB STIKOM Bali";

  const [downloading, setDownloading] = useState(false);
  const maxRegistered = Math.max(...QUARTERLY_DATA.map((d) => d.registered));

  const handleDownloadReport = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      toast.success("Laporan Tracer Study Berhasil Diunduh!", {
        description: `Dokumen analitik & rekapitulasi IKU 1 untuk ${partnerInstitution} periode 2024 telah diekspor.`,
      });
    }, 1200);
  };

  return (
    <ProtectedRoute role="partner">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <Link
          href="/partner"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" /> Kembali ke Dashboard
        </Link>

        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#7C3AED]">
              <BarChart3 className="size-4" /> Tracer Study &amp; Employability Metrics
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1A1A2E]">
              Analisis Penyerapan Kerja
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Rekapitulasi kesiapan kerja, masa tunggu, keselarasan bidang, dan capaian IKU 1 institusi{" "}
              <strong className="text-foreground">{partnerInstitution}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-1.5 shadow-2xs">
              <Building2 className="size-4 text-[#7C3AED]" />
              <span className="text-xs text-muted-foreground">Institusi:</span>
              <span className="text-xs font-bold text-foreground">{partnerInstitution}</span>
            </div>

            <Button
              onClick={handleDownloadReport}
              disabled={downloading}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold gap-1.5"
            >
              <Download className="size-3.5" />
              {downloading ? "Menyiapkan PDF..." : "Unduh Laporan Akreditasi"}
            </Button>
          </div>
        </div>

        {/* Connected Stat Cells - Harmonized with Recruiter & Candidate Dashboard */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/80 bg-border/60 shadow-xs lg:grid-cols-4">
          <div className="bg-card p-5 transition-colors hover:bg-muted/30">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Users className="size-4" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">Total Responden Alumni</span>
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground">
              1.847 <span className="font-sans text-xs font-normal text-muted-foreground">Lulusan</span>
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">Kohort wisuda 2023 - 2024</p>
          </div>

          <div className="bg-card p-5 transition-colors hover:bg-muted/30">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Target className="size-4" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">Tingkat Penyerapan Kerja</span>
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tabular-nums tracking-tight text-emerald-600">
              79.8% <span className="font-sans text-xs font-normal text-muted-foreground">Terserap</span>
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">Target Kemendikbud tercapai</p>
          </div>

          <div className="bg-card p-5 transition-colors hover:bg-muted/30">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <Clock className="size-4" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">Rata-rata Waktu Tunggu</span>
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tabular-nums tracking-tight text-sky-600">
              1.8 <span className="font-sans text-xs font-normal text-muted-foreground">Bulan</span>
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">Standar nasional: &lt; 6 bulan</p>
          </div>

          <div className="bg-card p-5 transition-colors hover:bg-muted/30">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-purple-50 text-[#7C3AED]">
                <TrendingUp className="size-4" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">Keselarasan Bidang Ilmu</span>
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tabular-nums tracking-tight text-[#7C3AED]">
              83.4% <span className="font-sans text-xs font-normal text-muted-foreground">Tinggi/Sesuai</span>
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">Linear dengan kurikulum program studi</p>
          </div>
        </div>

        {/* IKU 1 (Indikator Kinerja Utama) Card */}
        <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <GraduationCap className="size-4 text-[#7C3AED]" /> Capaian IKU 1 Perguruan Tinggi (Lulusan Mendapat Pekerjaan Layak)
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                Status: Memenuhi Akreditasi Unggul
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {IKU_INDICATORS.map((item) => (
                <div key={item.code} className="rounded-xl border border-border/70 p-4 bg-muted/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#7C3AED]">{item.code}</span>
                    <Badge className={`text-[10px] ${item.statusColor}`}>{item.status}</Badge>
                  </div>
                  <p className="text-xs font-semibold text-foreground line-clamp-1">{item.title}</p>
                  <div className="pt-2 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-bold font-mono text-slate-900">{item.achievement}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">tercapai</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Target: {item.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quarterly Progression */}
        <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <TrendingUp className="size-4 text-[#7C3AED]" /> Tren Penyerapan Alumni per Kuartal (2024)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-4">
              {QUARTERLY_DATA.map((d) => (
                <div key={d.q} className="rounded-xl border border-border/70 p-4 bg-card">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{d.q}</p>
                  <div className="mt-3 space-y-2.5">
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted-foreground">Terdata</span>
                        <span className="font-mono font-semibold text-foreground">{d.registered}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-slate-800"
                          style={{ width: `${(d.registered / maxRegistered) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted-foreground">Verified</span>
                        <span className="font-mono font-semibold text-purple-600">{d.verified}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-[#7C3AED]"
                          style={{ width: `${(d.verified / maxRegistered) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Placement</span>
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono">
                        {d.rate}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Program + Placement Geographic Distribution */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Program Breakdown */}
          <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <Briefcase className="size-4 text-emerald-600" /> Penyerapan per Program Studi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {PLACEMENT_BY_PROGRAM.map((p) => (
                <div key={p.program} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{p.program}</span>
                    <span className="font-mono text-muted-foreground">
                      {p.placed}/{p.total} ({p.rate}%)
                    </span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-[#7C3AED]"
                      style={{ width: `${p.rate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Masa tunggu: <strong className="text-foreground">{p.avgWait}</strong></span>
                    <span>Rata-rata gaji: <strong className="text-emerald-600">{p.avgSalary}</strong></span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Geographic Distribution */}
          <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <MapPin className="size-4 text-sky-600" /> Sebaran Wilayah Penempatan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="space-y-3">
                {PLACEMENT_DISTRIBUTION.map((dist) => (
                  <div key={dist.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-foreground">{dist.label}</span>
                      <span className="font-mono font-semibold text-foreground">
                        {dist.count} alumni ({dist.pct}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className={`h-2 rounded-full ${dist.color}`} style={{ width: `${dist.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4 mt-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="size-4 text-sky-600" />
                  <p className="text-xs font-bold text-sky-900">Mobilitas Karir Global &amp; Fleksibel</p>
                </div>
                <p className="text-xs text-sky-800 leading-relaxed">
                  Sebanyak 16% lulusan {partnerInstitution} bekerja secara remote penuh untuk perusahaan multinasional dan startup teknologi di Singapura, Jakarta, dan Australia.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accreditation Report Export Card */}
        <Card className="rounded-2xl border border-border/80 bg-card shadow-xs p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <FileSpreadsheet className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  Format Laporan Standar LAM-INFOKOM &amp; BAN-PT
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tabel data kuesioner tracer study siap digunakan sebagai lampiran LED (Laporan Evaluasi Diri) akreditasi program studi.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleDownloadReport}
              disabled={downloading}
              className="text-xs font-semibold shrink-0 gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
            >
              <Download className="size-3.5" />
              Ekspor Dokumen Excel (.xlsx)
            </Button>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
