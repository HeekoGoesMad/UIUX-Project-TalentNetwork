"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { ArrowLeft, Calendar, Check, Clock3, Send, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import { downloadIcsFile } from "@/lib/calendar";
import { DEMO_CANDIDATE_CV } from "@/lib/demo-seed";
import { DEMO_JOBS, type Job } from "@/lib/jobs";

export const applicationStatuses = ["new", "shortlisted", "consent_requested", "consent_approved", "screening", "assessment", "review", "interview", "offer", "hired", "rejected", "withdrawn"] as const;
export type ApplicationStatus = (typeof applicationStatuses)[number];
export type Application = { id: string; jobId: string; status: ApplicationStatus; coverNote: string | null; submittedAt: string; withdrawnAt: string | null; updatedAt: string; job?: { id: string; title: string; organizationName: string }; candidate?: { name: string | null; headline: string | null; location: string | null } | null };
type History = { id: string; fromStatus: ApplicationStatus | null; toStatus: ApplicationStatus; reason: string | null; changedBy: string; createdAt: string };
const labels: Record<ApplicationStatus, string> = { new: "New", shortlisted: "Shortlisted", consent_requested: "Consent requested", consent_approved: "Consent approved", screening: "Screening", assessment: "Assessment", review: "Sedang Ditinjau", interview: "Interview", offer: "Offer", hired: "Hired", rejected: "Rejected", withdrawn: "Withdrawn" };
const activeStatuses = applicationStatuses.filter((status) => status !== "withdrawn");
const stageColors: Record<ApplicationStatus, string> = { new: "bg-muted text-muted-foreground", shortlisted: "bg-muted text-muted-foreground", consent_requested: "bg-muted text-muted-foreground", consent_approved: "bg-muted text-muted-foreground", screening: "bg-muted text-muted-foreground", assessment: "bg-muted text-muted-foreground", review: "bg-muted text-muted-foreground", interview: "bg-primary/10 text-primary", offer: "bg-emerald-50 text-emerald-700", hired: "bg-emerald-50 text-emerald-700", rejected: "bg-red-50 text-red-700", withdrawn: "bg-muted text-muted-foreground" };

