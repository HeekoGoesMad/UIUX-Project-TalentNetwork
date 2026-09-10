"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  GraduationCap,
  Loader2,
  LogOut,
  MapPin,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/providers/app-provider";
import { ProvisioningStatus } from "@/types";

interface PartnershipDetail {
  id: string;
  name: string;
  skNumber?: string | null;
  skDocumentUrl?: string | null;
  location?: string | null;
  verificationStatus: string;
  verificationNotes?: string | null;
}

export default function PartnerPendingPage() {
  const { user, logout, setProvisioningStatus, reloadBootstrap, activePartnerInstitution, hydrated } = useApp();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [localStatus, setLocalStatus] = useState<ProvisioningStatus>(() => user?.provisioningStatus || "pending");
  const [partnershipData, setPartnershipData] = useState<PartnershipDetail | null>(null);

  const status = localStatus || user?.provisioningStatus || "pending";
  const isApproved = status === "active";
  const isRevisionRequired = status === "revision_required";
  const isRejected = status === "rejected";

  const institutionName =
    partnershipData?.name || activePartnerInstitution || user?.companyName || user?.name || "Universitas Indonesia";
  const picName = user?.name || "Perwakilan Mitra";

  const checkStatus = async (showToasts = true) => {
    setChecking(true);
    try {
      const res = await fetch("/api/app/bootstrap", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.partnership) {
          setPartnershipData(data.partnership);
        }
        if (data.identity?.provisioningStatus) {
          const next = data.identity.provisioningStatus as ProvisioningStatus;
          setLocalStatus(next);
          setProvisioningStatus(next, data.identity.provisioningReason ?? null);

          if (next === "active") {
            toast.success("Kemitraan Anda telah disetujui! Membuka Dashboard...");
            router.push("/partner");
            return;
          }
          if (showToasts) {
            if (next === "revision_required") {
              toast.warning("Terdapat instruksi revisi dokumen dari tim compliance.");
            } else if (next === "rejected") {
              toast.error("Pengajuan kemitraan ditolak oleh admin.");
            } else {
              toast.info("Status pengajuan kemitraan masih dalam antrean peninjauan admin.");
            }
          }
          return;
        }
      }
      if (showToasts) {
        toast.info("Status kemitraan masih dalam antrean peninjauan admin.");
      }
    } catch {
      if (showToasts) {
        toast.info("Sedang menyinkronkan status dengan server...");
      }
    } finally {
      setChecking(false);
    }
  };

  // Immediate check on mount & live polling
  useEffect(() => {
    let active = true;

    const poll = () => {
      if (typeof document !== "undefined" && document.hidden) return;

      fetch("/api/app/bootstrap", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!active || !data) return;
          if (data.partnership) {
            setPartnershipData(data.partnership);
          }
          if (data.identity?.provisioningStatus) {
            const next = data.identity.provisioningStatus as ProvisioningStatus;
            if (next === "active") {
              active = false;
              setLocalStatus("active");
              setProvisioningStatus("active", null);
              toast.success("Kemitraan Anda telah disetujui oleh tim compliance!");
              router.push("/partner");
              return;
            }
            if (next !== localStatus) {
              setLocalStatus(next);
              setProvisioningStatus(next, data.identity.provisioningReason ?? null);
              if (next === "revision_required") {
                toast.warning("Pengajuan kemitraan memerlukan perbaikan berkas.");
              }
            }
          }
        })
        .catch(() => null);
    };

    poll();

    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && !document.hidden && active) {
        poll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    const interval = setInterval(poll, 7000);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [localStatus, setProvisioningStatus, router]);

  const handleGoToDashboard = async () => {
    setRedirecting(true);
    setProvisioningStatus("active");
    await reloadBootstrap();
    router.replace("/partner");
  };

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-slate-50/60 py-8 px-4 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="size-8 animate-spin text-[#7C3AED] mx-auto" />
          <p className="text-sm text-muted-foreground">Menyiapkan status kemitraan...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/60 py-8 px-4">
      <div className="container mx-auto max-w-3xl space-y-6">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-purple-800 text-white shadow-xs">
              <GraduationCap className="size-5" />
            </span>
            <div className="flex flex-col">
              <span className="text-base font-bold text-foreground leading-tight">
                Proofy<span className="text-[#7C3AED]">Link</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-purple-700">
                Kemitraan Career Center
              </span>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className="text-xs text-muted-foreground hover:text-destructive gap-1.5 h-8 px-3 rounded-xl cursor-pointer"
          >
            <LogOut className="size-3.5" /> Keluar Akun
          </Button>
        </div>

        {/* ── STATUS CARD ── */}
        {isApproved ? (
          <Card className="border-emerald-300 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                  <CheckCircle2 className="size-6" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold text-emerald-950">Kemitraan Kampus Resmi Disetujui!</h1>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-semibold">
                      Verified Partner Campus
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Selamat, <strong>{institutionName}</strong>! Pengajuan kemitraan career center Anda telah disetujui
                    oleh tim compliance. Anda sekarang dapat mengakses dashboard kemitraan untuk memverifikasi mahasiswa
                    dan memantau penempatan kerja.
                  </p>
                  <div className="pt-2">
                    <Button
                      onClick={handleGoToDashboard}
                      disabled={redirecting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 shadow-xs gap-1.5 cursor-pointer"
                    >
                      {redirecting ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" /> Membuka Dashboard...
                        </>
                      ) : (
                        <>
                          Buka Dashboard Kemitraan <ArrowRight className="size-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isRevisionRequired ? (
          <Card className="border-orange-300 bg-gradient-to-r from-orange-50/90 via-white to-orange-50/40 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-xs">
                  <FileText className="size-6" />
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-orange-950">Dokumen Memerlukan Perbaikan / Revisi</h1>
                      <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-xs font-semibold">
                        Revision Required
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void checkStatus()}
                      disabled={checking}
                      className="h-8 px-2.5 text-xs rounded-lg border-orange-300 hover:bg-orange-100/60 text-orange-950 font-medium cursor-pointer"
                    >
                      {checking ? <Loader2 className="size-3.5 animate-spin mr-1.5 text-orange-700" /> : <RefreshCw className="size-3.5 mr-1.5 text-orange-700" />}
                      Cek Status
                    </Button>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    Halo <strong>{picName}</strong>, tim compliance telah memeriksa pengajuan kemitraan untuk{" "}
                    <strong>{institutionName}</strong>. Terdapat berkas yang perlu diperbaiki.
                  </p>

                  <div className="rounded-xl border border-orange-200 bg-orange-50/80 p-4 text-xs text-orange-950 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">Catatan Tim Compliance:</p>
                    <p className="text-slate-800 leading-relaxed pl-2 font-medium">
                      {partnershipData?.verificationNotes ||
                        user?.provisioningReason ||
                        "Mohon periksa kembali kelengkapan nomor SK dan salinan dokumen SK yang dilampirkan."}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Button
                      onClick={() => router.push("/partner/onboarding")}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs h-9 shadow-xs cursor-pointer"
                    >
                      Perbaiki &amp; Unggah Ulang Dokumen <ArrowRight className="size-3.5 ml-1.5" />
                    </Button>
                    <span className="text-[11px] text-muted-foreground">
                      Setelah diunggah ulang, pengajuan otomatis masuk antrean prioritas review.
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isRejected ? (
          <Card className="border-rose-300 bg-gradient-to-r from-rose-50 via-white to-rose-50/40 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-xs">
                  <ShieldAlert className="size-6 text-white" />
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold text-rose-950">Permohonan Kemitraan Belum Disetujui</h1>
                    <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-xs font-semibold">
                      Rejected by Compliance
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Mohon maaf, pendaftaran kemitraan untuk <strong>{institutionName}</strong> saat ini belum memenuhi
                    standar verifikasi kepatuhan ProofyLink Talent Network.
                  </p>

                  <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-950 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">Alasan Penolakan:</p>
                    <p className="text-slate-800 leading-relaxed pl-2 font-medium">
                      {partnershipData?.verificationNotes ||
                        user?.provisioningReason ||
                        "Lembaga belum memenuhi kualifikasi standar verifikasi kepatuhan kemitraan kampus."}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <Button
                      variant="outline"
                      asChild
                      className="border-rose-300 text-rose-900 hover:bg-rose-100/60 font-semibold rounded-xl text-xs h-9 cursor-pointer"
                    >
                      <a href="mailto:support@proofylink.com?subject=Bantuan Verifikasi Akun Kemitraan">
                        <MessageCircle className="size-3.5 mr-1.5" /> Hubungi Tim Bantuan
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => router.push("/partner/onboarding")}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Ubah Data Pengajuan
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* PENDING REVIEW CARD (EXCLUSIVE PARTNERSHIP THEME) */
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50/70 via-white to-indigo-50/30 shadow-xs rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#7C3AED] text-white shadow-xs">
                  <GraduationCap className="size-6 animate-pulse" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-slate-900">Pengajuan Kemitraan Sedang Ditinjau</h1>
                      <Badge className="border-purple-300 bg-purple-100 text-[#7C3AED] text-xs font-semibold">
                        Menunggu Verifikasi Admin
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void checkStatus()}
                      disabled={checking}
                      className="h-8 px-2.5 text-xs rounded-xl border-purple-200 hover:bg-purple-100/60 text-purple-950 font-medium cursor-pointer"
                    >
                      {checking ? (
                        <Loader2 className="size-3.5 animate-spin mr-1.5 text-[#7C3AED]" />
                      ) : (
                        <RefreshCw className="size-3.5 mr-1.5 text-[#7C3AED]" />
                      )}
                      Cek Status Terbaru
                    </Button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Terima kasih, <strong>{picName}</strong>. Pengajuan kemitraan career center untuk{" "}
                    <strong>{institutionName}</strong> telah berhasil dikirim dan saat ini masuk antrean verifikasi tim
                    admin compliance ProofyLink.
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-xs font-semibold text-purple-900">
                    <span className="flex items-center gap-1">⏰ Estimasi Waktu Verifikasi:</span>
                    <span className="bg-white border border-purple-200 px-2.5 py-0.5 rounded-md text-purple-800 font-semibold shadow-2xs">
                      Maksimal 1 x 24 Jam Kerja
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── RINGKASAN DATA KEMITRAAN KAMPUS (PARTNERSHIP SPECIFIC) ── */}
        <Card className="border-slate-200 shadow-xs overflow-hidden rounded-2xl bg-white">
          <CardHeader className="bg-slate-50/80 border-b pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-slate-900 flex items-center gap-2 font-bold">
                <Building2 className="size-4.5 text-[#7C3AED]" /> Ringkasan Legalitas &amp; Entitas Kampus
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/partner/onboarding")}
                className="text-xs text-[#7C3AED] hover:text-[#6D28D9] h-8 px-2.5 font-semibold cursor-pointer"
              >
                Ubah Formulir Pendaftaran
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Informasi identitas lembaga dan dokumen legalitas resmi yang didaftarkan.
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl border bg-slate-50/50">
                <span className="text-[11px] text-muted-foreground block font-medium">Nama Institusi / Kampus</span>
                <strong className="text-foreground text-sm font-semibold mt-0.5 block">{institutionName}</strong>
              </div>

              <div className="p-3 rounded-xl border bg-slate-50/50">
                <span className="text-[11px] text-muted-foreground block font-medium">Wilayah / Domisili Kampus</span>
                <strong className="text-foreground text-sm font-semibold mt-0.5 block flex items-center gap-1">
                  <MapPin className="size-3.5 text-slate-400" />
                  {partnershipData?.location || "Jakarta Pusat, DKI Jakarta"}
                </strong>
              </div>

              <div className="p-3 rounded-xl border bg-slate-50/50">
                <span className="text-[11px] text-muted-foreground block font-medium">Nomor SK / Izin Kemitraan</span>
                <strong className="text-foreground font-mono text-sm font-semibold mt-0.5 block">
                  {partnershipData?.skNumber || "SK-DIKTI-2024/001"}
                </strong>
              </div>

              <div className="p-3 rounded-xl border bg-slate-50/50">
                <span className="text-[11px] text-muted-foreground block font-medium">PIC Penanggung Jawab</span>
                <strong className="text-foreground text-sm font-semibold mt-0.5 block flex items-center gap-1">
                  <UserCheck className="size-3.5 text-[#7C3AED]" /> {picName}
                </strong>
              </div>
            </div>

            {/* Dokumen SK */}
            <div className="p-3.5 rounded-xl border bg-purple-50/40 border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCheck className="size-5 text-[#7C3AED]" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Dokumen Surat Keputusan (SK)</span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {partnershipData?.skDocumentUrl ? partnershipData.skDocumentUrl.split("/").pop() : "SK_Kemitraan_Kampus.pdf"}
                  </span>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[11px] font-medium">
                <Clock className="size-3 mr-1" /> Dalam Antrean Review
              </Badge>
            </div>

            {/* Manfaat kemitraan callout */}
            <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4 text-xs space-y-2 text-slate-700">
              <span className="font-bold text-purple-950 flex items-center gap-1.5">
                <BadgeCheck className="size-4 text-[#7C3AED]" /> Fasilitas Kemitraan Career Center yang Akan Aktif:
              </span>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed">
                <li>
                  Hak penerbitan lencana resmi <strong>Campus Verified</strong> untuk seluruh profil mahasiswa &amp; alumni.
                </li>
                <li>
                  Akses monitoring employer insight untuk mengetahui perusahaan yang aktif merekrut lulusan kampus Anda.
                </li>
                <li>
                  Dashboard analitik penyerapan kerja dan integrasi data tracer study secara otomatis.
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <p className="text-xs text-muted-foreground text-center sm:text-left">
                Butuh bantuan terkait verifikasi kemitraan? Hubungi tim pendamping kampus kami.
              </p>
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2 w-full sm:w-auto shrink-0">
                <Button
                  variant="outline"
                  asChild
                  className="w-full sm:w-auto gap-1.5 rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs h-9 px-3 font-semibold cursor-pointer"
                >
                  <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer">
                    <MessageCircle className="size-3.5 text-emerald-600" /> Bantuan WhatsApp
                  </a>
                </Button>
                <Button
                  asChild
                  className="w-full sm:w-auto bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs h-9 px-4 font-semibold cursor-pointer"
                >
                  <Link href="/">Kembali ke Beranda</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
