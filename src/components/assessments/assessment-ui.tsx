"use client";
/* Assessment screens hydrate from the explicit demo store or API responses. */
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Check, Clock3, FileQuestion, Plus, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import { createDemoInvitation, getDemoInvitation, getDemoTemplate, listDemoInvitations, listDemoTemplates, saveDemoAnswer, saveDemoTemplate, startDemoAttempt, submitDemoAttempt, type DemoQuestion, type DemoTemplate } from "@/lib/assessment-demo";

type DraftQuestion = { id?: string; type: DemoQuestion["type"]; prompt: string; options: string; required: boolean };
const emptyQuestion = (): DraftQuestion => ({ type: "free_text", prompt: "", options: "", required: true });
const labels: Record<DemoQuestion["type"], string> = { multiple_choice: "Pilihan ganda", free_text: "Jawaban bebas", situational: "Situasional", structured_response: "Jawaban terstruktur" };

function Shell({ children, title, description, back }: { children: ReactNode; eyebrow?: string; title: string; description?: string; back?: string }) {
  return <main className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">{back && <Link href={back} className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Kembali</Link>}<h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>{description && <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>}{children}</main>;
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return <label className="block text-sm font-medium">{label}<input className="mt-2 h-10 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

export function RecruiterAssessmentList() {
  const { dbMode } = useApp(); const [templates, setTemplates] = useState<DemoTemplate[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { if (!dbMode) { setTemplates(listDemoTemplates()); setLoading(false); return; } void fetch("/api/assessment-templates").then((response) => response.json()).then((data) => setTemplates(data.templates ?? [])).finally(() => setLoading(false)); }, [dbMode]);
  return <Shell eyebrow="Recruiter / assessments" title="Assessment yang siap dipakai" description="Susun pertanyaan yang konsisten, lalu kirim untuk dijawab kandidat. Semua jawaban masuk sebagai pending review; belum ada AI scoring."><div className="mt-8 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{templates.length} template</p><Button asChild><Link href="/recruiter/assessments/new"><Plus className="size-4" /> Buat template</Link></Button></div>{loading ? <p role="status" className="mt-8 text-sm text-muted-foreground">Memuat template...</p> : templates.length === 0 ? <Card className="mt-6"><CardContent className="flex flex-col items-center gap-3 py-14 text-center"><FileQuestion className="size-10 text-muted-foreground" /><p className="font-semibold">Belum ada template</p><p className="text-sm text-muted-foreground">Mulai dari satu pertanyaan yang jelas.</p></CardContent></Card> : <div className="mt-6 grid gap-4 md:grid-cols-2">{templates.map((template) => <Card key={template.id}><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle className="text-lg">{template.name}</CardTitle><span className="text-xs text-muted-foreground">Human review</span></div><p className="text-sm text-muted-foreground">{template.description || "Tanpa deskripsi"}</p></CardHeader><CardContent><div className="flex items-center justify-between text-sm text-muted-foreground"><span>{template.questions?.length ?? 0} pertanyaan</span><span>{template.invitationCount ?? 0} invitation</span></div><Button className="mt-5 w-full" variant="outline" asChild><Link href={`/recruiter/assessments/${template.id}`}>Kelola template</Link></Button></CardContent></Card>)}</div>}</Shell>;
}

export function RecruiterAssessmentEditor({ templateId }: { templateId?: string }) {
  const router = useRouter(); const { dbMode } = useApp(); const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [timeLimit, setTimeLimit] = useState(""); const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]); const [invitationCount, setInvitationCount] = useState(0); const [loading, setLoading] = useState(Boolean(templateId)); const [saving, setSaving] = useState(false);
  useEffect(() => { if (!templateId) return; if (!dbMode) { const template = getDemoTemplate(templateId); if (template) { setName(template.name); setDescription(template.description); setTimeLimit(template.timeLimitMinutes?.toString() ?? ""); setInvitationCount(template.invitationCount); setQuestions(template.questions.map((question) => ({ id: question.id, type: question.type, prompt: question.prompt, options: question.options.join("\n"), required: question.required }))); } setLoading(false); return; } void fetch(`/api/assessment-templates/${templateId}`).then((response) => response.json()).then((data) => { const template = data.template; if (template) { setName(template.name); setDescription(template.description ?? ""); setTimeLimit(template.timeLimitMinutes?.toString() ?? ""); setInvitationCount(template.invitationCount ?? 0); setQuestions(template.questions.map((question: { id: string; type: DemoQuestion["type"]; prompt: string; options: string[]; isRequired: boolean }) => ({ id: question.id, type: question.type, prompt: question.prompt, options: question.options.join("\n"), required: question.isRequired }))); } }).finally(() => setLoading(false)); }, [dbMode, templateId]);
  const updateQuestion = (index: number, patch: Partial<DraftQuestion>) => setQuestions((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const save = async () => { if (!name.trim() || questions.some((question) => question.prompt.trim().length < 5)) { toast.error("Lengkapi nama dan semua pertanyaan."); return; } if (invitationCount) { toast.error("Template terkunci setelah invitation dibuat."); return; } setSaving(true); const payload = { name, description, timeLimitMinutes: timeLimit ? Number(timeLimit) : null, attemptLimit: 1, questions: questions.map((question, order) => ({ id: question.id, type: question.type, prompt: question.prompt, options: question.type === "multiple_choice" ? question.options.split("\n").map((option) => option.trim()).filter(Boolean) : [], required: question.required, order })) }; try { if (!dbMode) { saveDemoTemplate({ ...payload, questions: payload.questions.map((question) => ({ id: question.id ?? `demo-question-${crypto.randomUUID()}`, type: question.type, prompt: question.prompt, options: question.options, required: question.required, order: question.order })) }); toast.success("Template tersimpan di mode demo"); router.push("/recruiter/assessments"); return; } const response = await fetch(templateId ? `/api/assessment-templates/${templateId}` : "/api/assessment-templates", { method: templateId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); toast.success("Template tersimpan"); router.push(`/recruiter/assessments/${data.template?.id ?? templateId}`); } catch (error) { toast.error(error instanceof Error ? error.message : "Template belum dapat disimpan."); } finally { setSaving(false); } };
  if (loading) return <Shell eyebrow="Recruiter / assessments" title="Memuat template..."><p role="status" className="mt-8 text-sm text-muted-foreground">Menyiapkan pertanyaan...</p></Shell>;
  return <Shell eyebrow={templateId ? "Template detail" : "New assessment"} title={templateId ? "Edit assessment" : "Buat assessment"} description="Gunakan bahasa yang dapat dijawab kandidat tanpa menebak maksud reviewer." back="/recruiter/assessments"><Card className="mt-8"><CardContent className="space-y-5 p-5 sm:p-6"><Field label="Nama template" value={name} onChange={setName} placeholder="Contoh: Product thinking check-in" /><label className="block text-sm font-medium">Deskripsi<span className="mt-2 block"><textarea className="min-h-24 w-full rounded-md border bg-transparent p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Apa yang ingin dipahami reviewer?" /></span></label><Field label="Batas waktu (menit, opsional)" value={timeLimit} onChange={setTimeLimit} placeholder="20" type="number" /><div className="border-t pt-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Pertanyaan</h2><p className="text-sm text-muted-foreground">Maksimal 50 pertanyaan. Pilihan ganda maksimal 10 opsi.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setQuestions((items) => [...items, emptyQuestion()])}><Plus className="size-4" /> Tambah</Button></div><div className="mt-4 space-y-4">{questions.map((question, index) => <div key={question.id ?? index} className="rounded-lg border bg-muted/20 p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs text-muted-foreground">Pertanyaan {String(index + 1).padStart(2, "0")}</span>{questions.length > 1 && <button type="button" aria-label={`Hapus pertanyaan ${index + 1}`} className="rounded-md p-1 text-muted-foreground hover:text-destructive" onClick={() => setQuestions((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></button>}</div><label className="block text-sm font-medium">Pertanyaan<span className="mt-2 block"><textarea aria-label={`Pertanyaan ${index + 1}`} className="min-h-20 w-full rounded-md border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={question.prompt} onChange={(event) => updateQuestion(index, { prompt: event.target.value })} /></span></label><div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><label className="text-sm font-medium">Tipe<span className="mt-2 block"><select aria-label={`Tipe pertanyaan ${index + 1}`} className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={question.type} onChange={(event) => updateQuestion(index, { type: event.target.value as DemoQuestion["type"] })}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></span></label><label className="flex h-9 items-center gap-2 text-sm"><input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(index, { required: event.target.checked })} /> Wajib dijawab</label></div>{question.type === "multiple_choice" && <label className="mt-3 block text-sm font-medium">Opsi, satu per baris<span className="mt-2 block"><textarea aria-label={`Opsi pertanyaan ${index + 1}`} className="min-h-20 w-full rounded-md border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={question.options} onChange={(event) => updateQuestion(index, { options: event.target.value })} /></span></label>}</div>)}</div></div><div className="flex flex-wrap justify-end gap-3"><Button variant="outline" asChild><Link href="/recruiter/assessments">Batal</Link></Button><Button onClick={save} disabled={saving || Boolean(invitationCount)}><Save className="size-4" />{saving ? "Menyimpan..." : "Simpan template"}</Button></div></CardContent></Card></Shell>;
}

export function RecruiterAssessmentDetail({ templateId }: { templateId: string }) { const { dbMode } = useApp(); const [template, setTemplate] = useState<DemoTemplate | null>(null); useEffect(() => { if (!dbMode) setTemplate(getDemoTemplate(templateId)); else void fetch(`/api/assessment-templates/${templateId}`).then((response) => response.json()).then((data) => setTemplate(data.template)); }, [dbMode, templateId]); if (!template) return <Shell eyebrow="Template detail" title="Template tidak ditemukan"><p className="mt-6 text-muted-foreground">Periksa kembali tautan assessment.</p></Shell>; const invite = async () => { if (!dbMode) { createDemoInvitation(template); toast.success("Invitation demo dibuat untuk Nadia"); return; } toast.info("Action invite persisted tersedia dari detail aplikasi recruiter."); }; return <Shell eyebrow="Recruiter / template" title={template.name} description={template.description} back="/recruiter/assessments"><div className="mt-8 grid gap-5 md:grid-cols-[1fr_280px]"><Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Pertanyaan</CardTitle><span className="text-sm text-muted-foreground">{template.questions.length} total</span></div></CardHeader><CardContent className="space-y-3">{template.questions.map((question, index) => <div key={question.id} className="rounded-lg border p-4"><div className="flex gap-3"><span className="text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><div><p className="font-medium">{question.prompt}</p><p className="mt-2 text-xs text-muted-foreground">{labels[question.type]} · {question.required ? "Wajib" : "Opsional"}</p></div></div></div>)}</CardContent></Card><div className="space-y-4"><Card><CardContent className="space-y-4 p-5"><p className="text-sm text-muted-foreground">{template.invitationCount} invitation dibuat</p><Button className="w-full" onClick={invite}><Send className="size-4" /> Buat invitation demo</Button>{template.invitationCount > 0 && <p className="text-xs text-amber-700">Template dikunci setelah invitation dibuat.</p>}</CardContent></Card><Button className="w-full" variant="outline" asChild><Link href={`/recruiter/assessments/${template.id}/edit`}>Edit pertanyaan</Link></Button></div></div></Shell>; }

export function CandidateAssessmentList() {
  const { dbMode } = useApp();
  const [invitations, setInvitations] = useState<ReturnType<typeof listDemoInvitations>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dbMode) {
      setInvitations(listDemoInvitations());
      setLoading(false);
      return;
    }
    void fetch("/api/assessment-invitations")
      .then((response) => response.json())
      .then((data) => setInvitations(data.invitations ?? []))
      .finally(() => setLoading(false));
  }, [dbMode]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Asesmen Kompetensi
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">
          Kerjakan evaluasi teknis dan situasional yang dikirimkan oleh rekruter untuk memvalidasi kesiapan peranmu.
        </p>
      </div>

      {loading ? (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Memuat daftar asesmen...
          </CardContent>
        </Card>
      ) : invitations.length === 0 ? (
        <Card className="border-dashed border-border bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FileQuestion className="size-6" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-foreground">Belum Ada Undangan Asesmen</h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-md leading-relaxed">
              Ketika rekruter mengundangmu untuk mengerjakan tes kualifikasi pada lamaran yang aktif, tautan tes akan muncul di sini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {invitations.map((invite) => {
            const isSubmitted = invite.status === "submitted";
            const isStarted = invite.status === "started";

            return (
              <Card key={invite.id} className="border-border/80 bg-card shadow-xs transition-all hover:border-primary/40">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        {invite.templateName}
                      </CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Kandidat: <span className="font-medium text-foreground">{invite.candidateName}</span>
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        isSubmitted
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isStarted
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {isSubmitted ? "Terkirim ✓" : isStarted ? "Sedang Berlangsung" : "Menunggu Dikerjakan"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5" />
                    <span>Evaluasi Human-Reviewed</span>
                  </div>
                  <Button
                    size="sm"
                    variant={isSubmitted ? "outline" : "default"}
                    asChild
                    className="text-xs font-semibold"
                  >
                    <Link href={`/candidate/assessments/${invite.id}`}>
                      {isStarted ? "Lanjutkan Tes" : isSubmitted ? "Tinjau Status" : "Mulai Asesmen"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CandidateAssessmentDetail({ invitationId }: { invitationId: string }) {
  const { dbMode } = useApp();
  const [invitation, setInvitation] = useState<ReturnType<typeof getDemoInvitation>>(null);
  const [template, setTemplate] = useState<DemoTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    if (!dbMode) {
      const invite = getDemoInvitation(invitationId);
      setInvitation(invite);
      if (invite) {
        const tmpl = getDemoTemplate(invite.templateId);
        setTemplate(tmpl);
        setAnswers(invite.answers ?? {});
        setAttemptId(invite.attemptId ?? null);
        setSubmitted(invite.status === "submitted");
        if (tmpl?.timeLimitMinutes && invite.status !== "submitted") {
          setTimeLeft(tmpl.timeLimitMinutes * 60);
        }
      }
      return;
    }

    void fetch("/api/assessment-invitations")
      .then((response) => response.json())
      .then((data) => {
        const invite = data.invitations?.find((item: { id: string }) => item.id === invitationId);
        setInvitation(invite ?? null);
        if (invite?.attempt?.id) {
          setAttemptId(invite.attempt.id);
          return fetch(`/api/assessment-attempts/${invite.attempt.id}`);
        }
        return null;
      })
      .then((response) => response?.json())
      .then((data) => {
        if (data?.template) {
          setTemplate(data.template);
          if (data.template.timeLimitMinutes && data?.attempt?.status !== "submitted") {
            setTimeLeft(data.template.timeLimitMinutes * 60);
          }
        }
        if (data?.answers) {
          setAnswers(
            Object.fromEntries(
              data.answers.map((answer: { questionId: string; response: unknown }) => [
                answer.questionId,
                answer.response,
              ])
            )
          );
        }
        if (data?.attempt?.status === "submitted") setSubmitted(true);
      });
  }, [dbMode, invitationId]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted || !attemptId) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, submitted, attemptId]);

  const start = async () => {
    if (!invitation) return;
    if (!dbMode) {
      const next = startDemoAttempt(invitation.id);
      if (next) {
        setInvitation(next);
        setAttemptId(next.attemptId ?? null);
        const tmpl = getDemoTemplate(next.templateId);
        setTemplate(tmpl);
        if (tmpl?.timeLimitMinutes) setTimeLeft(tmpl.timeLimitMinutes * 60);
      }
      return;
    }
    const response = await fetch("/api/assessment-attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error);
      return;
    }
    setAttemptId(data.attempt.id);
    const detail = await fetch(`/api/assessment-attempts/${data.attempt.id}`).then((result) => result.json());
    setTemplate(detail.template);
    setAnswers(
      Object.fromEntries(
        detail.answers.map((answer: { questionId: string; response: unknown }) => [
          answer.questionId,
          answer.response,
        ])
      )
    );
    if (detail.template?.timeLimitMinutes) {
      setTimeLeft(detail.template.timeLimitMinutes * 60);
    }
  };

  const saveAnswer = async (questionId: string, response: unknown) => {
    setAnswers((current) => ({ ...current, [questionId]: response }));
    setLastSaved("Menyimpan...");
    if (!attemptId) return;

    try {
      if (!dbMode) {
        saveDemoAnswer(invitationId, questionId, response);
      } else {
        await fetch(`/api/assessment-attempts/${attemptId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, response }),
        });
      }
      setLastSaved("Tersimpan otomatis");
    } catch {
      setLastSaved("Gagal menyimpan draf");
    }
  };

  const submit = async () => {
    if (!template || template.questions.some((question) => question.required && !String(answers[question.id] ?? "").trim())) {
      toast.error("Harap jawab semua pertanyaan yang bertanda wajib (*)");
      return;
    }
    setSaving(true);
    if (!dbMode) {
      submitDemoAttempt(invitationId);
      setSubmitted(true);
      toast.success("Jawaban asesmen berhasil dikirim!");
    } else if (attemptId) {
      const response = await fetch(`/api/assessment-attempts/${attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submit: true }),
      });
      const data = await response.json();
      if (!response.ok) toast.error(data.error);
      else {
        setSubmitted(true);
        toast.success("Jawaban asesmen berhasil dikirim!");
      }
    }
    setSaving(false);
  };

  if (!invitation) {
    return (
      <div className="space-y-4">
        <Link href="/candidate/assessments" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Kembali ke Daftar Asesmen
        </Link>
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Undangan asesmen tidak ditemukan atau tidak dapat diakses.
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalQuestions = template?.questions?.length || 0;
  const answeredCount = template?.questions?.filter((q) => Boolean(String(answers[q.id] ?? "").trim())).length || 0;
  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
        <Link
          href="/candidate/assessments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" /> Kembali ke Asesmen
        </Link>

        {attemptId && !submitted && (
          <div className="flex items-center gap-4">
            {lastSaved && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Check className="size-3 text-emerald-600" /> {lastSaved}
              </span>
            )}
            {timeLeft !== null && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                  timeLeft < 300
                    ? "bg-red-50 text-red-700 border border-red-200 animate-pulse"
                    : "bg-muted text-foreground"
                }`}
              >
                <Clock3 className="size-3.5" />
                Sisa Waktu: {formatTime(timeLeft)}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {template?.name ?? invitation.templateName}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          {template?.description || "Jawablah dengan jujur sesuai pengalaman dan kemampuan Anda."}
        </p>
      </div>

      {submitted ? (
        <Card className="border-emerald-200/80 bg-emerald-50/20 shadow-xs">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
              <Check className="size-8" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-foreground">Jawaban Asesmen Berhasil Dikirim</h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-md leading-relaxed">
              Terima kasih! Jawaban Anda telah tersimpan dengan aman dan saat ini sedang dalam antrean peninjauan oleh tim rekruter.
            </p>
            <Button size="sm" asChild className="mt-6 text-xs font-semibold">
              <Link href="/candidate/applications">Lihat Status Lamaran</Link>
            </Button>
          </CardContent>
        </Card>
      ) : !attemptId ? (
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Clock3 className="size-6" />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground">Petunjuk &amp; Ketentuan Asesmen</h2>
                <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground list-disc pl-4">
                  <li>Jumlah pertanyaan: <span className="font-semibold text-foreground">{totalQuestions} butir</span>.</li>
                  <li>
                    Batas waktu: <span className="font-semibold text-foreground">
                      {template?.timeLimitMinutes ? `${template.timeLimitMinutes} menit` : "Tidak ada batas waktu"}
                    </span>.
                  </li>
                  <li>Jawaban Anda akan tersimpan otomatis saat Anda mengetik.</li>
                  <li>Pastikan koneksi internet stabil sebelum menekan tombol mulai.</li>
                </ul>
              </div>
            </div>
            <Button size="lg" className="w-full sm:w-auto text-sm font-semibold" onClick={start}>
              Mulai Mengerjakan Asesmen Sekarang
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progres Pengerjaan</span>
              <span className="font-semibold font-mono text-foreground">
                {answeredCount} dari {totalQuestions} terjawab ({progressPct}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {template?.questions.map((question, index) => {
              const currentVal = String(answers[question.id] ?? "");
              const isFilled = Boolean(currentVal.trim());

              return (
                <Card
                  key={question.id}
                  className={`border transition-all ${
                    isFilled ? "border-border/80 bg-card" : "border-amber-200/80 bg-card shadow-2xs"
                  }`}
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-mono font-bold text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground leading-relaxed">
                          {question.prompt}
                          {question.required && <span className="text-destructive ml-1">*</span>}
                        </p>
                      </div>
                    </div>

                    {question.type === "multiple_choice" ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 pt-2">
                        {question.options.map((option) => {
                          const selected = currentVal === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => void saveAnswer(question.id, option)}
                              className={`flex items-center justify-between p-3 rounded-lg border text-xs font-medium text-left transition-all ${
                                selected
                                  ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20 font-semibold"
                                  : "border-border bg-card text-foreground hover:bg-muted/50"
                              }`}
                            >
                              <span>{option}</span>
                              {selected && <Check className="size-3.5 shrink-0 text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <textarea
                        aria-label={question.prompt}
                        className="min-h-28 w-full rounded-md border border-border bg-background p-3 text-xs sm:text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                        value={currentVal}
                        onChange={(event) => void saveAnswer(question.id, event.target.value)}
                        placeholder="Tuliskan jawaban lengkap Anda di sini..."
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t pt-5">
            <p className="text-xs text-muted-foreground">
              Periksa kembali seluruh jawaban sebelum mengirimkan hasil akhir.
            </p>
            <Button
              size="lg"
              className="w-full sm:w-auto text-xs font-semibold gap-2"
              onClick={submit}
              disabled={saving}
            >
              <Send className="size-4" />
              {saving ? "Mengirimkan..." : "Kirim Semua Jawaban Asesmen"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

