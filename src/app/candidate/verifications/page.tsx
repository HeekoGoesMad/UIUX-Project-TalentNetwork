"use client";

import { useRef, useState } from "react";
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  LockKeyholeOpen,
  Plus,
  Search,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/providers/app-provider";

export default function CandidateVerificationsPage() {
  const { cvProfile, user } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<"academic" | "certificate" | "work">("academic");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const educationList = cvProfile?.education || [];
  const primarySchool = educationList[0]?.school || "";
  const primaryProgram = educationList[0]?.program || "";
  const primaryDegree = educationList[0]?.level || "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Format file harus berupa PDF resmi.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5 MB.");
      return;
    }
    setSelectedFile(file);
  };

  const handleRequestVerification = () => {
    if (!selectedFile) {
      toast.error("Silakan pilih dokumen PDF terlebih dahulu.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Permintaan verifikasi berhasil dikirim ke kurator!", {
        description: `Dokumen ${selectedFile.name} akan ditinjau dalam 1-2 hari kerja.`,
      });
      setSubmitting(false);
      setSelectedFile(null);
      setModalOpen(false);
    }, 700);
  };

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
            onClick={() => setModalOpen(true)}
            className="shrink-0 gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Plus className="size-4" /> Ajukan Verifikasi
          </Button>
        </div>

        {/* Status Hero Card */}
        <Card className="border-border/80 bg-card shadow-xs">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600">
                <ShieldCheck className="size-6" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">Verified Talent</h2>
                  <Badge className="bg-emerald-600 text-xs font-semibold text-white">
                    Terverifikasi Aktif
                  </Badge>
                </div>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  Identitas dasar dan riwayat akademik Anda telah terverifikasi melalui kemitraan institusi pendidikan dan audit sistem ProofyLink.
                </p>
              </div>
            </div>
            <div className="shrink-0 rounded-xl border border-border/70 bg-muted/30 px-5 py-3 text-center sm:text-right">
              <p className="font-mono text-base font-bold tabular-nums text-foreground">Tingkat 1</p>
              <p className="text-xs font-medium text-emerald-600">Kredensial Emas</p>
            </div>
          </CardContent>
        </Card>

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
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700">
                  Tervalidasi
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
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Metode Validasi:</span>
                  <span className="font-medium text-foreground">Pangkalan Data PT / Mitra Kampus</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Status Kemitraan:</span>
                  <span className="font-semibold text-emerald-600">Jalur Resmi ProofyLink</span>
                </div>
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
                  Tervalidasi
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3.5 p-5">
              <div>
                <p className="text-sm font-semibold text-foreground">{cvProfile?.fullName || user?.name || "Kandidat Profesional"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{cvProfile?.email || user?.email || "Email terdaftar"}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Verifikasi Email:</span>
                  <span className="font-semibold text-emerald-600">Tervalidasi (OTP)</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Nomor Telepon:</span>
                  <span className="font-semibold text-emerald-600">Terhubung (+62)</span>
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

        {/* Ajukan Verifikasi Dialog Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-foreground">
                Ajukan Verifikasi Kredensial
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Unggah dokumen PDF resmi (ijazah, transkrip, atau sertifikat profesi) untuk ditinjau tim kurator ProofyLink.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-1">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Kategori Dokumen
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDocType("academic")}
                    className={`rounded-lg border px-2.5 py-2 text-center text-xs font-medium transition-all cursor-pointer ${
                      docType === "academic"
                        ? "border-primary/50 bg-primary/10 text-primary font-semibold ring-1 ring-primary/25"
                        : "border-border bg-background text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    Ijazah
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocType("certificate")}
                    className={`rounded-lg border px-2.5 py-2 text-center text-xs font-medium transition-all cursor-pointer ${
                      docType === "certificate"
                        ? "border-primary/50 bg-primary/10 text-primary font-semibold ring-1 ring-primary/25"
                        : "border-border bg-background text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    Sertifikat
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocType("work")}
                    className={`rounded-lg border px-2.5 py-2 text-center text-xs font-medium transition-all cursor-pointer ${
                      docType === "work"
                        ? "border-primary/50 bg-primary/10 text-primary font-semibold ring-1 ring-primary/25"
                        : "border-border bg-background text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    Pengalaman
                  </button>
                </div>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileCheck2 className="size-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{selectedFile.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • PDF
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                      aria-label="Hapus file"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-muted/20 p-6 text-center transition-colors hover:bg-muted/40 cursor-pointer"
                  >
                    <UploadCloud className="size-8 text-muted-foreground mb-2" />
                    <span className="text-xs font-semibold text-foreground">
                      Pilih dokumen PDF resmi
                    </span>
                    <span className="mt-1 text-[11px] text-muted-foreground">
                      Maksimal ukuran file 5 MB
                    </span>
                  </button>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleRequestVerification}
                disabled={!selectedFile || submitting}
                className="font-semibold"
              >
                {submitting ? "Mengirim..." : "Kirim Pengajuan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
