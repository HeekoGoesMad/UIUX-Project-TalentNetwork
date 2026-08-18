"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, Loader2, Search, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { candidates as demoCandidates, findCandidate } from "@/data/candidates";
import { useApp } from "@/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/protected-route";
import type { Candidate } from "@/types";

export default function NewScreeningPage() {
  const router = useRouter();
  const { screeningTokens, screeningConsents, requestConsent, startScreening, dbMode, bootstrapped, databaseError } = useApp();
  const [candidateId, setCandidateId] = useState("");
  const [candidate, setCandidate] = useState<{ id: string; name: string | null; role: string | null; location: string | null } | null>(null);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [remoteCandidates, setRemoteCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  // Load candidate list for picker
  useEffect(() => {
    if (!dbMode || !bootstrapped) return;
    void fetch("/api/candidates", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { candidates?: Candidate[] };
        if (response.ok) setRemoteCandidates(payload.candidates ?? []);
      })
      .catch(() => setRemoteCandidates([]));
  }, [dbMode, bootstrapped]);

  const availableCandidates = useMemo(() => {
    return dbMode && remoteCandidates.length > 0 ? remoteCandidates : demoCandidates;
  }, [dbMode, remoteCandidates]);

  useEffect(() => {
    if (dbMode && !bootstrapped) return;
    const requestedId = new URLSearchParams(window.location.search).get("candidateId");
    if (requestedId) {
      setCandidateId(requestedId);
    }
  }, [dbMode, bootstrapped]);

  useEffect(() => {
    if (!candidateId || (dbMode && !bootstrapped)) return;
    let active = true;
    if (!dbMode) {
      const fixture = findCandidate(candidateId);
      if (active) {
        setCandidate(fixture ? { id: fixture.id, name: fixture.name, role: fixture.role, location: fixture.location } : null);
        setCandidateError(fixture ? null : "Kandidat tidak ditemukan.");
      }
      return () => { active = false; };
    }
    void fetch(`/api/candidates/${encodeURIComponent(candidateId)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { candidate?: typeof candidate; error?: string };
        if (!response.ok || !payload.candidate) throw new Error(payload.error ?? "Profil kandidat tidak ditemukan.");
        if (active) {
          setCandidate(payload.candidate);
          setCandidateError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setCandidate(null);
          setCandidateError(error instanceof Error ? error.message : "Data kandidat belum dapat dimuat.");
        }
      });
    return () => { active = false; };
  }, [candidateId, dbMode, bootstrapped]);

  const consent = candidateId ? screeningConsents[candidateId] : undefined;

  const handleRequestConsent = async () => {
    if (!candidateId) return;
    setLoadingAction(true);
    try {
      await requestConsent(candidateId);
      toast.success("Permintaan consent terkirim", {
        description: `Permintaan screening dikirimkan ke ${candidate?.name ?? "kandidat"}.`,
      });
      router.push("/recruiter/screenings");
    } catch {
      toast.error("Gagal mengirim permintaan consent");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleStartScreening = async () => {
    if (!candidateId) return;
    setLoadingAction(true);
    try {
      const success = await startScreening(candidateId);
      if (success) {
        toast.success("Screening berhasil dijalankan!", {
          description: "Membuka hasil screening dan insight kandidat.",
        });
        router.push(`/recruiter/screenings/${candidateId}`);
      } else {
        toast.error("Token screening tidak mencukupi atau consent belum aktif.");
        setLoadingAction(false);
      }
    } catch (error) {
      toast.error("Gagal menjalankan screening", {
        description: error instanceof Error ? error.message : "Coba lagi.",
      });
      setLoadingAction(false);
    }
  };

  const filteredCandidates = availableCandidates.filter((item) => {
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.role.toLowerCase().includes(q) || item.location.toLowerCase().includes(q);
  });

  return (
    <ProtectedRoute role="recruiter">
      <main className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <Link
          href="/recruiter/screenings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" /> Kembali ke screening queue
        </Link>

        <div className="mt-6">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#7C3AED]">
            <ClipboardCheck className="size-4" /> Workspace recruiter
          </p>
          <h1 className="mt-2 text-3xl font-bold">Screening berbasis privasi</h1>
          <p className="mt-2 text-muted-foreground">
            Minta consent sebelum menjalankan insight kecocokan peran dan kualitas data.
          </p>
        </div>

        {databaseError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            {databaseError}
          </div>
        )}

        {candidateError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            {candidateError}
          </div>
        )}

        {/* Candidate Selector if not chosen */}
        {!candidate ? (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Pilih kandidat untuk screening</CardTitle>
              <p className="text-sm text-muted-foreground">Pilih profil dari talent pool untuk memulai alur consent screening.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari nama, role, atau lokasi kandidat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="divide-y max-h-80 overflow-y-auto rounded-xl border">
                {filteredCandidates.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">Kandidat tidak ditemukan.</p>
                ) : (
                  filteredCandidates.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setCandidateId(item.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-primary">
                          <UserRound className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.role} · {item.location}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setCandidateId(item.id)}>
                        Pilih <ArrowRight className="ml-1 size-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Selected Candidate Screening Card */
          <Card className="mt-8 overflow-hidden shadow-sm">
            <CardContent className="space-y-6 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED]">
                    <ShieldCheck className="size-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kandidat terpilih</p>
                    <p className="mt-0.5 text-xl font-bold">{candidate.name ?? "Nama kandidat belum tersedia"}</p>
                    <p className="text-sm text-muted-foreground">{candidate.role ?? "Role belum tersedia"} · {candidate.location ?? "Lokasi belum tersedia"}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setCandidateId(""); setCandidate(null); }}>
                  Ganti kandidat
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tujuan Screening</p>
                  <p className="mt-1 text-sm font-semibold">Kecocokan peran dan kualitas data</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Biaya Token</p>
                  <p className="mt-1 text-sm font-semibold">1 token screening (Saldo: {screeningTokens})</p>
                </div>
              </div>

              <div className="rounded-xl border border-purple-200/80 bg-purple-50/40 p-4 text-sm">
                <p className="font-semibold text-[#7C3AED]">
                  Status Consent:{" "}
                  {consent === "pending-candidate-consent"
                    ? "Menunggu jawaban kandidat"
                    : consent === "consented"
                    ? "Disetujui kandidat (Siap dijalankan)"
                    : consent === "screening-completed"
                    ? "Screening selesai"
                    : consent === "declined"
                    ? "Ditolak kandidat"
                    : "Belum diminta"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Financial, credit, dan atribut sensitif tidak digunakan. Keputusan hire/reject tetap berada di tangan recruiter.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
                <Button variant="outline" asChild>
                  <Link href={`/recruiter/discover/${candidate.id}`}>
                    Lihat Profil Kandidat
                  </Link>
                </Button>

                <div className="flex items-center gap-2">
                  {consent !== "consented" && consent !== "screening-completed" && (
                    <Button
                      onClick={handleRequestConsent}
                      disabled={loadingAction || consent === "pending-candidate-consent"}
                    >
                      {loadingAction ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <ClipboardCheck className="mr-2 size-4" />
                      )}
                      {consent === "pending-candidate-consent" ? "Menunggu consent kandidat" : "Minta consent kandidat"}
                    </Button>
                  )}

                  {consent === "consented" && (
                    <Button
                      onClick={handleStartScreening}
                      disabled={loadingAction || screeningTokens <= 0}
                      className="bg-[#7C3AED] hover:bg-[#6D28D9]"
                    >
                      {loadingAction ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="mr-2 size-4" />
                      )}
                      {loadingAction ? "Menjalankan screening..." : "Mulai screening (1 token)"}
                    </Button>
                  )}

                  {consent === "screening-completed" && (
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                      <Link href={`/recruiter/screenings/${candidate.id}`}>
                        <Check className="mr-2 size-4" /> Buka Hasil Screening &rarr;
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </ProtectedRoute>
  );
}
