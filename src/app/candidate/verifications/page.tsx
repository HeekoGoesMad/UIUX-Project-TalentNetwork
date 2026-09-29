"use client";

import { useState } from "react";
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  LockKeyholeOpen,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestVerificationDialog } from "@/components/candidate/request-verification-dialog";
import { useApp } from "@/providers/app-provider";

export default function CandidateVerificationsPage() {
  const { cvProfile, user, isPartnerCampus } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);

  const educationList = cvProfile?.education || [];
  const primarySchool = educationList[0]?.school || "";
  const primaryProgram = educationList[0]?.program || "";
  const primaryDegree = educationList[0]?.level || "";

  const verif = cvProfile?.campusVerification;
  const isVerified = verif?.status === "verified";
  const isPending = verif?.status === "pending";
  const isPartner = isPartnerCampus ? isPartnerCampus(verif?.institution || primarySchool) : false;

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
            onClick={() => setDialogOpen(true)}
            className="h-9 shrink-0 px-4 text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer bg-[#7C3AED] hover:bg-[#6D28D9]"
          >
            <Plus className="size-4 mr-1.5" />
            <span>Ajukan Verifikasi</span>
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
                  Verifikasi Akademik / Mitra
                </CardTitle>
                {isVerified ? (
                  <Badge className="border-purple-200 bg-purple-50 text-[11px] font-semibold text-[#7C3AED] gap-1 shadow-none">
                    <CheckCircle2 className="size-3" />
                    Terverifikasi
                  </Badge>
                ) : isPending ? (
                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-600 gap-1">
                    <Clock className="size-3" />
                    Permintaan Terkirim
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-border text-[11px] font-normal text-muted-foreground">
                    Belum Diajukan
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3.5 p-5">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {verif?.institution || primarySchool || "Belum ada institusi"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {primaryDegree || primaryProgram
                    ? `Jenjang ${primaryDegree || "S1"} • ${primaryProgram || "Program Studi"}`
                    : "Lengkapi riwayat pendidikan di CV/Profil Anda"}
                </p>
              </div>
              <div className="rounded-lg border border-border/80 bg-muted/20 p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Metode Validasi:</span>
                  <span className="font-medium text-foreground">
                    {isVerified ? (verif?.verifiedBy || "Mitra Resmi") : isPartner ? "Career Center Mitra Resmi" : "Kemitraan Belum Tersedia"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Status Verifikasi:</span>
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <CheckCircle2 className="size-3" /> Aktif di Profil &amp; Pencarian
                    </span>
                  ) : isPending ? (
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                      <Clock className="size-3" /> Menunggu Review Partner
                    </span>
                  ) : isPartner ? (
                    <span className="text-emerald-700 font-medium">Siap Diajukan ke Mitra</span>
                  ) : (
                    <span className="text-amber-700 font-medium">Belum Bermitra Resmi</span>
                  )}
                </div>
                {!isVerified && !isPending && (
                  <div className="pt-2 border-t border-border/60">
                    {isPartner ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDialogOpen(true)}
                        className="w-full h-8 text-xs font-semibold gap-1 text-primary hover:bg-primary/5 cursor-pointer"
                      >
                        <ShieldCheck className="size-3.5" />
                        Minta Verifikasi Sekarang
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDialogOpen(true)}
                        className="w-full h-8 text-xs font-semibold gap-1.5 text-foreground hover:bg-muted cursor-pointer"
                      >
                        <Sparkles className="size-3.5 text-amber-500" />
                        Rekomendasikan Kampus Anda
                      </Button>
                    )}
                  </div>
                )}
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

      <RequestVerificationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialEducation={educationList[0] || null}
      />
    </ProtectedRoute>
  );
}
