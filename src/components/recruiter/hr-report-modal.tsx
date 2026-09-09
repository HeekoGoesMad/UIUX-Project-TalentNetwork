"use client";

import { useMemo, useRef, useState } from "react";
import {
  Award,
  BarChart3,
  Clock,
  FileSpreadsheet,
  FileText,
  Printer,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Stage = "screening" | "interview" | "offer" | "hired" | "rejected";

export type ReportCandidate = {
  id: string;
  name: string;
  role: string;
  location: string;
  stage: Stage;
  owner: string;
  dueDate: string;
  appliedAt: string;
  score: number;
  offerStatus: "draft" | "sent" | "accepted" | "declined";
  compensation: string;
  jobId?: string;
  jobTitle?: string;
};

export type ReportInterview = {
  id: string;
  candidateId: string;
  date: string;
  timezone: string;
  type: string;
  status: string;
};

interface HrReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: ReportCandidate[];
  interviews: ReportInterview[];
  availableJobs: Array<{ id: string; title: string }>;
}

export function HrReportModal({
  open,
  onOpenChange,
  candidates,
  interviews,
  availableJobs,
}: HrReportModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [reportTimestamp] = useState(() => Date.now());

  // Metrics Calculations
  const totalCandidates = candidates.length;
  const activeCandidates = candidates.filter((c) => c.stage !== "hired" && c.stage !== "rejected");
  const interviewCount = candidates.filter((c) => c.stage === "interview").length;
  const offerCount = candidates.filter((c) => c.stage === "offer").length;
  const hiredCount = candidates.filter((c) => c.stage === "hired").length;

  // Funnel conversion
  const convScreenToInterview =
    totalCandidates > 0 ? Math.round(((interviewCount + offerCount + hiredCount) / totalCandidates) * 100) : 0;
  const convInterviewToOffer =
    interviewCount + offerCount + hiredCount > 0
      ? Math.round(((offerCount + hiredCount) / (interviewCount + offerCount + hiredCount)) * 100)
      : 0;
  const convOfferAcceptance =
    offerCount + hiredCount > 0 ? Math.round((hiredCount / (offerCount + hiredCount)) * 100) : 0;

  // Average Time to Hire
  const avgTimeToHire = useMemo(() => {
    const hired = candidates.filter((c) => c.stage === "hired");
    if (hired.length === 0) return 18; // Benchmark default
    return Math.round(
      hired.reduce((acc, c) => {
        const start = Date.parse(c.appliedAt) || reportTimestamp - 14 * 86400000;
        const end = Date.parse(c.dueDate) || reportTimestamp;
        return acc + Math.max(1, Math.round(Math.abs(end - start) / 86400000));
      }, 0) / hired.length
    );
  }, [candidates, reportTimestamp]);

  // SLA Warnings (overdue or approaching due date)
  const slaWarningCount = useMemo(() => {
    return candidates.filter((c) => {
      if (c.stage === "hired" || c.stage === "rejected") return false;
      const due = Date.parse(c.dueDate);
      return !isNaN(due) && due <= reportTimestamp + 2 * 86400000;
    }).length;
  }, [candidates, reportTimestamp]);

  // Group by Role / Position
  const positionsBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { title: string; total: number; interview: number; offer: number; hired: number }
    >();

    for (const c of candidates) {
      const title = c.jobTitle || c.role || "Umum";
      const existing = map.get(title) || { title, total: 0, interview: 0, offer: 0, hired: 0 };
      existing.total += 1;
      if (c.stage === "interview") existing.interview += 1;
      if (c.stage === "offer") existing.offer += 1;
      if (c.stage === "hired") existing.hired += 1;
      map.set(title, existing);
    }

    return Array.from(map.values());
  }, [candidates]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = [
      "Nama Kandidat",
      "Posisi/Lowongan",
      "Lokasi",
      "Tahap",
      "Owner",
      "Skor Evaluasi",
      "Status Offer",
      "Kompensasi",
      "Tanggal Melamar",
      "Target SLA",
    ];

    const rows = candidates.map((c) => [
      c.name,
      c.jobTitle || c.role,
      c.location,
      c.stage.toUpperCase(),
      c.owner,
      String(c.score),
      c.offerStatus,
      c.compensation,
      c.appliedAt,
      c.dueDate,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-kinerja-rekrutmen-${new Date(reportTimestamp).toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Laporan kinerja CSV berhasil diunduh.");
  };

  const reportDate = useMemo(() => {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
    }).format(new Date(reportTimestamp));
  }, [reportTimestamp]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Laporan Kinerja Rekrutmen</DialogTitle>
          <DialogDescription>
            Ringkasan kinerja hiring pipeline, konversi tahapan, dan kepatuhan SLA.
          </DialogDescription>
        </DialogHeader>

        <div ref={printRef} className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider font-semibold">
                <BarChart3 className="size-4" />
                ProofyLink Talent Network · HR Analytics
              </div>
              <h2 className="text-2xl font-bold tracking-tight mt-1">
                Laporan Kinerja Rekrutmen & Hiring Pipeline
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Laporan resmi periode berjalan per tanggal {reportDate} ({availableJobs.length} lowongan aktif, {interviews.length} agenda interview tercatat)
              </p>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <Button size="sm" variant="outline" onClick={handleExportCsv} className="gap-1.5 text-xs">
                <FileSpreadsheet className="size-3.5 text-emerald-600" />
                Unduh CSV
              </Button>
              <Button size="sm" onClick={handlePrint} className="gap-1.5 text-xs bg-primary">
                <Printer className="size-3.5" />
                Cetak / PDF
              </Button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-slate-50/70 dark:bg-slate-900/50 border shadow-xs">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" /> Total Pipeline
                </p>
                <p className="mt-2 text-2xl font-bold">{totalCandidates}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {activeCandidates.length} kandidat aktif berjalan
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-50/70 dark:bg-slate-900/50 border shadow-xs">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-indigo-600" /> Avg. Time-to-Hire
                </p>
                <p className="mt-2 text-2xl font-bold text-indigo-950 dark:text-indigo-200">
                  {avgTimeToHire} <span className="text-xs font-normal">hari</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Kecepatan alur hiring</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-50/70 dark:bg-slate-900/50 border shadow-xs">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-emerald-600" /> Offer Acceptance
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {convOfferAcceptance}%
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {hiredCount} diterima dari {offerCount + hiredCount} offer
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-50/70 dark:bg-slate-900/50 border shadow-xs">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Award className="size-3.5 text-amber-600" /> Perhatian SLA
                </p>
                <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {slaWarningCount}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Mendekati tenggat review</p>
              </CardContent>
            </Card>
          </div>

          {/* Funnel Conversion Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" /> Rasio Konversi Tahapan (Dover Funnel)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-medium mb-1.5">
                  <span>1. Screening → Interview ({convScreenToInterview}%)</span>
                  <span className="text-muted-foreground">
                    {interviewCount + offerCount + hiredCount} dari {totalCandidates} kandidat
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${Math.min(convScreenToInterview, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1.5">
                  <span>2. Interview → Offer Letter ({convInterviewToOffer}%)</span>
                  <span className="text-muted-foreground">
                    {offerCount + hiredCount} dari {interviewCount + offerCount + hiredCount} interview
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500"
                    style={{ width: `${Math.min(convInterviewToOffer, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1.5">
                  <span>3. Offer Diterima / Hired ({convOfferAcceptance}%)</span>
                  <span className="text-muted-foreground">
                    {hiredCount} dari {offerCount + hiredCount} penawaran
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(convOfferAcceptance, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown per Posisi */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="size-4 text-primary" /> Rincian Rekrutmen per Posisi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground border-y font-semibold">
                    <tr>
                      <th className="p-3">Posisi / Lowongan</th>
                      <th className="p-3 text-center">Total Kandidat</th>
                      <th className="p-3 text-center">Interview</th>
                      <th className="p-3 text-center">Offer</th>
                      <th className="p-3 text-center">Diterima (Hired)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {positionsBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                          Belum ada data posisi kandidat.
                        </td>
                      </tr>
                    ) : (
                      positionsBreakdown.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/20">
                          <td className="p-3 font-medium">{row.title}</td>
                          <td className="p-3 text-center font-mono">{row.total}</td>
                          <td className="p-3 text-center font-mono text-purple-700 font-semibold">
                            {row.interview}
                          </td>
                          <td className="p-3 text-center font-mono text-amber-700 font-semibold">
                            {row.offer}
                          </td>
                          <td className="p-3 text-center font-mono text-emerald-700 font-bold">
                            {row.hired}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Sign-off footer for official reports */}
          <div className="hidden print:block pt-8 border-t mt-8 text-xs text-muted-foreground">
            <div className="flex justify-between items-end">
              <div>
                <p className="font-semibold text-foreground">Disiapkan oleh:</p>
                <p className="mt-8 border-t border-slate-400 pt-1 font-mono">Talent Acquisition Lead</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Disetujui oleh:</p>
                <p className="mt-8 border-t border-slate-400 pt-1 font-mono">Head of Human Resources</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 print:hidden flex items-center justify-between sm:justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button size="sm" onClick={handlePrint} className="gap-1.5 bg-primary">
            <Printer className="size-3.5" />
            Cetak / Ekspor PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