export const storageKey = "proofylink-demo-applications";
export function demoApplications(): Application[] { try { return JSON.parse(localStorage.getItem(storageKey) ?? "[]") as Application[]; } catch { return []; } }
export function saveDemoApplication(application: Application) { localStorage.setItem(storageKey, JSON.stringify([...demoApplications().filter((item) => item.id !== application.id), application])); }
function statusBadge(status: ApplicationStatus) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stageColors[status]}`}>{labels[status]}</span>; }
function State({ text, error = false }: { text: string; error?: boolean }) { return <div className={`rounded-2xl border p-8 text-center text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "bg-card text-muted-foreground"}`} role={error ? "alert" : "status"}>{text}</div>; }
export function useApplications() {
  const { dbMode } = useApp();
  const [applications, setApplications] = useState<Application[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [attempt, setAttempt] = useState(0);
  useEffect(() => { let active = true; setLoading(true); setError(null); if (!dbMode) { setApplications(demoApplications()); setLoading(false); return () => { active = false; }; } fetch("/api/applications", { cache: "no-store" }).then(async (response) => { const payload = await response.json() as { applications?: Application[]; error?: string }; if (!response.ok) throw new Error(payload.error ?? "Aplikasi belum dapat dimuat."); if (active) setApplications(payload.applications ?? []); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Aplikasi belum dapat dimuat."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [dbMode, attempt]);
  return { applications, setApplications, loading, error, dbMode, retry: () => setAttempt((count) => count + 1) };
}

export function CandidateApplicationsPage() {
  const { applications, loading, error, dbMode, retry } = useApplications();
  const [filter, setFilter] = useState<"all" | "active" | "interview" | "offer" | "rejected">("all");
  const chips = [{ id: "all", label: "Semua" }, { id: "active", label: "Aktif" }, { id: "interview", label: "Wawancara" }, { id: "offer", label: "Penawaran" }, { id: "rejected", label: "Ditolak" }] as const;
  const filtered = useMemo(() => applications.filter((item) => { if (filter === "all") return true; if (filter === "active") return ["new", "shortlisted", "consent_requested", "consent_approved", "screening", "assessment", "review"].includes(item.status); if (filter === "interview") return item.status === "interview"; if (filter === "offer") return item.status === "offer" || item.status === "hired"; return item.status === "rejected" || item.status === "withdrawn"; }), [applications, filter]);
  return <ProtectedRoute role="candidate"><main className="container mx-auto max-w-5xl px-4 py-8 sm:py-12"><Link href="/candidate" className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="size-4" /> Candidate workspace</Link><div className="mt-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="font-mono text-xs uppercase tracking-widest text-primary">Candidate workspace</p><h1 className="mt-2 text-3xl font-bold">Aplikasi saya</h1><p className="mt-2 text-muted-foreground">Pantau status lamaran Anda.</p></div><Button asChild variant="outline"><Link href="/jobs"><Send className="size-4" /> Cari lowongan</Link></Button></div>{!dbMode && <p className="mt-5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">Mode demo: aplikasi hanya tersimpan di browser ini dan tidak membuat data palsu.</p>}<div className="mt-6 flex flex-wrap gap-2">{chips.map((chip) => <button key={chip.id} type="button" onClick={() => setFilter(chip.id)} className={filter === chip.id ? "inline-flex rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground" : "inline-flex rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground"}>{chip.label}</button>)}</div><div className="mt-8">{loading ? <State text="Memuat aplikasi..." /> : error ? <div className="space-y-3"><State text={error} error /><Button variant="outline" onClick={retry}>Coba lagi</Button></div> : applications.length === 0 ? <State text="Belum ada aplikasi. Temukan lowongan yang sesuai dan kirim lamaran pertamamu." /> : filtered.length === 0 ? <State text="Tidak ada lamaran pada filter ini." /> : <div className="space-y-4">{filtered.map((application) => <Link key={application.id} href={`/candidate/applications/${application.id}`} className="block"><Card className="hover:bg-muted/50"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-lg font-semibold">{application.job?.title ?? "Job"}</p><p className="mt-1 text-sm text-muted-foreground">{application.job?.organizationName ?? "Organisasi"}</p><p className="mt-3 text-xs text-muted-foreground">Dikirim {formatDate(application.submittedAt)}</p></div><div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">{statusBadge(application.status)}<span className="text-xs font-semibold text-primary">Lihat detail -&gt;</span></div></CardContent></Card></Link>)}</div>}</div></main></ProtectedRoute>;
}

export function CandidateApplicationDetailPage({ applicationId }: { applicationId: string }) {
  const { dbMode } = useApp();
  const [application, setApplication] = useState<Application | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Hiring Flow: Interviews & Offers
  const [interviews, setInterviews] = useState<Array<{ id: string; title: string; scheduledAt: string; timezone: string; durationMinutes: number; meetingUrl: string | null; status: string }>>([]);
  const [offers, setOffers] = useState<Array<{ id: string; salary: number; currency: string; startDate: string; expirationDate: string; benefits: string | null; notes: string | null; status: string }>>([]);
  const [actingOfferId, setActingOfferId] = useState<string | null>(null);
  const [offerNotice, setOfferNotice] = useState<string | null>(null);
  const [interviewsError, setInterviewsError] = useState<string | null>(null);
  const [offersError, setOffersError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!dbMode) {
      const item = demoApplications().find((candidateApplication) => candidateApplication.id === applicationId) ?? null;
      setApplication(item);
      setHistory(item ? [{ id: `${item.id}-history`, fromStatus: null, toStatus: "new", reason: "Lamaran dikirim kandidat.", changedBy: "demo", createdAt: item.submittedAt }] : []);
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`/api/applications/${applicationId}`, { cache: "no-store" }),
      fetch(`/api/interviews?applicationId=${encodeURIComponent(applicationId)}`, { cache: "no-store" }),
      fetch(`/api/offers?applicationId=${encodeURIComponent(applicationId)}`, { cache: "no-store" }),
    ])
      .then(async ([appRes, intRes, offRes]) => {
        const payload = (await appRes.json()) as { application?: Application; history?: History[]; error?: string };
        if (!appRes.ok || !payload.application) throw new Error(payload.error ?? "Aplikasi tidak ditemukan.");
        setApplication(payload.application);
        setHistory(payload.history ?? []);

        if (intRes.ok) {
          const intData = (await intRes.json()) as { interviews?: typeof interviews };
          setInterviews(intData.interviews ?? []);
          setInterviewsError(null);
        } else {
          setInterviewsError("Jadwal wawancara belum dapat dimuat.");
        }
        if (offRes.ok) {
          const offData = (await offRes.json()) as { offers?: typeof offers };
          setOffers(offData.offers ?? []);
          setOffersError(null);
        } else {
          setOffersError("Penawaran belum dapat dimuat.");
        }
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Aplikasi tidak ditemukan."))
      .finally(() => setLoading(false));
  }, [applicationId, dbMode, reloadKey]);

  const withdraw = async () => {
    if (!application) return;
    setSaving(true);
    setError(null);
    try {
      if (dbMode) {
        const response = await fetch(`/api/applications/${application.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "withdrawn" }),
        });
        const payload = (await response.json()) as { application?: Application; error?: string };
        if (!response.ok || !payload.application) throw new Error(payload.error ?? "Lamaran belum dapat ditarik.");
        setApplication((current) => (current ? { ...current, ...payload.application } : current));
      } else {
        const next = { ...application, status: "withdrawn" as const, withdrawnAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        saveDemoApplication(next);
        setApplication(next);
        setHistory((current) => [...current, { id: `${next.id}-${Date.now()}`, fromStatus: application.status, toStatus: "withdrawn", reason: "Lamaran ditarik kandidat.", changedBy: "demo", createdAt: next.updatedAt }]);
      }
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Lamaran belum dapat ditarik.");
    } finally {
      setSaving(false);
    }
  };

  const handleOfferAction = async (offerId: string, status: "accepted" | "declined") => {
    setActingOfferId(offerId);
    setOfferNotice(null);
    try {
      if (dbMode) {
        const res = await fetch(`/api/offers/${offerId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Gagal memproses keputusan penawaran.");
      }
      setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status } : o)));
      if (status === "accepted") {
        setApplication((prev) => (prev ? { ...prev, status: "hired" } : prev));
        setOfferNotice("Penawaran diterima — status lamaran menjadi Hired.");
        toast.success("Penawaran diterima — selamat!");
      } else {
        setOfferNotice("Penawaran ditolak.");
        toast.success("Penawaran ditolak.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setOfferNotice(message);
      toast.error(message);
    } finally {
      setActingOfferId(null);
    }
  };

  return (
    <ProtectedRoute role="candidate">
      <main className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <Link href="/candidate/applications" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" /> Kembali ke aplikasi
        </Link>
        {loading ? (
          <div className="mt-7"><State text="Memuat detail aplikasi..." /></div>
        ) : error || !application ? (
          <div className="mt-7 space-y-3"><State text={error ?? "Aplikasi tidak ditemukan."} error /><Button asChild variant="outline"><Link href="/candidate/applications">Kembali ke lamaran</Link></Button></div>
        ) : (
          <>
            <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-primary">Application detail</p>
                <h1 className="mt-2 text-3xl font-bold">{application.job?.title}</h1>
                <p className="mt-2 text-muted-foreground">{application.job?.organizationName}</p>
              </div>
              {statusBadge(application.status)}
            </div>

            {/* Incoming Offer Letter (Dover 1-Click Acceptance) */}
            {offers.length > 0 && (
              <div className="mt-8 space-y-4">
                {offers.map((offer) => (
                  <Card key={offer.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Check className="size-4 text-muted-foreground" />
                          Surat Penawaran Kerja (Offer Letter)
                        </CardTitle>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${offer.status === "accepted" ? "bg-emerald-50 text-emerald-700" : offer.status === "declined" ? "bg-red-50 text-red-700" : "bg-muted text-muted-foreground"}`}>
                          {offer.status === "accepted" ? "Diterima (Hired)" : offer.status === "declined" ? "Ditolak" : "Menunggu Konfirmasi"}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border bg-white p-3 dark:bg-slate-900">
                        <div>
                          <p className="text-xs text-muted-foreground">Gaji yang Ditawarkan</p>
                          <p className="mt-1 font-bold text-base">
                            {offer.currency} {Number(offer.salary).toLocaleString("id-ID")} / bulan
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Mulai Bekerja</p>
                          <p className="mt-1 font-semibold text-foreground">{formatDate(offer.startDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Batas Konfirmasi</p>
                          <p className="mt-1 font-semibold text-amber-700 dark:text-amber-400">{formatDate(offer.expirationDate)}</p>
                        </div>
                      </div>

                      {offer.benefits && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">Fasilitas & Benefit:</p>
                          <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-2.5 text-xs text-foreground">
                            {offer.benefits}
                          </p>
                        </div>
                      )}

                      {offer.notes && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">Pesan dari Rekruter:</p>
                          <p className="mt-1 text-xs text-foreground">{offer.notes}</p>
                        </div>
                      )}

                      {offer.status === "pending" && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={actingOfferId === offer.id}
                            onClick={() => void handleOfferAction(offer.id, "accepted")}
                          >
                            <Check className="mr-1.5 size-4" />
                            {actingOfferId === offer.id ? "Memproses..." : "Accept Offer (Terima Pekerjaan)"}
                          </Button>
                          <Button
                            variant="outline"
                            className="text-red-700 border-red-200 hover:bg-red-50"
                            disabled={actingOfferId === offer.id}
                            onClick={() => void handleOfferAction(offer.id, "declined")}
                          >
                            Tolak Penawaran
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {offerNotice && <p role="status" className="text-sm text-muted-foreground">{offerNotice}</p>}
              </div>
            )}
            {offersError && offers.length === 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground"><span>{offersError}</span><Button size="sm" variant="outline" onClick={() => setReloadKey((key) => key + 1)}>Coba lagi</Button></div>
            )}

            {/* Scheduled Interviews Panel */}
            {interviews.length > 0 && (
              <Card className="mt-8">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock3 className="size-4 text-muted-foreground" /> Jadwal Wawancara Anda
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {interviews.map((interview) => (
                    <div key={interview.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-white p-3.5 dark:bg-slate-900">
                      <div>
                        <p className="font-semibold text-foreground">{interview.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(interview.scheduledAt)} ({interview.durationMinutes} menit) · {interview.timezone}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => {
                            downloadIcsFile(
                              {
                                title: `Interview: ${interview.title} - ${application.job?.title || "Posisi"}`,
                                description: `Wawancara dengan ${application.job?.organizationName || "Perusahaan"}.\nTautan meeting: ${interview.meetingUrl || "Google Meet"}`,
                                location: interview.meetingUrl || "Google Meet",
                                start: interview.scheduledAt,
                                timezone: interview.timezone,
                                organizerName: application.job?.organizationName || "Tim Rekruter",
                              },
                              `interview-${application.job?.title ? application.job.title.toLowerCase().replace(/\s+/g, "-") : "job"}.ics`
                            );
                          }}
                        >
                          <Calendar className="size-3.5" />
                          Kalender (.ics)
                        </Button>
                        {interview.meetingUrl && (
                          <Button size="sm" asChild>
                            <a href={interview.meetingUrl} target="_blank" rel="noopener noreferrer">
                              Buka Google Meet / Zoom
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {interviewsError && interviews.length === 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground"><span>{interviewsError}</span><Button size="sm" variant="outline" onClick={() => setReloadKey((key) => key + 1)}>Coba lagi</Button></div>
            )}

            <Card className="mt-8">
              <CardHeader><CardTitle>Perjalanan aplikasi</CardTitle></CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada riwayat — lamaran diterima sistem.</p>
                ) : (
                <div className="space-y-5">
                  {history.map((item, index) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Check className="size-4" />
                        </span>
                        {index < history.length - 1 && <span className="mt-1 h-full w-px bg-border" />}
                      </div>
                      <div className="pb-3">
                        <p className="font-semibold">{labels[item.toStatus]}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                        {item.reason && <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.reason}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-5">
              <CardHeader><CardTitle>Cover note</CardTitle></CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{application.coverNote || "Tidak ada cover note."}</p>
              </CardContent>
            </Card>

            {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
            {canWithdraw(application.status) && (
              <Button variant="outline" className="mt-5 text-destructive" onClick={() => void withdraw()} disabled={saving}>
                <X className="size-4" /> {saving ? "Menarik lamaran..." : "Tarik lamaran"}
              </Button>
            )}
            {(application.status === "rejected" || application.status === "withdrawn") && (
              <div className="mt-5 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">Lamaran ini sudah berakhir. <Link href="/jobs" className="font-semibold text-primary">Lihat lowongan serupa -&gt;</Link></div>
            )}
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}

export function RecruiterPipelinePage({ jobId }: { jobId: string }) {
  const { dbMode } = useApp(); const [job, setJob] = useState<Job | null>(null); const { applications, setApplications, loading, error } = useApplications(); const [reason, setReason] = useState(""); const [updating, setUpdating] = useState<string | null>(null);
  useEffect(() => { if (!dbMode) { setJob(DEMO_JOBS.find((item) => item.id === jobId) ?? null); return; } fetch(`/api/jobs/${jobId}`, { cache: "no-store" }).then(async (response) => { const payload = await response.json() as { job?: Job }; if (!response.ok || !payload.job) throw new Error("Job tidak ditemukan."); setJob(payload.job); }).catch(() => setJob(null)); }, [dbMode, jobId]);
  const visible = useMemo(() => applications.filter((item) => item.jobId === jobId), [applications, jobId]); const grouped = activeStatuses.map((status) => ({ status, items: visible.filter((item) => item.status === status) })).filter((group) => group.items.length > 0);
  const transition = async (application: Application, status: ApplicationStatus) => { setUpdating(application.id); try { if (dbMode) { const response = await fetch(`/api/applications/${application.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, reason: reason || undefined }) }); const payload = await response.json() as { application?: Application; error?: string }; if (!response.ok || !payload.application) throw new Error(payload.error ?? "Status belum dapat diubah."); setApplications((current) => current.map((item) => item.id === application.id ? { ...item, ...payload.application } : item)); } else { const next = { ...application, status, updatedAt: new Date().toISOString() }; saveDemoApplication(next); setApplications((current) => current.map((item) => item.id === application.id ? next : item)); } setReason(""); } catch (reasonError: unknown) { window.alert(reasonError instanceof Error ? reasonError.message : "Status belum dapat diubah."); } finally { setUpdating(null); } };
  return <ProtectedRoute role="recruiter"><main className="container mx-auto max-w-7xl px-4 py-8 sm:py-12"><Link href="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="size-4" /> Jobs</Link><div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono text-xs uppercase tracking-widest text-primary">Recruiter workspace</p><h1 className="mt-2 text-3xl font-bold">Pipeline</h1><p className="mt-2 text-muted-foreground">{job?.title ?? "Job"} {job?.organizationName ? `· ${job.organizationName}` : ""}</p></div><div className="flex items-center gap-2 text-sm text-muted-foreground"><UserRound className="size-4" /> {visible.length} kandidat</div></div><label className="mt-6 block max-w-xl text-sm font-semibold">Alasan perubahan tahap<span className="ml-2 text-xs font-normal text-muted-foreground">(opsional)<textarea value={reason} onChange={(event) => setReason(event.target.value)} className="field mt-2 min-h-20 py-2" placeholder="Catatan untuk histori aplikasi" /></span></label>{loading ? <div className="mt-6"><State text="Memuat pipeline..." /></div> : error ? <div className="mt-6"><State text={error} error /></div> : visible.length === 0 ? <div className="mt-6"><State text="Belum ada aplikasi untuk job ini. Kandidat yang melamar akan muncul di sini." /></div> : <div className="mt-6 grid gap-4 lg:grid-cols-3">{grouped.map((group) => <section key={group.status} className="rounded-2xl border bg-muted/30 p-3"><div className="flex items-center justify-between px-2 py-2"><h2 className="font-semibold">{labels[group.status]}</h2><span className="text-xs text-muted-foreground">{group.items.length}</span></div><div className="space-y-3">{group.items.map((application) => <Card key={application.id}><CardContent className="p-4"><div className="flex items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"><UserRound className="size-4" /></div><div className="min-w-0"><p className="font-semibold">{application.candidate?.name ?? "Kandidat"}</p><p className="mt-1 text-xs text-muted-foreground">{application.candidate?.headline ?? "Profil kandidat"}</p>{application.candidate?.location && <p className="mt-1 text-xs text-muted-foreground">{application.candidate.location}</p>}</div></div><div className="mt-4 flex flex-wrap gap-2"><select aria-label={`Pindahkan aplikasi ${application.id}`} value={application.status} disabled={updating === application.id} onChange={(event) => void transition(application, event.target.value as ApplicationStatus)} className="field h-9 text-xs">{applicationStatuses.map((status) => <option key={status} value={status}>{labels[status]}</option>)}</select><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" /> Histori tersimpan</span></div></CardContent></Card>)}</div></section>)}</div>}</main></ProtectedRoute>;
}

export function ApplyForm({ job }: { job: Job }) {
  const { dbMode } = useApp(); const { applications } = useApplications(); const [coverNote, setCoverNote] = useState(""); const [status, setStatus] = useState<"idle" | "saving" | "success">("idle"); const [error, setError] = useState<string | null>(null);
  const duplicate = applications.find((item) => item.jobId === job.id);
  const apply = async (event: React.FormEvent) => { event.preventDefault(); setError(null); if (duplicate) return; if (coverNote.trim().length < 20) { setError("Cover note minimal 20 karakter."); return; } setStatus("saving"); try { if (dbMode) { const response = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: job.id, coverNote }) }); const payload = await response.json() as { error?: string }; if (!response.ok) throw new Error(payload.error ?? "Lamaran belum dapat dikirim."); } else { const now = new Date().toISOString(); saveDemoApplication({ id: `demo-application-${Date.now()}`, jobId: job.id, status: "new", coverNote: coverNote.trim(), submittedAt: now, withdrawnAt: null, updatedAt: now, job: { id: job.id, title: job.title, organizationName: job.organizationName }, candidate: { name: DEMO_CANDIDATE_CV.fullName, headline: DEMO_CANDIDATE_CV.headline, location: DEMO_CANDIDATE_CV.location } }); } setStatus("success"); } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Lamaran belum dapat dikirim."); setStatus("idle"); } };
  if (status === "success") return <Card className="mt-8 border-emerald-200 bg-emerald-50/60"><CardContent className="flex items-start gap-3 p-5"><Check className="mt-0.5 size-5 text-emerald-700" /><div><p className="font-semibold text-emerald-900">Lamaran terkirim</p><p className="mt-1 text-sm text-emerald-800">Kamu bisa memantau perkembangannya di aplikasi saya.</p><Link href="/candidate/applications" className="mt-3 inline-flex text-sm font-semibold text-primary">Buka aplikasi saya -&gt;</Link></div></CardContent></Card>;
  if (duplicate) return <div className="mt-8 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">Anda sudah melamar lowongan ini. <Link href={`/candidate/applications/${duplicate.id}`} className="font-semibold text-primary">Lihat lamaran -&gt;</Link></div>;
  return <Card className="mt-8"><CardHeader><CardTitle>Kirim lamaran</CardTitle></CardHeader><CardContent><form onSubmit={apply} className="space-y-4"><label className="block text-sm font-semibold" htmlFor="cover-note">Cover note<span className="ml-2 text-xs font-normal text-muted-foreground">20-4.000 karakter</span></label><textarea id="cover-note" value={coverNote} onChange={(event) => setCoverNote(event.target.value)} className="field min-h-32 py-3" placeholder="Ceritakan alasan kamu cocok untuk peran ini." required aria-describedby="cover-note-help" /><p id="cover-note-help" className="text-xs text-muted-foreground">Profil kandidat akan diambil dari profil tersimpan saat lamaran dikirim.</p>{error && <p className="text-sm text-red-700" role="alert">{error}</p>}<Button type="submit" disabled={status === "saving"}>{status === "saving" ? "Mengirim..." : "Kirim lamaran"} <Send className="size-4" /></Button></form></CardContent></Card>;
}

function canWithdraw(status: ApplicationStatus) { return !["hired", "rejected", "withdrawn"].includes(status); }
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
