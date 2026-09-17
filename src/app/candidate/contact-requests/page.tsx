"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  Scale,
  Shield,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Pusat Izin &amp; Privasi Skrining
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-3xl">
            ProofyLink beroperasi dengan prinsip <strong>Consent-First</strong>. Rekruter hanya dapat mengakses kontak lengkap dan ringkasan kecocokan risiko setelah mendapatkan izin eksplisit darimu.
          </p>
        </div>

        {/* 3 Value Pillars Callout */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardContent className="p-5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <ShieldCheck className="size-5" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">Kendali Penuh di Tanganmu</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Data kontak dan profil pribadimu tidak pernah dijual atau disiarkan tanpa izin eksplisit per perusahaan.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card shadow-2xs">
            <CardContent className="p-5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Scale className="size-5" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">0 Biaya Kandidat</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Setiap pemindaian profil memotong 1 token dari kuota rekruter. Kamu tidak dikenakan biaya apa pun.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card shadow-2xs">
            <CardContent className="p-5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <UserCheck className="size-5" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">Penilaian Objektif &amp; Adil</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Skrining ProofyLink mengevaluasi kelayakan peran secara transparan, tanpa diskriminasi atribut sensitif.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Permintaan Menunggu Persetujuan
                {pendingRequests.length > 0 && (
                  <Badge className="bg-amber-500 text-white font-mono text-xs">
                    {pendingRequests.length}
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                Tinjau perusahaan yang mengajukan akses kontak untuk proses wawancara.
              </p>
            </div>
          </div>

          {pendingRequests.length === 0 ? (
            <Card className="border-dashed border-border bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <CheckCircle2 className="size-6 text-emerald-600" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">Tidak Ada Permintaan Tertunda</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  Semua permintaan izin kontak telah kamu tindaklanjuti. Rekruter baru yang ingin menghubungimu akan muncul di sini.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <Card key={req.itemId} className="border-amber-200/80 bg-card shadow-xs">
                  <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5">
                    <div className="flex items-start gap-3.5">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <Building2 className="size-5" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground">{req.company}</h3>
                          <Badge variant="outline" className="text-xs text-amber-700 bg-amber-50 border-amber-200">
                            Menunggu Konfirmasi
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Diajukan oleh: <span className="font-medium text-foreground">{req.recruiterName}</span>
                          {req.email ? ` • ${req.email}` : ""}
                        </p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock3 className="size-3.5" />
                          Diajukan pada {new Date(req.requestedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actingId === req.itemId}
                        onClick={() => handleAction(req.candidateId, req.itemId, "declined")}
                        className="text-xs font-medium text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3.5 mr-1" /> Tolak
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        disabled={actingId === req.itemId}
                        onClick={() => handleAction(req.candidateId, req.itemId, "consented")}
                        className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Check className="size-3.5 mr-1" /> Berikan Izin
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* History / Active Authorizations */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Riwayat Otorisasi Kontak</h2>
            <p className="text-xs text-muted-foreground">
              Daftar rekruter yang telah kamu berikan izin atau kamu tolak sebelumnya.
            </p>
          </div>

          {approvedRequests.length === 0 && declinedRequests.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="py-8 text-center text-xs text-muted-foreground">
                Belum ada riwayat otorisasi kontak.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
              <div className="divide-y divide-border/60">
                {approvedRequests.map((req) => (
                  <div key={req.itemId} className="flex items-center justify-between p-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                        <Check className="size-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{req.company}</p>
                        <p className="text-xs text-muted-foreground">{req.recruiterName}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-xs">
                      Izin Aktif
                    </Badge>
                  </div>
                ))}
                {declinedRequests.map((req) => (
                  <div key={req.itemId} className="flex items-center justify-between p-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-md bg-red-50 text-red-600">
                        <X className="size-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{req.company}</p>
                        <p className="text-xs text-muted-foreground">{req.recruiterName}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-muted-foreground bg-muted text-xs">
                      Ditolak
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5-Pillar Disclosure Transparency Box */}
        <Card className="border-border bg-card shadow-2xs">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Shield className="size-4.5 text-primary" />
              Transparansi Kerangka 5 Pilar Skrining ProofyLink
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Ketika rekruter menjalankan skrining kesiapan karier dengan izinmu, berikut adalah 5 pilar berbobot yang dianalisis:
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FIVE_PILLARS.map((pillar) => (
                <div key={pillar.name} className="rounded-lg border border-border/80 bg-muted/30 p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">{pillar.name}</span>
                    <span className="font-mono text-[11px] font-bold text-primary">{pillar.weight}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{pillar.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground border-t pt-3">
              * Skrining ProofyLink tidak pernah mengevaluasi riwayat gaji, kondisi finansial personal, kredit perbankan, atau atribut yang dilindungi undang-undang ketenagakerjaan.
            </p>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
