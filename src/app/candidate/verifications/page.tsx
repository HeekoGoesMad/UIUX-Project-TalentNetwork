"use client";

import {
  Award,
  BadgeCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  LockKeyholeOpen,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";

export default function CandidateVerificationsPage() {
  const { cvProfile, user } = useApp();

  const educationList = cvProfile?.education || [];
  const primarySchool = educationList[0]?.school || "";
  const primaryProgram = educationList[0]?.program || "";
  const primaryDegree = educationList[0]?.level || "";

  return (
    <ProtectedRoute role="candidate">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Verifikasi Kredensial
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Lencana verifikasi resmi membuktikan keaslian riwayat pendidikan, kontak, dan kredensial profesional kepada rekruter.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              toast.info("Fitur pengajuan verifikasi mandiri sedang disiapkan dan akan segera hadir!");
            }}
            className="group relative h-9 shrink-0 overflow-hidden px-4 text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5 transition-all duration-200 group-hover:-translate-y-7 group-hover:opacity-0">
              <Plus className="size-4" />
              <span>Ajukan Verifikasi</span>
            </span>
            <span className="absolute inset-0 inline-flex items-center justify-center gap-1.5 font-semibold text-amber-300 opacity-0 translate-y-7 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
              <Clock className="size-3.5" />
              <span>Coming Soon</span>
            </span>
          </Button>
        </div>

        {/* Verification Items Breakdown */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Academic Verification */}
          <Card className="border-border/80 bg-card shadow-xs">
            <CardHeader className="border-b pb-3.5">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <GraduationCap className="size-4 text-primary" />
                  Verifikasi Akademik
                </CardTitle>
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[11px] font-semibold text-amber-700 gap-1">
                  <Clock className="size-3" />
                  Coming Soon
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3.5 p-5">
              <div>
                <p className="text-sm font-semibold text-foreground">{primarySchool || "Institut Teknologi Bandung"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {primaryDegree || primaryProgram
                    ? `Jenjang ${primaryDegree} • ${primaryProgram}`
                    : "Jenjang S1 • Teknik Informatika & Desain"}
                </p>
              </div>
              <div className="rounded-lg border border-amber-200/80 bg-amber-50/40 p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Metode Validasi:</span>
                  <span className="font-medium text-foreground">PD-Dikti &amp; Mitra Kampus</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Status Fitur:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                    <Clock className="size-3" /> Segera Hadir (Coming Soon)
                  </span>
                </div>
                <p className="border-t border-amber-200/60 pt-2 text-[11px] leading-relaxed text-amber-800/90">
                  Verifikasi otomatis keabsahan ijazah dan riwayat pendidikan melalui integrasi kampus resmi sedang dalam tahap pengembangan.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Identity & Contact Checks */}
          <Card className="border-border/80 bg-card shadow-xs">
            <CardHeader className="border-b pb-3.5">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <BadgeCheck className="size-4 text-emerald-600" />
                  Verifikasi Identitas &amp; Kontak
                </CardTitle>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700">
                  Email Terverifikasi
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3.5 p-5">
              <div>
                <p className="text-sm font-semibold text-foreground">{cvProfile?.fullName || user?.name || "Kandidat Profesional"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {cvProfile?.email || user?.email || "Email terdaftar"}
                  {cvProfile?.phone ? ` • ${cvProfile.phone}` : ""}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Verifikasi Email:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                    <CheckCircle2 className="size-3" /> Tervalidasi (OTP)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Nomor Telepon:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                    <Clock className="size-3" /> Segera Hadir (Coming Soon)
                  </span>
                </div>
                <div className="rounded-md border border-amber-200/60 bg-amber-50/50 p-2 text-[11px] leading-relaxed text-amber-800">
                  Metode verifikasi nomor telepon (OTP via WhatsApp/SMS) belum tersedia saat ini dan sedang dikembangkan.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="border-b pb-3.5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Award className="size-4 text-primary" />
              Keuntungan Profil Terverifikasi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Search className="size-4" />
                </div>
                <h3 className="text-xs font-semibold text-foreground">Prioritas di Pencarian</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Profil terverifikasi selalu ditempatkan di halaman awal filter talent oleh rekruter mitra.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="size-4" />
                </div>
                <h3 className="text-xs font-semibold text-foreground">Lencana Tepercaya</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Badge Verified Talent memberikan reputasi instan tanpa perlu pemeriksaan latar belakang berulang.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                  <LockKeyholeOpen className="size-4" />
                </div>
                <h3 className="text-xs font-semibold text-foreground">Lowongan Eksklusif</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Akses langsung ke posisi kerja confidential dan penawaran rekruter korporasi terverifikasi.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
