"use client";

import { useState } from "react";
import {
  Award,
  BadgeCheck,
  GraduationCap,
  Plus,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";

export default function CandidateVerificationsPage() {
  const { cvProfile, user } = useApp();
  const [uploadOpen, setUploadOpen] = useState(false);

  const educationList = cvProfile?.education || [];
  const primarySchool = educationList[0]?.school || "Institut Teknologi Bandung";
  const primaryProgram = educationList[0]?.program || "Desain Komunikasi Visual";
  const primaryDegree = educationList[0]?.level || "S1";

  const handleRequestVerification = () => {
    toast.success("Permintaan verifikasi sertifikat berhasil dikirim ke antrean kurasi ProofyLink!", {
      description: "Tim verifikator akan memvalidasi dokumen dalam 1-2 hari kerja.",
    });
    setUploadOpen(false);
  };

  return (
    <ProtectedRoute role="candidate">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Pusat Verifikasi Kredensial
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">
              Tingkatkan kredibilitas profilmu di hadapan rekruter top dengan lencana verifikasi akademik dan riwayat profesional teruji.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setUploadOpen(!uploadOpen)}
            className="shrink-0 gap-1.5 text-xs font-semibold"
          >
            <Plus className="size-4" /> Ajukan Verifikasi Tambahan
          </Button>
        </div>

        {/* Verification Status Banner */}
        <Card className="border-emerald-200/80 bg-emerald-50/30 shadow-2xs">
          <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 p-6">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                <ShieldCheck className="size-7" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">Status: Talenta Terverifikasi (Verified Talent)</h2>
                  <Badge className="bg-emerald-600 text-white text-xs">Aktif</Badge>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-emerald-950 max-w-xl leading-relaxed">
                  Profilmu telah diverifikasi melalui kemitraan institusi pendidikan dan lolos uji data dasar. Rekruter memprioritaskan kandidat terverifikasi dengan tingkat respons 3x lebih cepat.
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-white p-3.5 text-center shrink-0 min-w-36">
              <p className="font-mono text-xl font-bold text-emerald-700">Tingkat 1</p>
              <p className="text-[11px] text-muted-foreground">Kredensial Emas</p>
            </div>
          </CardContent>
        </Card>

        {/* Upload Modal Drawer / Box */}
        {uploadOpen && (
          <Card className="border-primary/40 bg-card shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <UploadCloud className="size-4.5 text-primary" /> Ajukan Verifikasi Kredensial Baru
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Unggah salinan PDF ijazah, transkrip, atau sertifikasi profesional untuk ditelaah oleh tim kurasi.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="rounded-xl border-2 border-dashed border-border p-8 text-center bg-muted/20">
                <UploadCloud className="size-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-semibold text-foreground">Klik untuk pilih file atau seret PDF ke sini</p>
                <p className="text-xs text-muted-foreground mt-1">Format dokumen PDF resmi (maks. 5MB)</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setUploadOpen(false)} className="text-xs">
                  Batal
                </Button>
                <Button size="sm" onClick={handleRequestVerification} className="text-xs font-semibold">
                  Kirim Pengajuan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Items Breakdown */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Academic Verification */}
          <Card className="border-border bg-card shadow-2xs">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="size-4.5 text-primary" /> Verifikasi Institusi Akademik
                </CardTitle>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold">
                  Tervalidasi ✓
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div>
                <p className="text-base font-bold text-foreground">{primarySchool}</p>
                <p className="text-xs text-muted-foreground">
                  Jenjang {primaryDegree} • {primaryProgram}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Metode Validasi:</span>
                  <span className="font-semibold text-foreground">API Data Kemdikbud / Mitra Kampus</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Status Kemitraan:</span>
                  <span className="font-semibold text-emerald-600">Jalur Resmi ProofyLink</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Identity & Basic Checks */}
          <Card className="border-border bg-card shadow-2xs">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <BadgeCheck className="size-4.5 text-emerald-600" /> Verifikasi Identitas &amp; Kontak
                </CardTitle>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold">
                  Tervalidasi ✓
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div>
                <p className="text-base font-bold text-foreground">{cvProfile?.fullName || user?.name || "Kandidat"}</p>
                <p className="text-xs text-muted-foreground">{cvProfile?.email || user?.email || "Email terdaftar"}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Verifikasi Email:</span>
                  <span className="font-semibold text-emerald-600">Terverifikasi (OTP)</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Nomor Telepon:</span>
                  <span className="font-semibold text-emerald-600">Terhubung (+62)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits of Verified Talent */}
        <Card className="border-border bg-card shadow-2xs">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Award className="size-4.5 text-amber-600" /> Manfaat Menjadi Verified Talent ProofyLink
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid gap-4 sm:grid-cols-3 text-xs">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">1. Prioritas di Hasil Pencarian</p>
                <p className="text-muted-foreground leading-relaxed">
                  Profil terverifikasi ditempatkan di jajaran teratas fitur pencarian talenta rekruter.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">2. Lencana Tepercaya (Trust Badge)</p>
                <p className="text-muted-foreground leading-relaxed">
                  Tanda centang hijau eksklusif membuktikan bahwa riwayat pendidikan dan skillmu bukan klaim sepihak.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">3. Akses Peluang Tertutup</p>
                <p className="text-muted-foreground leading-relaxed">
                  Banyak perusahaan enterprise hanya membuka lowongan khusus untuk talenta yang telah terverifikasi.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
