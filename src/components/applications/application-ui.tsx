"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  Calendar,
  Check,
  Clock3,
  ExternalLink,
  Send,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadIcsFile } from "@/lib/calendar";
import { DEMO_CANDIDATE_CV } from "@/lib/demo-seed";
import { DEMO_JOBS, type Job } from "@/lib/jobs";
import { useApp } from "@/providers/app-provider";

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

  const counts = useMemo(() => {
    return {
      all: applications.length,
      active: applications.filter((a) => ["new", "shortlisted", "consent_requested", "consent_approved", "screening", "assessment", "review"].includes(a.status)).length,
      interview: applications.filter((a) => a.status === "interview").length,
      offer: applications.filter((a) => a.status === "offer" || a.status === "hired").length,
      rejected: applications.filter((a) => a.status === "rejected" || a.status === "withdrawn").length,
    };
  }, [applications]);

  const chips = [
    { id: "all" as const, label: "Semua", count: counts.all },
    { id: "active" as const, label: "Aktif", count: counts.active },
    { id: "interview" as const, label: "Wawancara", count: counts.interview },
    { id: "offer" as const, label: "Penawaran", count: counts.offer },
    { id: "rejected" as const, label: "Selesai / Ditolak", count: counts.rejected },
  ];

  const filtered = useMemo(() => applications.filter((item) => {
    if (filter === "all") return true;
    if (filter === "active") return ["new", "shortlisted", "consent_requested", "consent_approved", "screening", "assessment", "review"].includes(item.status);
    if (filter === "interview") return item.status === "interview";
    if (filter === "offer") return item.status === "offer" || item.status === "hired";
    return item.status === "rejected" || item.status === "withdrawn";
  }), [applications, filter]);

  return (
    <ProtectedRoute role="candidate">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Lamaran Kerja Saya
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              Pantau perkembangan seleksi, jadwal wawancara, dan tawaran kerja aktif Anda.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link href="/jobs">
                <Briefcase className="size-3.5 mr-1.5" />
                Cari Lowongan
              </Link>
            </Button>
            <Button asChild size="sm" className="text-xs font-semibold">
              <Link href="/candidate/cv">
                Perbarui CV
              </Link>
            </Button>
          </div>
        </div>

        {!dbMode && (
          <p className="rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-2 text-xs text-amber-900">
            Mode demo: data aplikasi tersimpan di browser ini.
          </p>
        )}

        {/* Filter Chips with Count Badges */}
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const isActive = filter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{chip.label}</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                  isActive ? "bg-white/20 text-white" : "bg-muted text-foreground"
                }`}>
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Application Cards List */}
        <div className="mt-4">
          {loading ? (
            <State text="Memuat daftar lamaran..." />
          ) : error ? (
            <div className="space-y-3">
              <State text={error} error />
              <Button variant="outline" onClick={retry}>Coba lagi</Button>
            </div>
          ) : applications.length === 0 ? (
            <Card className="border-dashed border-border bg-card/60 p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                <Briefcase className="size-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Belum Ada Lamaran</h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                Profil profesional Anda siap digunakan untuk melamar lowongan kerja terverifikasi di ProofyLink.
              </p>
              <Button asChild className="mt-4 text-xs font-semibold" size="sm">
                <Link href="/jobs">
                  Eksplorasi Lowongan Kerja
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Link>
              </Button>
            </Card>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-border/80 bg-card p-8 text-center text-sm text-muted-foreground">
              Tidak ada lamaran pada filter ini.
            </div>
          ) : (
            <div className="grid gap-3.5">
              {filtered.map((application) => (
                <Link key={application.id} href={`/candidate/applications/${application.id}`} className="block group">
                  <Card className="border-border/80 bg-card transition-all group-hover:border-primary/40 group-hover:shadow-xs">
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                            {application.job?.title ?? "Posisi Lamaran"}
                          </h2>
                        </div>
                        <p className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                          <Building2 className="size-3.5 shrink-0" />
                          <span className="font-medium text-foreground">{application.job?.organizationName ?? "Perusahaan Mitra"}</span>
                          <span aria-hidden="true" className="text-border">•</span>
                          <span>Dikirim {formatDate(application.submittedAt)}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end shrink-0">
                        {statusBadge(application.status)}
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                          Detail Alur Seleksi
                          <ArrowRight className="size-3.5" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
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
      fetch(`/api/interviews?applicationId=${applicationId}`, { cache: "no-store" }),
      fetch(`/api/offers?applicationId=${applicationId}`, { cache: "no-store" }),
    ])
      .then(async ([appRes, intRes, offRes]) => {
        const appData = (await appRes.json()) as { application?: Application; history?: History[]; error?: string };
        if (!appRes.ok || !appData.application) throw new Error(appData.error ?? "Aplikasi tidak ditemukan.");
        setApplication(appData.application);
        setHistory(appData.history ?? []);

        if (intRes.ok) {
          const intData = (await intRes.json()) as { interviews?: typeof interviews };
          setInterviews(intData.interviews ?? []);
        }
        if (offRes.ok) {
          const offData = (await offRes.json()) as { offers?: typeof offers };
          setOffers(offData.offers ?? []);
        }
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Aplikasi tidak ditemukan."))
      .finally(() => setLoading(false));
  }, [applicationId, dbMode]);

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

  // Pipeline phases for candidate visualization
  const PIPELINE_PHASES = [
    { key: "applied", label: "Lamaran Terkirim", desc: "Diterima sistem", statuses: ["new", "shortlisted"] },
    { key: "screening", label: "Skrining Profil", desc: "Consent-first verifikasi", statuses: ["consent_requested", "consent_approved", "screening"] },
    { key: "assessment", label: "Asesmen Kompetensi", desc: "Uji keahlian", statuses: ["assessment", "review"] },
    { key: "interview", label: "Wawancara", desc: "Sesi temu tim", statuses: ["interview"] },
    { key: "decision", label: "Keputusan & Penawaran", desc: "Offer / Hasil", statuses: ["offer", "hired", "rejected"] },
  ];

  const currentPhaseIndex = useMemo(() => {
    if (!application) return 0;
    if (["offer", "hired", "rejected"].includes(application.status)) return 4;
    if (application.status === "interview") return 3;
    if (["assessment", "review"].includes(application.status)) return 2;
    if (["consent_requested", "consent_approved", "screening"].includes(application.status)) return 1;
    return 0;
  }, [application]);

  return (
    <ProtectedRoute role="candidate">
      <div className="space-y-6">
        <div>
          <Link
            href="/candidate/applications"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" /> Kembali ke Daftar Lamaran
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <State text="Memuat rincian alur lamaran..." />
          </div>
        ) : error || !application ? (
          <div className="space-y-4 py-8">
            <State text={error ?? "Aplikasi tidak ditemukan."} error />
            <Button asChild variant="outline" size="sm">
              <Link href="/candidate/applications">Kembali ke Daftar Lamaran</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Summary Banner */}
            <Card className="border-border/80 bg-card shadow-xs">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        {application.job?.title ?? "Posisi Lamaran"}
                      </h1>
                      {statusBadge(application.status)}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs sm:text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <Building2 className="size-3.5" /> {application.job?.organizationName ?? "Perusahaan Mitra"}
                      </span>
                      <span aria-hidden="true" className="text-border">•</span>
                      <span>Dikirim pada {formatDate(application.submittedAt)}</span>
                      {application.updatedAt && (
                        <>
                          <span aria-hidden="true" className="text-border">•</span>
                          <span>Diperbarui {formatDate(application.updatedAt)}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {canWithdraw(application.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => void withdraw()}
                        disabled={saving}
                      >
                        <X className="size-3.5 mr-1" />
                        {saving ? "Memproses..." : "Tarik Lamaran"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dover-Style Visual Hiring Pipeline Stepper */}
            <Card className="border-border/80 bg-card p-5 sm:p-6 shadow-2xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Tahapan Seleksi &amp; Alur Rekrutmen
                  </h2>
                  <span className="text-xs font-medium text-primary">
                    Tahap {currentPhaseIndex + 1} dari 5
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                  {PIPELINE_PHASES.map((phase, idx) => {
                    const isPassed = idx < currentPhaseIndex;
                    const isCurrent = idx === currentPhaseIndex;
                    return (
                      <div
                        key={phase.key}
                        className={`relative flex flex-col rounded-xl border p-3.5 transition-colors ${
                          isCurrent
                            ? "border-primary bg-primary/5 shadow-2xs"
                            : isPassed
                            ? "border-emerald-200 bg-emerald-50/40 text-emerald-950"
                            : "border-border/60 bg-muted/20 text-muted-foreground opacity-75"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isCurrent
                              ? "bg-primary text-primary-foreground"
                              : isPassed
                              ? "bg-emerald-600 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {isPassed ? <Check className="size-3.5" /> : idx + 1}
                          </span>
                          {isCurrent && (
                            <span className="inline-flex size-2 rounded-full bg-primary animate-ping" />
                          )}
                        </div>
                        <p className={`text-xs font-bold truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>
                          {phase.label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                          {phase.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Incoming Offer Letter (Dover 1-Click Acceptance) */}
            {offers.length > 0 && (
              <div className="space-y-4">
                {offers.map((offer) => (
                  <Card key={offer.id} className="border-emerald-200 bg-emerald-50/30 shadow-xs">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-emerald-950 font-bold">
                          <Award className="size-5 text-emerald-600" />
                          Surat Penawaran Kerja (Offer Letter)
                        </CardTitle>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          offer.status === "accepted"
                            ? "bg-emerald-100 text-emerald-800"
                            : offer.status === "declined"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {offer.status === "accepted" ? "Diterima (Hired)" : offer.status === "declined" ? "Ditolak" : "Menunggu Keputusan Anda"}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-emerald-200/80 bg-white p-4 shadow-2xs">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Kompensasi / Gaji Ditawarkan</p>
                          <p className="mt-1 font-bold text-lg text-foreground font-mono">
                            {offer.currency} {Number(offer.salary).toLocaleString("id-ID")} <span className="text-xs font-normal text-muted-foreground font-sans">/ bulan</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Mulai Bekerja</p>
                          <p className="mt-1 font-semibold text-foreground">{formatDate(offer.startDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Batas Konfirmasi Penawaran</p>
                          <p className="mt-1 font-semibold text-amber-700">{offer.expirationDate ? formatDate(offer.expirationDate) : "Sesuai kesepakatan"}</p>
                        </div>
                      </div>

                      {offer.benefits && (
                        <div>
                          <p className="text-xs font-bold text-foreground">Fasilitas &amp; Tunjangan:</p>
                          <p className="mt-1 whitespace-pre-wrap rounded-lg bg-white border border-border/80 p-3 text-xs text-foreground leading-relaxed">
                            {offer.benefits}
                          </p>
                        </div>
                      )}

                      {offer.notes && (
                        <div>
                          <p className="text-xs font-bold text-foreground">Pesan dari Tim Rekruter:</p>
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{offer.notes}</p>
                        </div>
                      )}

                      {offer.status === "pending" && (
                        <div className="flex flex-wrap gap-2.5 pt-3 border-t border-emerald-200">
                          <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                            disabled={actingOfferId === offer.id}
                            onClick={() => void handleOfferAction(offer.id, "accepted")}
                          >
                            <Check className="mr-1.5 size-4" />
                            {actingOfferId === offer.id ? "Memproses..." : "Terima Tawaran Kerja (Accept Offer)"}
                          </Button>
                          <Button
                            variant="outline"
                            className="text-xs text-red-700 border-red-200 hover:bg-red-50"
                            disabled={actingOfferId === offer.id}
                            onClick={() => void handleOfferAction(offer.id, "declined")}
                          >
                            Tolak Tawaran
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {offerNotice && <p role="status" className="text-xs text-muted-foreground">{offerNotice}</p>}
              </div>
            )}

            {/* Scheduled Interviews Panel */}
            {interviews.length > 0 && (
              <Card className="border-border/80 bg-card shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock3 className="size-4 text-primary" /> Jadwal Wawancara Anda
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {interviews.map((interview) => (
                    <div key={interview.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
                      <div className="min-w-0">
                        <p className="font-bold text-foreground text-sm">{interview.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-muted-foreground" />
                          <span>{formatDate(interview.scheduledAt)} ({interview.durationMinutes} menit) · {interview.timezone}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs font-medium"
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
                          Simpan ke Kalender (.ics)
                        </Button>
                        {interview.meetingUrl && (
                          <Button size="sm" asChild className="text-xs font-semibold">
                            <a href={interview.meetingUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="size-3.5 mr-1" />
                              Buka Ruang Temu
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Stage History & Audit Log */}
            <Card className="border-border/80 bg-card shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-foreground">
                  Riwayat &amp; Catatan Perkembangan Lamaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Belum ada riwayat tambahan — berkas lamaran telah diterima sistem.</p>
                ) : (
                  <div className="space-y-4">
                    {history.map((item, index) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            <Check className="size-3.5" />
                          </span>
                          {index < history.length - 1 && <span className="mt-1 h-full w-px bg-border/80" />}
                        </div>
                        <div className="pb-2">
                          <p className="text-xs font-bold text-foreground">{labels[item.toStatus]}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(item.createdAt)}</p>
                          {item.reason && (
                            <p className="mt-1.5 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5 leading-relaxed">
                              {item.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cover Note Section */}
            <Card className="border-border/80 bg-card shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-foreground">
                  Surat Pengantar (Cover Note)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  {application.coverNote || "Tidak ada catatan pengantar yang dilampirkan."}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
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
