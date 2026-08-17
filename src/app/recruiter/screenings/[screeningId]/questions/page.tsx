"use client";

import Link from "next/link";
import { ArrowLeft, FileQuestion, Loader2, Plus, RefreshCw, Save, Sparkles, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { findCandidate } from "@/data/candidates";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import type { Candidate } from "@/types";

export default function InterviewQuestionsPage() {
  const { screeningId } = useParams<{ screeningId: string }>();
  const { dbMode, bootstrapped } = useApp();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dbMode && !bootstrapped) return;
    let active = true;
    const load = async () => {
      try {
        let context: Partial<Candidate> | null = null;
        if (dbMode) { const response = await fetch(`/api/candidates/${encodeURIComponent(screeningId)}`, { cache: "no-store" }); const payload = await response.json() as { candidate?: Candidate; error?: string }; if (!response.ok || !payload.candidate) throw new Error(payload.error ?? "Profil kandidat tidak ditemukan."); context = payload.candidate; }
        else context = findCandidate(screeningId) ?? null;
        if (!context) throw new Error("Konteks kandidat tidak ditemukan.");
        if (active) { setCandidate(context as Candidate); await generate(context); }
      } catch (reason: unknown) { if (active) setError(reason instanceof Error ? reason.message : "Workspace pertanyaan belum dapat dimuat."); }
      finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
    // The first draft is intentionally generated once when candidate context is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped, dbMode, screeningId]);

  async function generate(context: Partial<Candidate> | null = candidate) {
    if (!context) return;
    setGenerating(true); setError(null);
    try {
      const response = await fetch("/api/ai/interview-questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ headline: context.role, targetRole: context.role, about: context.summary, location: context.location, skills: context.skills ?? [] }) });
      const payload = await response.json() as { questions?: string[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "AI draft belum tersedia untuk role ini.");
      setQuestions(payload.questions ?? []);
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Pertanyaan belum dapat dibuat."); }
    finally { setGenerating(false); }
  }

  return <ProtectedRoute role="recruiter"><main className="container mx-auto max-w-4xl px-4 py-8 sm:py-10"><Link href={`/recruiter/screenings/${screeningId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ArrowLeft className="size-4" /> Kembali ke detail</Link><div className="mt-6"><p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary"><FileQuestion className="size-4" /> Interview workspace</p><h1 className="mt-3 text-3xl font-bold tracking-tight">Pertanyaan interview</h1><p className="mt-2 text-muted-foreground">{candidate ? `Draft untuk ${candidate.name}, ${candidate.role}.` : "Siapkan pertanyaan berbasis bukti untuk percakapan recruiter."}</p></div><div className="mt-6 flex gap-3 rounded-xl border border-purple-200 bg-purple-50/70 p-4 text-sm text-purple-950"><Sparkles className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="font-semibold">AI draft, editable</p><p className="mt-1 leading-6">Pertanyaan ini adalah rancangan awal untuk membantu recruiter. Edit, hapus, atau tambah pertanyaan sebelum digunakan. Workspace ini bukan sistem assessment kandidat dan tidak menyimpan jawaban atau skor.</p></div></div>{error && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">{error}{dbMode && " Endpoint AI saat ini belum mengizinkan akses recruiter pada database mode; Anda tetap dapat menulis pertanyaan manual."}</div>}<Card className="mt-6"><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Draft questions</CardTitle><p className="mt-1 text-sm text-muted-foreground">Tidak ada autosave atau persisted assessment data pada fase ini.</p></div><Button variant="outline" size="sm" onClick={() => void generate()} disabled={generating || !candidate}>{generating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Generate ulang</Button></CardHeader><CardContent className="space-y-3">{loading ? <div className="rounded-xl bg-muted p-8 text-center text-sm text-muted-foreground" role="status">Menyiapkan konteks kandidat...</div> : questions.map((question, index) => <div key={`${index}-${question}`} className="flex gap-2"><label className="sr-only" htmlFor={`question-${index}`}>Pertanyaan {index + 1}</label><textarea id={`question-${index}`} value={question} onChange={(event) => setQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className="min-h-20 flex-1 rounded-md border bg-transparent p-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]" /><Button variant="ghost" size="icon" aria-label={`Hapus pertanyaan ${index + 1}`} onClick={() => setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4 text-destructive" /></Button></div>)}{!loading && !questions.length && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Belum ada pertanyaan. Tambahkan pertanyaan manual untuk memulai.</div>}<div className="flex flex-wrap gap-2 pt-2"><Button variant="secondary" onClick={() => setQuestions((current) => [...current, ""])}><Plus className="size-4" /> Tambah pertanyaan</Button><Button variant="outline" disabled title="Belum ada persistence assessment pada fase ini"><Save className="size-4" /> Simpan draft <span className="text-xs font-normal">(segera)</span></Button></div></CardContent></Card><p className="mt-5 text-xs leading-5 text-muted-foreground">Source: AI provider yang aktif dan konteks profil kandidat. Limitasi: pertanyaan tidak diverifikasi, tidak menilai respons, dan tidak menjadi keputusan otomatis.</p></main></ProtectedRoute>;
}
