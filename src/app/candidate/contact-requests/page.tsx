"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock3, History, Mail, ShieldCheck, UserRound } from "lucide-react";
import { candidates } from "@/data/candidates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useApp } from "@/providers/app-provider";
import type { ConsentState } from "@/types";

const statusLabels: Record<ConsentState, string> = {
  "not-requested": "Belum diminta", "pending-candidate-consent": "Menunggu jawabanmu", consented: "Disetujui",
  declined: "Ditolak", "consent-expired": "Kedaluwarsa", withdrawn: "Ditarik", "screening-in-progress": "Screening berjalan",
  "screening-completed": "Screening selesai", disputed: "Perlu ditinjau",
};

function formatDate(value?: string) {
  if (!value) return "Tanggal belum tersedia";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default function ContactRequestsPage() {
  const { hydrated, screeningConsents, contactRequests, respondToConsent, approvePendingRequests, dbMode, bootstrapped, databaseError, consentRequests } = useApp();
  const remoteRequests = consentRequests.map((request) => ({
    candidateId: typeof request.candidateProfileId === "string" ? request.candidateProfileId : "",
    state: statusLabels[request.consentState as ConsentState] ? request.consentState as ConsentState : (screeningConsents[String(request.candidateProfileId)] ?? "not-requested"),
    request: { recruiterName: typeof request.recruiterName === "string" ? request.recruiterName : undefined, company: typeof request.organizationName === "string" ? request.organizationName : undefined, email: typeof request.recruiterEmail === "string" ? request.recruiterEmail : undefined, requestedAt: typeof request.createdAt === "string" ? request.createdAt : undefined, history: [] },
  })).filter((request) => request.candidateId && request.state !== "not-requested");
  const localRequests = Object.entries(screeningConsents).filter(([, state]) => state !== "not-requested").map(([candidateId, state]) => ({ candidateId, state, request: contactRequests ? contactRequests[candidateId] : undefined }));
  const requests = dbMode ? remoteRequests : localRequests;
  const requestIds = requests.map(({ candidateId }) => candidateId).join(",");
  const [remoteCandidates, setRemoteCandidates] = useState<Record<string, { role: string | null; location: string | null }>>({});
  const [candidateError, setCandidateError] = useState<string | null>(null);
  useEffect(() => {
    if (!dbMode || !bootstrapped || !requestIds) return;
    let active = true;
    void Promise.all(requestIds.split(",").map(async (candidateId) => {
      const response = await fetch(`/api/candidates/${encodeURIComponent(candidateId)}`, { cache: "no-store" });
      const payload = await response.json() as { candidate?: { role: string | null; location: string | null }; error?: string };
      if (!response.ok || !payload.candidate) throw new Error(payload.error ?? "Profil kandidat tidak ditemukan.");
      return [candidateId, payload.candidate] as const;
    })).then((entries) => { if (active) { setRemoteCandidates(Object.fromEntries(entries)); setCandidateError(null); } })
      .catch((error: unknown) => { if (active) setCandidateError(error instanceof Error ? error.message : "Data kandidat belum dapat dimuat."); });
    return () => { active = false; };
  }, [dbMode, bootstrapped, requestIds]);
  const pending = requests.filter(({ state }) => state === "pending-candidate-consent");

  return <ProtectedRoute role="candidate">
    <main className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-[#08744f]">Workspace Kandidat / Privasi</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Permintaan kontak</h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Pilih siapa yang boleh melanjutkan ke screening. Profil kamu tetap aman sampai kamu menyetujui permintaan.</p>
        </div>
        {pending.length > 0 && <Button onClick={approvePendingRequests}><Check className="size-4" /> Setujui {pending.length} permintaan</Button>}
      </div>

       {(!hydrated || (dbMode && !bootstrapped)) ? <div className="mt-8 rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground" role="status">Memuat permintaan...</div> : databaseError ? <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700" role="alert">Permintaan belum dapat dimuat. {databaseError}</div> : requests.length === 0 ?
        <div className="mt-8 rounded-lg border border-dashed bg-card p-10 text-center"><ShieldCheck className="mx-auto size-8 text-[#19a974]" /><h2 className="mt-4 font-semibold">Inbox kamu masih tenang</h2><p className="mt-2 text-sm text-muted-foreground">Permintaan dari recruiter akan muncul di sini untuk kamu tinjau.</p></div> :
          <div className="mt-8 space-y-4">{candidateError && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{candidateError}</div>}{requests.map(({ candidateId, state, request }) => {
            const candidate = dbMode ? remoteCandidates[candidateId] : candidates.find((item) => item.id === candidateId);
          const isPending = state === "pending-candidate-consent";
          const isApproved = ["consented", "screening-in-progress", "screening-completed"].includes(state);
          return <Card key={candidateId} className={isPending ? "border-[#19a974]/40 shadow-sm" : "shadow-sm"}>
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f0f6fd] text-[#1e4080]"><UserRound className="size-5" /></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{request?.recruiterName ?? "Recruiter"}</h2><Badge variant={isPending ? "default" : "outline"}>{statusLabels[state]}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{request?.company ?? "Konteks perusahaan belum tersedia"}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Mail className="size-3.5" /> {request?.email ?? "Email belum tersedia"}</span><span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" /> {formatDate(request?.requestedAt)}</span></div></div></div>
                 {isPending && <div className="flex shrink-0 gap-2"><Button size="sm" onClick={() => void respondToConsent(candidateId, "consented")}><Check className="size-3.5" /> Izinkan</Button><Button size="sm" variant="outline" onClick={() => void respondToConsent(candidateId, "declined")}>Tolak</Button></div>}
              </div>
               <div className="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Konteks screening</p><p className="mt-1 text-sm">{candidate ? `${candidate.role ?? "Role belum tersedia"} · ${candidate.location ?? "Lokasi belum tersedia"}` : dbMode ? "Profil kandidat tidak ditemukan." : `Candidate ID: ${candidateId}`}</p>{request?.history && request.history.length > 0 && <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><History className="size-3.5" /> Riwayat: {request.history.map((item) => statusLabels[item.state]).join(" → ")}</div>}</div>{isApproved && <Button size="sm" variant="outline" asChild><Link href={`/messages?contact=${encodeURIComponent(request?.email ?? candidateId)}`}>Lanjut ke percakapan <ArrowRight className="size-3.5" /></Link></Button>}</div>
            </CardContent>
          </Card>;
        })}</div>}
    </main>
  </ProtectedRoute>;
}
