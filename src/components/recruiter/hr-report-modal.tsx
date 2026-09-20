"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
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
  offerStatus: "draft" | "sent" | "accepted" | "declined" | "negotiating";
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
}: HrReportModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [reportTimestamp] = useState(() => Date.now());

  // Metrics Calculations
  const totalCandidates = candidates.length;
  const screeningCount = candidates.filter((c) => c.stage === "screening").length;
  const interviewCount = candidates.filter((c) => c.stage === "interview").length;
  const offerCount = candidates.filter((c) => c.stage === "offer").length;
  const hiredCount = candidates.filter((c) => c.stage === "hired").length;

  // Funnel conversion percentages
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
    if (hired.length === 0) return 18;
    return Math.round(
      hired.reduce((acc, c) => {
        const start = Date.parse(c.appliedAt) || reportTimestamp - 14 * 86400000;
        const end = Date.parse(c.dueDate) || reportTimestamp;
        return acc + Math.max(1, Math.round(Math.abs(end - start) / 86400000));
      }, 0) / hired.length
    );
  }, [candidates, reportTimestamp]);

  // SLA Warnings
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
    toast.success("Laporan CSV berhasil diunduh.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Laporan Kinerja Rekrutmen</DialogTitle>
          <DialogDescription>Metrik penting dan grafik konversi rekrutmen</DialogDescription>
        </DialogHeader>

        <div ref={printRef} className="p-6 sm:p-7 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Laporan Kinerja Rekrutmen
              </h2>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <Button size="sm" variant="outline" onClick={handleExportCsv} className="gap-1.5 text-xs font-semibold">
                <FileSpreadsheet className="size-3.5 text-emerald-600" />
                CSV
              </Button>
              <Button size="sm" onClick={handlePrint} className="gap-1.5 text-xs font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
                <Printer className="size-3.5" />
                Cetak / PDF
              </Button>
            </div>
          </div>

          {/* 4 Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-slate-200 bg-slate-50/50 shadow-2xs">
              <CardContent className="p-4">
                <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <Users className="size-3.5 text-[#7C3AED]" /> Total Kandidat
                </p>
                <p className="mt-1.5 text-2xl font-bold text-slate-900">{totalCandidates}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-slate-50/50 shadow-2xs">
              <CardContent className="p-4">
                <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <Clock className="size-3.5 text-indigo-600" /> Avg. Time-to-Hire
                </p>
                <p className="mt-1.5 text-2xl font-bold text-indigo-950">
                  {avgTimeToHire} <span className="text-xs font-normal text-slate-500">hari</span>
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-slate-50/50 shadow-2xs">
              <CardContent className="p-4">
                <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-emerald-600" /> Offer Acceptance
                </p>
                <p className="mt-1.5 text-2xl font-bold text-emerald-700">
                  {convOfferAcceptance}%
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-slate-50/50 shadow-2xs">
              <CardContent className="p-4">
                <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5 text-amber-600" /> Perhatian SLA
                </p>
                <p className="mt-1.5 text-2xl font-bold text-amber-700">
                  {slaWarningCount}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Visual 1: Stage Distribution (Segmented Bar Chart) */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="size-4 text-[#7C3AED]" /> Sebaran Tahapan Kandidat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3">
              {totalCandidates === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Belum ada data kandidat</p>
              ) : (
                <>
                  <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
                    <div
                      style={{ width: `${(screeningCount / totalCandidates) * 100}%` }}
                      className="bg-blue-500 transition-all duration-300"
                      title={`Screening: ${screeningCount}`}
                    />
                    <div
                      style={{ width: `${(interviewCount / totalCandidates) * 100}%` }}
                      className="bg-fuchsia-500 transition-all duration-300"
                      title={`Interview: ${interviewCount}`}
                    />
                    <div
                      style={{ width: `${(offerCount / totalCandidates) * 100}%` }}
                      className="bg-amber-500 transition-all duration-300"
                      title={`Offer: ${offerCount}`}
                    />
                    <div
                      style={{ width: `${(hiredCount / totalCandidates) * 100}%` }}
                      className="bg-emerald-500 transition-all duration-300"
                      title={`Hired: ${hiredCount}`}
                    />
                  </div>

                  {/* Clean Legend */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                    <div className="bg-blue-50/70 border border-blue-100 rounded-lg py-1.5 px-2">
                      <p className="text-[10px] font-semibold text-blue-700">Screening</p>
                      <p className="font-bold text-blue-950 text-sm mt-0.5">{screeningCount}</p>
                    </div>
                    <div className="bg-fuchsia-50/70 border border-fuchsia-100 rounded-lg py-1.5 px-2">
                      <p className="text-[10px] font-semibold text-fuchsia-700">Interview</p>
                      <p className="font-bold text-fuchsia-950 text-sm mt-0.5">{interviewCount}</p>
                    </div>
                    <div className="bg-amber-50/70 border border-amber-100 rounded-lg py-1.5 px-2">
                      <p className="text-[10px] font-semibold text-amber-700">Offer</p>
                      <p className="font-bold text-amber-950 text-sm mt-0.5">{offerCount}</p>
                    </div>
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg py-1.5 px-2">
                      <p className="text-[10px] font-semibold text-emerald-700">Hired</p>
                      <p className="font-bold text-emerald-950 text-sm mt-0.5">{hiredCount}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Visual 2: Funnel Conversion Bars */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="size-4 text-[#7C3AED]" /> Rasio Konversi Seleksi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Screening &rarr; Interview</span>
                  <span className="text-[#7C3AED]">{convScreenToInterview}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-fuchsia-500 transition-all duration-300"
                    style={{ width: `${Math.min(convScreenToInterview, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Interview &rarr; Offer</span>
                  <span className="text-[#7C3AED]">{convInterviewToOffer}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-500 transition-all duration-300"
                    style={{ width: `${Math.min(convInterviewToOffer, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Offer &rarr; Hired</span>
                  <span className="text-[#7C3AED]">{convOfferAcceptance}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.min(convOfferAcceptance, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Essential Data: Position Breakdown Table */}
          <Card className="border-slate-200 shadow-2xs overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Data per Posisi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-y border-slate-100 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 pl-4">Posisi</th>
                      <th className="p-3 text-center">Total</th>
                      <th className="p-3 text-center">Interview</th>
                      <th className="p-3 text-center">Offer</th>
                      <th className="p-3 text-center pr-4">Hired</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {positionsBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">
                          Belum ada data posisi.
                        </td>
                      </tr>
                    ) : (
                      positionsBreakdown.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 pl-4 font-semibold text-slate-800">{row.title}</td>
                          <td className="p-3 text-center font-bold text-slate-700">{row.total}</td>
                          <td className="p-3 text-center font-bold text-fuchsia-700">{row.interview}</td>
                          <td className="p-3 text-center font-bold text-amber-700">{row.offer}</td>
                          <td className="p-3 text-center pr-4 font-bold text-emerald-700 flex items-center justify-center gap-1">
                            {row.hired > 0 && <CheckCircle2 className="size-3 text-emerald-600 inline" />}
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
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50/50 print:hidden flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
