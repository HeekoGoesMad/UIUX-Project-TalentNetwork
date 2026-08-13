"use client";

import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { candidates as demoCandidates } from "@/data/candidates";
import { useApp } from "@/providers/app-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Candidate } from "@/types";

export default function Dashboard() {
  const { tokens, scans, shortlisted, recentlyViewed, dbMode, bootstrapped, databaseError } = useApp();
  const [remoteCandidates, setRemoteCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    if (!dbMode || !bootstrapped) return;
    void fetch("/api/candidates", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { candidates?: Candidate[] };
        if (response.ok) setRemoteCandidates(payload.candidates ?? []);
      })
      .catch(() => setRemoteCandidates([]));
  }, [dbMode, bootstrapped]);

  return <ProtectedRoute role="recruiter">
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#19a974]"><ShieldCheck className="size-4" /> Recruiter workspace</p>
          <h1 className="mt-3 text-3xl font-bold">Talent workspace</h1>
          <p className="mt-2 text-muted-foreground">Pantau kandidat yang sedang kamu evaluasi.</p>
        </div>
        <Button asChild><Link href="/search"><Search className="size-4" /> Search talent</Link></Button>
      </div>
      {tokens <= 5 && <div className="mt-6 flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm sm:flex-row sm:items-center"><div><p className="font-semibold text-amber-950">Token balance hampir habis</p><p className="mt-1 text-amber-900/80">Tersisa {tokens} token untuk unlock profile.</p></div><Button variant="outline" asChild><Link href="/pricing">Add tokens <ArrowRight className="size-4" /></Link></Button></div>}
      <div className="mt-8 grid gap-4 md:grid-cols-3"><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Token balance</p><p className="mt-2 flex items-center gap-2 font-mono text-4xl font-bold"><WalletCards className="size-7 text-[#19a974]" />{tokens}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Profile dibuka</p><p className="mt-2 font-mono text-4xl font-bold">{scans.length}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Shortlist aktif</p><p className="mt-2 font-mono text-4xl font-bold">{shortlisted.length}</p></CardContent></Card></div>
      {dbMode && !bootstrapped ? <div className="mt-8 rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground" role="status">Memuat data database...</div> : dbMode && databaseError ? <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700" role="alert">Data dashboard belum dapat dimuat. {databaseError}</div> : <DashboardCandidates candidates={dbMode ? remoteCandidates : demoCandidates} ids={[...recentlyViewed, ...scans.map((scan) => scan.candidateId), ...shortlisted]} />}
    </div>
  </ProtectedRoute>;
}

function DashboardCandidates({ candidates, ids }: { candidates: Candidate[]; ids: string[] }) {
  const visible = ids.map((id) => candidates.find((candidate) => candidate.id === id)).filter((candidate): candidate is Candidate => Boolean(candidate)).slice(0, 3);
  if (!visible.length) return <Card className="mt-8"><CardContent className="p-8 text-center text-sm text-muted-foreground">Belum ada aktivitas kandidat.</CardContent></Card>;
  return <Card className="mt-8"><CardHeader><CardTitle>Aktivitas kandidat</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3">{visible.map((candidate) => <Link key={candidate.id} href={`/talent/${candidate.id}`} className="rounded-lg border p-4 transition-colors hover:bg-muted"><p className="font-semibold">{candidate.name}</p><p className="mt-1 text-sm text-muted-foreground">{candidate.role}</p><p className="mt-3 text-xs text-primary">Lihat profile <ArrowRight className="ml-1 inline size-3" /></p></Link>)}</CardContent></Card>;
}
