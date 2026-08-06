"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, Bookmark, Check, CircleHelp, Copy, FileCheck2, Lock, Loader2, Mail, MapPin, Phone, RefreshCw, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { findCandidate } from "@/data/candidates";
import { useApp } from "@/providers/app-provider";
import { CandidateAvatar } from "@/components/candidates/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProtectedRoute } from "@/components/auth/protected-route";
import type { AiSummary, ScreeningInsight, ScreeningResult } from "@/types";

function List({ items }: { items: string[] }) {
  return <ul className="space-y-2 text-sm text-muted-foreground">{items.map((item) => <li key={item} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#19a974]" />{item}</li>)}</ul>;
}

function ScreeningResults({ candidateId, completed, result, saveResult }: { candidateId: string; completed: boolean; result?: ScreeningResult; saveResult: (candidateId: string, result: ScreeningResult) => void }) {
  const [state, setState] = useState<"idle" | "loading" | "error">(result ? "idle" : completed ? "loading" : "idle");
  const [error, setError] = useState("");

  const loadResults = async () => {
    if (!completed || result) return;
    setState("loading");
    setError("");
    try {
      const candidate = findCandidate(candidateId);
      if (!candidate) throw new Error("Profile kandidat tidak ditemukan.");
      const profile = { headline: candidate.role, about: candidate.summary, skills: candidate.skills, targetRole: candidate.role, location: candidate.location };
      const [insightResponse, summaryResponse] = await Promise.all([
        fetch("/api/ai/screening-insight", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consent: true, profile }) }),
        fetch("/api/ai/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) }),
      ]);
      if (!insightResponse.ok || !summaryResponse.ok) throw new Error("Hasil AI belum dapat dimuat. Coba lagi.");
      const insight = await insightResponse.json() as ScreeningInsight;
      const summary = await summaryResponse.json() as AiSummary;
      saveResult(candidateId, { insight, summary, fetchedAt: new Date().toISOString() });
      setState("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Hasil screening belum dapat dimuat.");
      setState("error");
    }
  };

  // Defer the request so the initial profile render is not coupled to result state updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const timer = window.setTimeout(() => void loadResults(), 0); return () => window.clearTimeout(timer); }, [candidateId, completed, result]);

  return <section className="mt-10 border-t pt-10" aria-labelledby="screening-results-title">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div><p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#08744f]"><ShieldCheck className="size-4" /> Recruiter insight</p><h2 id="screening-results-title" className="mt-2 text-2xl font-bold">Hasil screening</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Insight berbasis role fit dan kualitas data, ditampilkan setelah consent kandidat dan screening selesai.</p></div>
      {completed && <Badge variant="outline" className="w-fit border-[#b9e6d0] bg-[#f7fffb] text-[#08744f]"><FileCheck2 className="mr-1 size-3" /> Screening selesai</Badge>}
    </div>
    {!completed && <Card className="mt-5 border-dashed bg-muted/30"><CardContent className="flex gap-3 p-5"><CircleHelp className="mt-0.5 size-5 shrink-0 text-muted-foreground" /><div><p className="font-semibold">Hasil belum tersedia</p><p className="mt-1 text-sm text-muted-foreground">Selesaikan consent kandidat dan screening terlebih dahulu. Hasil tidak ditampilkan hanya karena profile sudah dibuka.</p></div></CardContent></Card>}
    {completed && state === "loading" && <Card className="mt-5"><CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground" role="status"><Loader2 className="size-5 animate-spin text-[#19a974]" /> Menyiapkan hasil screening dan AI Summary...</CardContent></Card>}
    {completed && state === "error" && <Card className="mt-5 border-red-200 bg-red-50/50"><CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" /><div><p className="font-semibold text-red-950">Hasil belum berhasil dimuat</p><p className="mt-1 text-sm text-red-900/80">{error}</p></div></div><Button variant="outline" onClick={() => { setState("loading"); setError(""); void loadResults(); }}><RefreshCw className="size-4" /> Coba lagi</Button></CardContent></Card>}
    {completed && result && <div className="mt-5 space-y-4">
      <Card className="overflow-hidden border-[#b9e6d0]">
        <CardContent className="grid gap-6 bg-[#f7fffb] p-6 sm:grid-cols-[auto_1fr] sm:items-center"><div className="flex size-28 flex-col items-center justify-center rounded-full border-8 border-[#19a974]/20 bg-white"><span className="font-mono text-4xl font-bold text-[#08744f]">{result.insight.score}</span><span className="text-xs text-muted-foreground">dari 100</span></div><div><div className="flex flex-wrap items-center gap-2"><Badge className="bg-[#08744f]">{result.insight.label}</Badge><span className="text-sm text-muted-foreground">Rekomendasi berbasis data, bukan keputusan otomatis</span></div><div className="mt-5"><div className="flex justify-between text-sm"><span className="font-semibold">Data coverage</span><span className="font-mono text-[#08744f]">{result.insight.coverage}%</span></div><div className="mt-2 h-2 rounded-full bg-[#b9e6d0]"><div className="h-2 rounded-full bg-[#19a974]" style={{ width: `${result.insight.coverage}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">Seberapa banyak konteks profile yang tersedia untuk insight ini.</p></div></div></CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle className="text-lg">Evidence yang terdeteksi</CardTitle></CardHeader><CardContent><List items={result.insight.evidence} /></CardContent></Card><Card><CardHeader><CardTitle className="text-lg">Limitasi</CardTitle></CardHeader><CardContent><ul className="space-y-2 text-sm text-muted-foreground">{result.insight.limitations.map((item) => <li key={item} className="flex gap-2"><AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />{item}</li>)}</ul></CardContent></Card></div>
      <Card className="border-[#c9d9ee] bg-[#f0f6fd]"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="size-5 text-[#08744f]" /> AI Summary <Badge variant="outline">AI draft</Badge></CardTitle></CardHeader><CardContent className="space-y-4"><p className="leading-7">{result.summary.summary}</p><div className="grid gap-4 sm:grid-cols-2"><div><p className="mb-2 text-sm font-semibold">Kekuatan yang terlihat</p><List items={result.summary.strengths} /></div><div><p className="mb-2 text-sm font-semibold">Bukti pendukung</p><List items={result.summary.evidence} /></div></div></CardContent></Card>
      <Card className="bg-muted/30"><CardContent className="space-y-3 p-5"><div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-muted-foreground"><span>Source: {result.insight.source}</span><span>Model: {result.insight.modelVersion}</span><span>Fetched: {new Date(result.fetchedAt).toLocaleDateString("id-ID")}</span></div><p className="flex gap-2 text-sm font-medium"><CircleHelp className="mt-0.5 size-4 shrink-0 text-amber-600" />Human review diperlukan. Gunakan hasil ini sebagai bahan persiapan interview, bukan keputusan hire/reject.</p><p className="text-sm text-muted-foreground">Next step: {result.insight.followUp}</p></CardContent></Card>
    </div>}
  </section>;
}

export default function TalentProfile() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const candidate = findCandidate(candidateId);
  const { tokens, scans, scan, shortlisted, toggleShortlist, viewed, user, hydrated, screeningConsents, screeningResults, saveScreeningResult } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (candidate) viewed(candidate.id); }, [candidateId]);
  if (!user || user.role !== "recruiter") return <ProtectedRoute role="recruiter"><div /></ProtectedRoute>;
  if (!candidate) return <div className="container mx-auto max-w-md px-4 py-16 text-center"><p className="font-mono text-xs uppercase tracking-widest text-primary">404 / profile missing</p><h1 className="mt-3 text-3xl font-bold">This profile moved on.</h1><p className="mt-3 text-muted-foreground">Try another candidate from the network.</p><Button className="mt-6" asChild><Link href="/search">Return to search</Link></Button></div>;
  const unlocked = scans.some((item) => item.candidateId === candidate.id);
  const completed = hydrated && screeningConsents[candidate.id] === "screening-completed";
  const startScan = () => { if (tokens <= 0) { toast.error("No tokens available", { description: "Add tokens before scanning a new profile." }); setConfirmOpen(false); return; } setScanning(true); window.setTimeout(() => { scan(candidate.id); setScanning(false); setConfirmOpen(false); }, 650); };
  return <div className="container mx-auto max-w-4xl px-4 py-8"><Link href="/search" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to search</Link><Card className="mt-6 overflow-hidden"><div className="bg-primary px-6 py-8 text-primary-foreground sm:px-10"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><CandidateAvatar initials={candidate.initials} locked={!unlocked} className="size-20 bg-primary-foreground/15 text-primary-foreground" /><div className="flex-1"><p className={unlocked ? "text-2xl font-bold" : "text-2xl font-bold blur-md select-none"}>{unlocked ? candidate.name : "Private candidate"}</p><p className="mt-1 text-primary-foreground/75">{candidate.role} · {candidate.location}</p><p className="mt-3 text-xs text-primary-foreground/80">{candidate.experience} years experience · {candidate.availability}</p></div><div className="flex gap-2"><Button variant="secondary" size="icon" onClick={() => toggleShortlist(candidate.id)} aria-label="Toggle shortlist"><Bookmark className={shortlisted.includes(candidate.id) ? "fill-primary" : ""} /></Button><Button variant="secondary" size="icon" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Profile link copied"); }} aria-label="Copy profile link"><Copy /></Button></div></div></div>{!unlocked ? <CardContent className="px-6 py-10 text-center sm:px-10"><div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-primary"><Lock /></div><h1 className="mt-5 text-2xl font-bold">There is more to this profile.</h1><p className="mx-auto mt-3 max-w-xl text-muted-foreground">Scan to reveal their name, story, experience, and contact details. This uses one token. Browsing stays free.</p><p className="mt-4 font-mono text-sm">Expected range: {candidate.salary}</p><Button className="mt-7" size="lg" disabled={tokens <= 0} onClick={() => setConfirmOpen(true)}><ScanLine className="size-4" /> Scan profile · 1 token</Button></CardContent> : <CardContent className="space-y-8 px-6 py-8 sm:px-10"><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-sm text-muted-foreground">About</p><p className="mt-2 leading-7">{candidate.summary}</p></div><div className="space-y-3 text-sm"><p className="flex items-center gap-2"><MapPin className="size-4 text-primary" />{candidate.location}</p><p className="flex items-center gap-2"><Mail className="size-4 text-primary" />{candidate.email}</p><p className="flex items-center gap-2"><Phone className="size-4 text-primary" />{candidate.phone}</p></div></div><div><p className="mb-3 text-sm font-semibold">Skills</p><div className="flex flex-wrap gap-2">{candidate.skills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</div></div><div><p className="mb-3 text-sm font-semibold">Experience</p><div className="space-y-3">{candidate.history.map((item) => <div key={`${item.company}-${item.role}`} className="flex flex-col justify-between gap-1 rounded-xl border p-4 sm:flex-row"><div><p className="font-semibold">{item.role}</p><p className="text-sm text-muted-foreground">{item.company}</p></div><span className="font-mono text-xs text-muted-foreground">{item.years}</span></div>)}</div></div></CardContent>}</Card>{unlocked && <ScreeningResults candidateId={candidate.id} completed={completed} result={screeningResults[candidate.id]} saveResult={saveScreeningResult} />}<Dialog open={confirmOpen} onOpenChange={(open) => !scanning && setConfirmOpen(open)}><DialogContent><DialogHeader><DialogTitle>Scan this profile?</DialogTitle><DialogDescription>This will use 1 token and reveal the candidate&apos;s full profile. You have {tokens} {tokens === 1 ? "token" : "tokens"} remaining.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={scanning} onClick={() => setConfirmOpen(false)}>Cancel</Button><Button disabled={scanning || tokens <= 0} onClick={startScan}>{scanning && <Loader2 className="size-4 animate-spin" />}{scanning ? "Scanning profile..." : "Confirm scan"}</Button></DialogFooter></DialogContent></Dialog></div>;
}
