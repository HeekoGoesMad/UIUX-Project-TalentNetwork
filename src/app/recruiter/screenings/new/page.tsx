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

  if (!candidate) {
    return (
      <ProtectedRoute role="recruiter">
        <main className="container mx-auto max-w-3xl px-4 py-8">
          <p className="text-muted-foreground">{candidateError ?? "Kandidat tidak ditemukan atau belum dipilih."}</p>
        </main>
      </ProtectedRoute>
    );
  }

  return <ProtectedRoute role="recruiter"><main className="container mx-auto max-w-3xl px-4 py-8">
     <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#7C3AED]"><ClipboardCheck className="size-4" /> Workspace Recruiter</p>
     <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-bold">Screening berbasis privasi</h1><p className="mt-2 text-muted-foreground">Minta consent sebelum menjalankan insight kecocokan peran dan kualitas data.</p></div><Link href={`/talent/${candidate.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#7C3AED]">Lihat profil <ArrowRight className="size-4" /></Link></div>
    <Card className="mt-8 overflow-hidden"><CardContent className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">Kandidat yang dipilih</p><p className="mt-1 text-xl font-bold">{candidate.name ?? "Nama kandidat belum tersedia"}</p><p className="text-sm text-muted-foreground">{candidate.role ?? "Role belum tersedia"} · {candidate.location ?? "Lokasi belum tersedia"}</p></div><div className="rounded-xl bg-purple-50 p-3 text-[#7C3AED]"><ShieldCheck className="size-5" /></div></div>
       <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-muted p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Tujuan</p><p className="mt-1 text-sm font-semibold">Kecocokan peran dan kualitas data</p></div><div className="rounded-xl bg-muted p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Biaya</p><p className="mt-1 text-sm font-semibold">1 token screening</p></div></div>
      <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 text-sm"><p className="font-semibold text-[#7C3AED]">Consent: {consent === "pending-candidate-consent" ? "Menunggu kandidat" : consent === "consented" ? "Disetujui" : consent === "screening-completed" ? "Screening selesai" : consent === "declined" ? "Ditolak" : "Belum diminta"}</p><p className="mt-1 text-muted-foreground">Financial, credit, dan atribut sensitif tidak digunakan.</p></div>
      {consent !== "consented" && consent !== "screening-completed" && <Button variant="outline" onClick={() => requestConsent(candidateId)} disabled={consent === "pending-candidate-consent"}>{consent === "pending-candidate-consent" ? "Menunggu consent kandidat" : "Minta consent kandidat"}</Button>}
      {consent === "consented" && <Button onClick={() => startScreening(candidateId)} disabled={screeningTokens <= 0}>Mulai screening (1 token)</Button>}
      {consent === "screening-completed" && <p className="text-sm font-semibold text-[#7C3AED]">Screening selesai. Token tidak akan terpotong lagi untuk screening ini.</p>}
    </CardContent></Card>
  </main></ProtectedRoute>;
}
