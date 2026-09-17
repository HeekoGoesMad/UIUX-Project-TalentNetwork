"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Shield,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { useApp } from "@/providers/app-provider";
import type { ConsentState } from "@/types";

const FIVE_PILLARS = [
  {
    name: "Life Stability",
    weight: "10%",
    desc: "Konsistensi domisili, stabilitas jalur karier, dan keselarasan peran.",
  },
  {
    name: "Financial Wisdom",
    weight: "40%",
    desc: "Tanggung jawab komitmen, kebiasaan finansial sehat, dan integritas.",
  },
  {
    name: "Commitment History",
    weight: "40%",
    desc: "Durasi retensi di tempat kerja sebelumnya dan penyelesaian kontrak.",
  },
  {
    name: "Behavioral Pattern",
    weight: "5%",
    desc: "Pola komunikasi profesional, etika kerja, dan ketepatan waktu.",
  },
  {
    name: "Resilience & Recovery",
    weight: "5%",
    desc: "Kemampuan bangkit dari tantangan dan adaptabilitas di lingkungan baru.",
  },
];

const HISTORY_PER_PAGE = 5;

export default function ContactRequestsPage() {
  const {
    user,
    dbMode,
    consentRequests,
    screeningConsents,
    contactRequests,
    respondToConsent,
  } = useApp();

  const [actingId, setActingId] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);

  // Normalize all screening / contact requests
  const formattedRequests = useMemo(() => {
    if (user?.role !== "candidate") return [];
    if (dbMode) {
      return consentRequests
        .map((req) => ({
          itemId: typeof req.itemId === "string" ? req.itemId : String(req.candidateProfileId),
          candidateId: typeof req.candidateProfileId === "string" ? req.candidateProfileId : "",
          state: (req.consentState as ConsentState) || "pending-candidate-consent",
          recruiterName: typeof req.recruiterName === "string" ? req.recruiterName : "Tim Rekruter",
          company: typeof req.organizationName === "string" ? req.organizationName : "Organisasi Mitra",
          email: typeof req.recruiterEmail === "string" ? req.recruiterEmail : null,
          requestedAt: typeof req.createdAt === "string" ? req.createdAt : new Date().toISOString(),
        }))
        .filter((r) => r.candidateId);
    }
    return Object.entries(screeningConsents)
      .filter(([, state]) => state !== "not-requested")
      .map(([candidateId, state]) => ({
        itemId: candidateId,
        candidateId,
        state,
        recruiterName: contactRequests?.[candidateId]?.recruiterName || "Tim Rekruter",
        company: contactRequests?.[candidateId]?.company || "Perusahaan Mitra",
        email: contactRequests?.[candidateId]?.email || null,
        requestedAt: contactRequests?.[candidateId]?.requestedAt || new Date().toISOString(),
      }));
  }, [user, dbMode, consentRequests, screeningConsents, contactRequests]);

  const pendingRequests = formattedRequests.filter((r) => r.state === "pending-candidate-consent");
  const approvedRequests = formattedRequests.filter((r) => r.state === "consented");
  const declinedRequests = formattedRequests.filter((r) => r.state === "declined");

  const combinedHistory = useMemo(() => {
    return [...approvedRequests, ...declinedRequests].sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
  }, [approvedRequests, declinedRequests]);

  const totalHistoryPages = Math.ceil(combinedHistory.length / HISTORY_PER_PAGE);
  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * HISTORY_PER_PAGE;
    return combinedHistory.slice(start, start + HISTORY_PER_PAGE);
  }, [combinedHistory, historyPage]);

  const handleAction = async (candidateId: string, itemId: string, action: "consented" | "declined") => {
    setActingId(itemId);
    try {
      const ok = await respondToConsent(candidateId, action, itemId);
      if (ok) {
        toast.success(
          action === "consented"
            ? "Izin kontak & skrining berhasil diberikan kepada rekruter."
            : "Permintaan kontak telah ditolak."
        );
      } else {
        toast.error("Gagal memperbarui izin kontak.");
      }
    } catch {
      toast.error("Terjadi kendala saat memproses perizinan.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <ProtectedRoute role="candidate">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Izin &amp; Privasi
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Rekruter hanya dapat melihat kontak dan ringkasan kecocokan setelah Anda memberi izin eksplisit untuk tiap perusahaan.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <span>
            Data kontak Anda tidak pernah dibagikan tanpa persetujuan eksplisit. Menyetujui atau menolak tidak dipungut biaya dan tidak memengaruhi kelulusan akun Anda.
          </span>
        </div>

        {/* Pending Requests Section */}
        <section aria-label="Permintaan menunggu" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                Menunggu Keputusan
                {pendingRequests.length > 0 && (
                  <Badge className="bg-amber-500 font-mono text-xs text-white tabular-nums">
                    {pendingRequests.length}
                  </Badge>
                )}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tinjau perusahaan yang meminta akses kontak untuk proses wawancara.
              </p>
            </div>
          </div>

          {pendingRequests.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Tidak ada permintaan tertunda"
              description="Semua permintaan izin sudah Anda tindaklanjuti. Permintaan baru dari rekruter akan muncul di sini."
              className="border border-dashed border-border/80 bg-card/60 p-8 shadow-none"
            />
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <Card key={req.itemId} className="border-border/80 bg-card shadow-xs transition-colors hover:border-border">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <Building2 className="size-5" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">{req.company}</h3>
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[11px] font-medium text-amber-700">
                            Menunggu konfirmasi
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Diajukan oleh <span className="font-medium text-foreground">{req.recruiterName}</span>
                          {req.email ? ` • ${req.email}` : ""}
                        </p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock3 className="size-3.5" />
                          Diajukan {new Date(req.requestedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actingId === req.itemId}
                        onClick={() => handleAction(req.candidateId, req.itemId, "declined")}
                        className="text-xs font-medium"
                      >
                        <X className="mr-1 size-3.5" /> Tolak
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        disabled={actingId === req.itemId}
                        onClick={() => handleAction(req.candidateId, req.itemId, "consented")}
                        className="bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <Check className="mr-1 size-3.5" /> Beri izin
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* History / Active Authorizations */}
        <section aria-label="Riwayat otorisasi" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Riwayat Otorisasi</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Rekruter yang pernah Anda beri izin atau tolak.
              </p>
            </div>
            {combinedHistory.length > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums font-mono">
                {combinedHistory.length} catatan
              </span>
            )}
          </div>

          {combinedHistory.length === 0 ? (
            <EmptyState
              icon={Clock3}
              title="Belum ada riwayat otorisasi"
              description="Riwayat izin kontak dan verifikasi skrining yang pernah Anda tentukan akan tercatat di sini."
              className="border border-dashed border-border/80 bg-card/60 p-8 shadow-none"
            />
          ) : (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
                <div className="divide-y divide-border/60">
                  {paginatedHistory.map((req) => {
                    const isConsented = req.state === "consented";
                    return (
                      <div key={req.itemId} className="flex items-center justify-between p-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                              isConsented ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            }`}
                          >
                            {isConsented ? <Check className="size-4" /> : <X className="size-4" />}
                          </span>
                          <div>
                            <p className="font-semibold text-foreground">{req.company}</p>
                            <p className="text-xs text-muted-foreground">
                              {req.recruiterName} • {new Date(req.requestedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            isConsented
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200 text-xs font-medium"
                              : "text-muted-foreground bg-muted text-xs font-medium"
                          }
                        >
                          {isConsented ? "Izin Aktif" : "Ditolak"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Numbered Pagination */}
              {totalHistoryPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    Halaman {historyPage} dari {totalHistoryPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage <= 1}
                      className="h-8 px-2 text-xs"
                      aria-label="Halaman sebelumnya"
                    >
                      <ChevronLeft className="size-3.5" />
                      <span className="hidden sm:inline">Sebelumnya</span>
                    </Button>
                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalHistoryPages }, (_, idx) => idx + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setHistoryPage(pageNum)}
                          aria-current={pageNum === historyPage ? "page" : undefined}
                          className={`flex size-8 items-center justify-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                            pageNum === historyPage
                              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                      disabled={historyPage >= totalHistoryPages}
                      className="h-8 px-2 text-xs"
                      aria-label="Halaman berikutnya"
                    >
                      <span className="hidden sm:inline">Berikutnya</span>
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 5 Pillars Screening Info Card */}
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Shield className="size-4 text-muted-foreground" />
              Aspek Penilaian Skrining
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Jika Anda memberi izin, rekruter menilai keselarasan peran lewat 5 aspek berbobot berikut:
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FIVE_PILLARS.map((pillar) => (
                <div key={pillar.name} className="rounded-lg border border-border/70 bg-muted/20 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">{pillar.name}</span>
                    <Badge variant="secondary" className="font-mono text-[11px] font-semibold tabular-nums">
                      {pillar.weight}
                    </Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{pillar.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
              Skrining tidak menilai gaji, kondisi finansial personal, riwayat kredit, atau atribut yang dilindungi undang-undang ketenagakerjaan.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="outline" asChild size="sm">
            <Link href="/candidate">Kembali ke workspace</Link>
          </Button>
          <Button asChild size="sm" className="font-semibold">
            <Link href="/notifications">
              Buka notifikasi
              <ArrowRight className="ml-1.5 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
