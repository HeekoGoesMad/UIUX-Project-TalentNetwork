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
  const isApproved = user?.provisioningStatus === "active";

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/app/bootstrap", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { identity?: { provisioningStatus?: string } };
        if (data.identity?.provisioningStatus === "active") {
          toast.success("Akun Anda telah disetujui! Anda sekarang dapat masuk ke Dashboard.");
          window.location.reload();
          return;
        }
        toast.info("Status akun Anda masih dalam antrean peninjauan compliance.");
      }
    } catch {
      toast.error("Gagal memeriksa status ke server.");
    } finally {
      setChecking(false);
    }
  };

  // Live polling every 5 seconds to sync in real-time when Admin clicks Approve
  useEffect(() => {
    if (isApproved) return;
    const interval = setInterval(() => {
      void fetch("/api/app/bootstrap", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { identity?: { provisioningStatus?: string } } | null) => {
          if (data?.identity?.provisioningStatus === "active") {
            toast.success("🎉 Akun Anda telah disetujui oleh tim compliance!");
            window.location.reload();
          }
        })
        .catch(() => null);
    }, 4000);
    return () => clearInterval(interval);
  }, [isApproved]);

  const documents = [
    { name: "Nomor Induk Berusaha (NIB)", status: isApproved ? "Terverifikasi" : "Dalam Antrean Peninjauan", file: "NIB_Perusahaan.pdf" },
    { name: "NPWP Badan Usaha", status: isApproved ? "Terverifikasi" : "Dalam Antrean Peninjauan", file: "NPWP_Badan.pdf" },
    { name: "Akta Pendirian / SK Kemenkumham", status: isApproved ? "Terverifikasi" : "Dalam Antrean Peninjauan", file: "Akta_SK_Kemenkumham.pdf" },
    { name: "Foto KTP PIC Rekruter", status: isApproved ? "Terverifikasi" : "Dalam Antrean Peninjauan", file: "KTP_PIC.jpg" },
  ];

  return (
    <main className="min-h-screen bg-slate-50/60 py-10 px-4">
      <div className="container mx-auto max-w-3xl space-y-6">
        {/* Status Banner */}
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
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-[11px] self-start sm:self-center font-medium">
                    🟡 {doc.status}
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
