"use client";

/* Recruiter detail composes existing organization-scoped APIs. */

import Link from "next/link";
import { ArrowLeft, Check, ClipboardCheck, Clock3, ExternalLink, Loader2, Send, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import { createDemoInvitation, getDemoTemplate, listDemoInvitations, listDemoTemplates, type DemoTemplate } from "@/lib/assessment-demo";

type Status = "new" | "shortlisted" | "consent_requested" | "consent_approved" | "screening" | "assessment" | "review" | "interview" | "offer" | "hired" | "rejected" | "withdrawn";
type Application = { id: string; jobId: string; status: Status; coverNote: string | null; submittedAt: string; updatedAt: string; job?: { id: string; title: string; organizationName: string }; candidate?: { name: string | null; headline: string | null; location: string | null } | null };
type History = { id: string; fromStatus: Status | null; toStatus: Status; reason: string | null; createdAt: string };
type Invitation = { id: string; applicationId: string; templateId: string; templateName: string; status: string; sentAt: string; expiresAt: string | null; attempt?: { id: string; status: string } | null };
type TemplateOption = Pick<DemoTemplate, "id" | "name" | "description" | "timeLimitMinutes" | "attemptLimit"> & { invitationCount?: number };

const statusLabels: Record<Status, string> = { new: "New", shortlisted: "Shortlisted", consent_requested: "Consent requested", consent_approved: "Consent approved", screening: "Screening", assessment: "Assessment", review: "Review", interview: "Interview", offer: "Offer", hired: "Hired", rejected: "Rejected", withdrawn: "Withdrawn" };
const invitationLabels: Record<string, string> = { pending: "Menunggu kandidat", started: "Sedang dikerjakan", submitted: "Terkirim", expired: "Kedaluwarsa", revoked: "Dicabut" };
function date(value: string | null | undefined) { return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "-"; }
function badge(label: string, tone = "bg-secondary text-secondary-foreground") { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>; }
function State({ children, error = false }: { children: React.ReactNode; error?: boolean }) { return <div className={`rounded-xl border p-8 text-center text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "text-muted-foreground"}`} role={error ? "alert" : "status"}>{children}</div>; }

export function RecruiterApplicationDetail({ applicationId }: { applicationId: string }) {
  const { dbMode } = useApp();
  const [application, setApplication] = useState<Application | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError(null);
      try {
        if (!dbMode) {
          const stored = JSON.parse(localStorage.getItem("proofylink-demo-applications") ?? "[]") as Application[];
          const found = stored.find((item) => item.id === applicationId) ?? (applicationId === "demo-application-1" ? { id: "demo-application-1", jobId: "demo-job-1", status: "assessment" as const, coverNote: "Kandidat demo untuk memeriksa alur reviewer.", submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), job: { id: "demo-job-1", title: "Senior Product Designer", organizationName: "ProofyLink Demo" }, candidate: { name: "Nadia Putri Rahayu", headline: "Senior Product Designer", location: "Jakarta Selatan" } } : null);
          if (active) { setApplication(found); setHistory(found ? [{ id: `${found.id}-history`, fromStatus: null, toStatus: found.status, reason: "Lamaran tersedia di mode demo.", createdAt: found.submittedAt }] : []); setInvitations(listDemoInvitations().filter((item) => item.applicationId === applicationId).map((item) => ({ ...item, sentAt: item.startedAt ?? new Date().toISOString(), attempt: item.attemptId ? { id: item.attemptId, status: item.status } : null }))); setTemplates(listDemoTemplates()); }
          return;
        }
        const [appResponse, inviteResponse, templateResponse] = await Promise.all([fetch(`/api/applications/${applicationId}`, { cache: "no-store" }), fetch("/api/assessment-invitations", { cache: "no-store" }), fetch("/api/assessment-templates", { cache: "no-store" })]);
        const appData = await appResponse.json() as { application?: Application; history?: History[]; error?: string };
        const inviteData = await inviteResponse.json() as { invitations?: Invitation[]; error?: string };
        const templateData = await templateResponse.json() as { templates?: TemplateOption[]; error?: string };
        if (!appResponse.ok || !appData.application) throw new Error(appData.error ?? "Aplikasi tidak ditemukan.");
        if (!inviteResponse.ok) throw new Error(inviteData.error ?? "Invitation belum dapat dimuat.");
        if (!templateResponse.ok) throw new Error(templateData.error ?? "Template belum dapat dimuat.");
        if (active) { setApplication(appData.application); setHistory(appData.history ?? []); setInvitations((inviteData.invitations ?? []).filter((item) => item.applicationId === applicationId)); setTemplates(templateData.templates ?? []); }
      } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : "Detail aplikasi belum dapat dimuat."); }
      finally { if (active) setLoading(false); }
    }
    void load(); return () => { active = false; };
  }, [applicationId, dbMode]);

  const sendInvitation = async () => {
    if (!selectedTemplate || !application) return;
    setInviting(true); setError(null);
    try {
      if (!dbMode) {
        const template = getDemoTemplate(selectedTemplate); if (!template) throw new Error("Template demo tidak ditemukan.");
        const invitation = createDemoInvitation(template); setInvitations((current) => [{ ...invitation, sentAt: new Date().toISOString(), attempt: null }, ...current]);
        toast.success("Invitation demo dibuat", { description: "Data ini hanya tersimpan di browser ini." });
      } else {
        const response = await fetch("/api/assessment-invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId: application.id, assessmentTemplateId: selectedTemplate }) });
        const payload = await response.json() as { invitation?: Invitation; error?: string }; if (!response.ok || !payload.invitation) throw new Error(payload.error ?? "Invitation assessment belum dapat dibuat.");
        const template = templates.find((item) => item.id === selectedTemplate); const created = payload.invitation; setInvitations((current) => [{ id: created.id, applicationId: created.applicationId, templateId: created.templateId, templateName: template?.name ?? "Assessment", status: created.status, sentAt: new Date().toISOString(), expiresAt: created.expiresAt, attempt: null }, ...current]); toast.success("Invitation assessment terkirim");
      }
      setSelectedTemplate("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Invitation assessment belum dapat dibuat."); }
    finally { setInviting(false); }
  };

  return <ProtectedRoute role="recruiter"><main className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
    <Link href="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ArrowLeft className="size-4" /> Kembali ke Jobs</Link>
    {loading ? <div className="mt-8"><State><Loader2 className="mx-auto size-5 animate-spin" /><span className="mt-2 block">Memuat detail aplikasi...</span></State></div> : error && !application ? <div className="mt-8"><State error>{error}</State></div> : !application ? <div className="mt-8"><State error>Aplikasi tidak ditemukan atau tidak termasuk organisasi Anda.</State></div> : <>
      <header className="mt-7 flex flex-col justify-between gap-5 border-b pb-7 sm:flex-row sm:items-end"><div><p className="font-mono text-xs uppercase tracking-widest text-primary">Recruiter / application detail</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{application.job?.title ?? "Application"}</h1><p className="mt-2 text-muted-foreground">{application.job?.organizationName ?? "Organisasi"}</p></div>{badge(statusLabels[application.status], "bg-indigo-50 text-indigo-800")}</header>
      {!dbMode && <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">Demo mode: application dan invitation demo tidak masuk database.</p>}
      {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p>}
      <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_360px]"><div className="space-y-5">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="size-5 text-primary" /> Candidate identity</CardTitle></CardHeader><CardContent><p className="text-xl font-semibold">{application.candidate?.name ?? "Nama kandidat tidak tersedia"}</p><p className="mt-1 text-sm text-muted-foreground">{application.candidate?.headline ?? "Headline belum tersedia"}</p><p className="mt-2 text-sm text-muted-foreground">{application.candidate?.location ?? "Lokasi belum tersedia"}</p><dl className="mt-5 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Submitted</dt><dd className="mt-1 font-mono text-xs">{date(application.submittedAt)}</dd></div><div><dt className="text-muted-foreground">Updated</dt><dd className="mt-1 font-mono text-xs">{date(application.updatedAt)}</dd></div></dl></CardContent></Card>
        <Card><CardHeader><CardTitle>Stage history</CardTitle></CardHeader><CardContent>{history.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada histori tahap.</p> : <div className="space-y-5">{history.map((item, index) => <div key={item.id} className="flex gap-3"><div className="flex flex-col items-center"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-primary"><Check className="size-4" /></span>{index < history.length - 1 && <span className="mt-1 h-full w-px bg-border" />}</div><div className="pb-2"><p className="font-semibold">{statusLabels[item.toStatus]}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{date(item.createdAt)}</p>{item.reason && <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.reason}</p>}</div></div>)}</div>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Cover note</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{application.coverNote || "Kandidat tidak menambahkan cover note."}</p></CardContent></Card>
      </div><div className="space-y-5">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Send className="size-5 text-primary" /> Kirim assessment invitation</CardTitle><p className="text-sm text-muted-foreground">Pilih template milik organisasi Anda. Invitation baru hanya dibuat setelah dikirim.</p></CardHeader><CardContent><label htmlFor="assessment-template" className="text-sm font-semibold">Assessment template<select id="assessment-template" name="assessmentTemplateId" value={selectedTemplate} onChange={(event) => setSelectedTemplate(event.target.value)} className="mt-2 h-11 w-full rounded-md border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Pilih template...</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>{templates.length === 0 && <p className="mt-3 text-sm text-amber-800">Belum ada template organisasi. Buat template terlebih dahulu.</p>}<Button className="mt-4 w-full" onClick={() => void sendInvitation()} disabled={!selectedTemplate || inviting}>{inviting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}{inviting ? "Mengirim..." : "Kirim invitation"}</Button></CardContent></Card>
        <Card><CardHeader><CardTitle>Assessment invitations</CardTitle></CardHeader><CardContent>{invitations.length === 0 ? <div className="py-3 text-center"><ClipboardCheck className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 text-sm font-semibold">Belum ada invitation</p><p className="mt-1 text-xs text-muted-foreground">Invitation yang dibuat untuk aplikasi ini akan tampil di sini.</p></div> : <div className="space-y-4">{invitations.map((invite) => <div key={invite.id} className="rounded-lg border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{invite.templateName}</p><p className="mt-1 text-xs text-muted-foreground">Dikirim {date(invite.sentAt)}</p></div>{badge(invitationLabels[invite.status] ?? invite.status)}</div>{invite.attempt?.id && <Link href={`/recruiter/assessments/attempts/${invite.attempt.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Buka review attempt <ExternalLink className="size-3.5" /></Link>}</div>)}</div>}</CardContent></Card>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><div className="flex gap-2"><Clock3 className="mt-0.5 size-4 shrink-0" /><p>Assessment tidak menghasilkan score otomatis. Attempt yang terkirim menunggu <strong>Pending human/AI review</strong>.</p></div></div>
      </div></div>
    </>}</main></ProtectedRoute>;
}
