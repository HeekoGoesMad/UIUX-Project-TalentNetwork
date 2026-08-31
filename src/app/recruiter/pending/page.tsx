"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Loader2,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/providers/app-provider";

export default function RecruiterPendingPage() {
  const { user } = useApp();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [localStatus, setLocalStatus] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const session = localStorage.getItem("proofylink_session");
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.provisioningStatus) return parsed.provisioningStatus;
        }
      } catch {}
    }
    return user?.provisioningStatus || "pending";
  });

  const status = localStatus || user?.provisioningStatus || "pending";
  const isApproved = status === "active";
  const isRevisionRequired = status === "revision_required";
  const isRejected = status === "rejected";

  const checkStatus = async () => {
    setChecking(true);
    try {
      // 1. Check API first
      let serverStatus: string | null = null;
      try {
        const res = await fetch("/api/app/bootstrap", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { identity?: { provisioningStatus?: string; provisioningReason?: string } };
          if (data.identity?.provisioningStatus) {
            serverStatus = data.identity.provisioningStatus;
          }
        }
      } catch {}

      // 2. Check localStorage session
      let localSessionStatus: string | null = null;
      try {
        const session = localStorage.getItem("proofylink_session");
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.provisioningStatus) localSessionStatus = parsed.provisioningStatus;
        }
      } catch {}

      const effectiveStatus = serverStatus || localSessionStatus || status;

      if (effectiveStatus === "active") {
        setLocalStatus("active");
        toast.success("Akun Anda telah disetujui! Anda sekarang dapat masuk ke Dashboard.");
        setTimeout(() => {
          window.location.reload();
        }, 800);
        return;
      } else if (effectiveStatus === "revision_required") {
        setLocalStatus("revision_required");
        toast.warning("Terdapat instruksi revisi dokumen dari tim compliance.");
        return;
      } else if (effectiveStatus === "rejected") {
        setLocalStatus("rejected");
        toast.error("Permohonan akun Anda ditolak oleh compliance.");
        return;
      }
      toast.info("Status akun Anda masih dalam antrean peninjauan compliance.");
    } catch {
      toast.error("Gagal memeriksa status ke server.");
    } finally {
      setChecking(false);
    }
  };

  // Live polling every 3 seconds and on storage change to sync in real-time when Admin clicks Approve or Request Revision
  useEffect(() => {
    const handleStorage = () => {
      try {
        const session = localStorage.getItem("proofylink_session");
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.provisioningStatus && parsed.provisioningStatus !== status) {
            setLocalStatus(parsed.provisioningStatus);
            if (parsed.provisioningStatus === "active") {
              toast.success("🎉 Akun Anda telah disetujui oleh tim compliance!");
            }
          }
        }
      } catch {}
    };

    window.addEventListener("storage", handleStorage);

    if (isApproved) return () => window.removeEventListener("storage", handleStorage);

    const interval = setInterval(() => {
      handleStorage();
      void fetch("/api/app/bootstrap", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { identity?: { provisioningStatus?: string } } | null) => {
          if (data?.identity?.provisioningStatus && data.identity.provisioningStatus !== status) {
            setLocalStatus(data.identity.provisioningStatus);
            if (data.identity.provisioningStatus === "active") {
              toast.success("🎉 Akun Anda telah disetujui oleh tim compliance!");
            } else if (data.identity.provisioningStatus === "revision_required") {
              toast.warning("⚠️ Dokumen Anda memerlukan revisi. Silakan periksa instruksi.");
            }
          }
        })
        .catch(() => null);
    }, 3000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [isApproved, status]);

  const documents = [
    {
      name: "Nomor Induk Berusaha (NIB)",
      status: isApproved ? "Terverifikasi" : isRevisionRequired ? "Perlu Diperiksa" : isRejected ? "Ditolak" : "Dalam Antrean Peninjauan",
      file: "NIB_Perusahaan.pdf",
    },
    {
      name: "NPWP Badan Usaha",
      status: isApproved ? "Terverifikasi" : isRevisionRequired ? "Perlu Diperiksa" : isRejected ? "Ditolak" : "Dalam Antrean Peninjauan",
      file: "NPWP_Badan.pdf",
    },
    {
      name: "Akta Pendirian / SK Kemenkumham",
      status: isApproved ? "Terverifikasi" : isRevisionRequired ? "Perlu Diperiksa" : isRejected ? "Ditolak" : "Dalam Antrean Peninjauan",
      file: "Akta_SK_Kemenkumham.pdf",
    },
    {
      name: "Foto KTP PIC Rekruter",
      status: isApproved ? "Terverifikasi" : isRevisionRequired ? "Perlu Diperiksa" : isRejected ? "Ditolak" : "Dalam Antrean Peninjauan",
      file: "KTP_PIC.jpg",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50/60 py-10 px-4">
      <div className="container mx-auto max-w-3xl space-y-6">
        {/* Status Banners for 4 Lifecycle States */}
        {isApproved ? (
          <Card className="border-emerald-300 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                  <CheckCircle2 className="size-6" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold text-emerald-950">Akun &amp; Dokumen Legalitas Disetujui!</h1>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-semibold">
                      Verified Recruiter
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Selamat, <strong>{user?.name || "Recruiter"}</strong>! Seluruh berkas pendaftaran dan legalitas perusahaan Anda telah diverifikasi oleh tim compliance. Silakan masuk ke workspace untuk mulai mencari talent.
                  </p>
                  <div className="pt-2">
                    <Button
                      onClick={() => router.replace("/dashboard")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 shadow-xs"
                    >
                      Masuk ke Dashboard Sekarang <ArrowRight className="size-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isRevisionRequired ? (
          <Card className="border-orange-300 bg-gradient-to-r from-orange-50/90 via-white to-orange-50/40 shadow-sm">
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
                      className="h-8 px-2.5 text-xs rounded-lg border-orange-300 hover:bg-orange-100/60 text-orange-950 font-medium"
                    >
                      {checking ? <Loader2 className="size-3.5 animate-spin mr-1.5 text-orange-700" /> : <RefreshCw className="size-3.5 mr-1.5 text-orange-700" />}
                      Cek Status
                    </Button>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    Halo <strong>{user?.name || "Recruiter"}</strong>, tim compliance telah meninjau pengajuan pendaftaran Anda. Terdapat berkas yang belum sesuai dan perlu diperbaiki.
                  </p>

                  {/* Revision Notes Box */}
                  <div className="rounded-xl border border-orange-200 bg-orange-50/80 p-4 text-xs text-orange-950 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <span>📝 Catatan &amp; Instruksi dari Tim Compliance:</span>
                    </p>
                    <p className="text-slate-800 leading-relaxed pl-5 font-medium">
                      {user?.provisioningReason || "Mohon periksa kembali kelengkapan dan kejelasan foto KTP PIC atau berkas NIB yang diunggah."}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Button
                      onClick={() => router.push("/recruiter/onboarding")}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs h-9 shadow-xs"
                    >
                      Perbaiki &amp; Unggah Ulang Dokumen <ArrowRight className="size-3.5 ml-1.5" />
                    </Button>
                    <span className="text-[11px] text-muted-foreground">
                      Setelah diunggah ulang, berkas otomatis masuk antrean prioritas review.
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isRejected ? (
          <Card className="border-rose-300 bg-gradient-to-r from-rose-50/90 via-white to-rose-50/40 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-xs">
                  <ShieldCheck className="size-6 text-white" />
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold text-rose-950">Permohonan Akun Rekruter Ditolak</h1>
                    <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-xs font-semibold">
                      Rejected by Compliance
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Mohon maaf, pendaftaran perusahaan Anda saat ini belum dapat disetujui untuk mengakses ProofyLink Talent Network berdasarkan standar kepatuhan dan verifikasi entitas legal.
                  </p>

                  {/* Rejection Reason Box */}
                  <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-950 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <span>⚠️ Alasan Penolakan:</span>
                    </p>
                    <p className="text-slate-800 leading-relaxed pl-5 font-medium">
                      {user?.provisioningReason || "Entitas tidak memenuhi kualifikasi standar verifikasi kepatuhan ProofyLink."}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <Button
                      variant="outline"
                      asChild
                      className="border-rose-300 text-rose-900 hover:bg-rose-100/60 font-semibold rounded-xl text-xs h-9"
                    >
                      <a href="mailto:support@proofylink.com?subject=Bantuan Verifikasi Akun Rekruter">
                        <MessageCircle className="size-3.5 mr-1.5" /> Hubungi Tim Bantuan / Support
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-amber-200/80 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/30 shadow-xs">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs">
                  <Clock className="size-6 animate-pulse" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-[#0b2342]">Akun &amp; Legalitas Sedang Ditinjau</h1>
                      <Badge variant="outline" className="border-amber-300 bg-amber-100/70 text-amber-800 text-xs font-semibold">
                        Compliance Review Queue
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void checkStatus()}
                      disabled={checking}
                      className="h-8 px-2.5 text-xs rounded-lg border-amber-300 hover:bg-amber-100/60 text-amber-950 font-medium"
                    >
                      {checking ? <Loader2 className="size-3.5 animate-spin mr-1.5 text-amber-700" /> : <RefreshCw className="size-3.5 mr-1.5 text-amber-700" />}
                      Cek Status Terbaru
                    </Button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Terima kasih, <strong>{user?.name || "Budi Santoso"}</strong>. Berkas pendaftaran dan dokumen legalitas perusahaan Anda telah berhasil dikirim dan saat ini masuk ke antrean verifikasi tim compliance ProofyLink.
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-xs font-semibold text-amber-900">
                    <span>⏱️ Estimasi Waktu Verifikasi:</span>
                    <span className="bg-white border border-amber-300 px-2 py-0.5 rounded-md">Maksimal 1 x 24 Jam Kerja</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Progress Timeline */}
        <Card className="border-slate-200/90 shadow-xs">
          <CardHeader className="bg-slate-50/70 border-b pb-4">
            <CardTitle className="text-base text-[#0b2342] flex items-center gap-2">
              <ShieldCheck className="size-5 text-[#0b2342]" /> Status Pemeriksaan Berkas Legalitas
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Setiap berkas diverifikasi secara teliti oleh tim kepatuhan untuk menjamin keamanan talent dan perusahaan.
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              {documents.map((doc, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border bg-white shadow-2xs gap-2">
                  <div className="flex items-start gap-3">
                    <FileText className="size-4 text-[#0b2342] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-bold text-foreground block">{doc.name}</strong>
                      <span className="text-[11px] text-muted-foreground font-mono">{doc.file}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[11px] self-start sm:self-center font-medium ${
                      isApproved
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : isRevisionRequired
                        ? "border-orange-300 bg-orange-50 text-orange-800"
                        : isRejected
                        ? "border-rose-300 bg-rose-50 text-rose-800"
                        : "border-amber-300 bg-amber-50 text-amber-800"
                    }`}
                  >
                    {isApproved ? "🟢 " : isRevisionRequired ? "🟠 " : isRejected ? "🔴 " : "🟡 "}
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>

            {/* How verification works callout */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs space-y-2 text-slate-700">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <HelpCircle className="size-4 text-blue-600" /> Bagaimana Alur Verifikasi Bekerja?
              </span>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed">
                <li>Tim compliance memvalidasi kesesuaian nomor NIB &amp; NPWP dengan data Kemenkumham/OSS.</li>
                <li>Setelah disetujui, akun Anda akan otomatis beralih ke status <strong>Aktif</strong> dan notifikasi konfirmasi akan dikirimkan ke email resmi Anda.</li>
                <li>Jika terdapat dokumen yang kurang jelas, tim compliance akan mengirimkan catatan revisi ke email Anda.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
              <Button variant="outline" asChild className="w-full sm:w-auto rounded-xl">
                <Link href="/recruiter/onboarding">
                  Perbarui / Lengkapi Berkas Kembali
                </Link>
              </Button>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" asChild className="flex-1 sm:flex-none gap-1.5 rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs">
                  <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer">
                    <MessageCircle className="size-3.5 text-emerald-600" /> Bantuan WhatsApp
                  </a>
                </Button>
                <Button asChild className="flex-1 sm:flex-none bg-[#0b2342] hover:bg-[#1a3460] text-white rounded-xl text-xs">
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
