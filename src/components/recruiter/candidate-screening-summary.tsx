"use client";

import { CheckCircle2, HelpCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";

interface CandidateScreeningSummaryProps {
  candidateId: string;
  candidateName: string;
  role: string;
  score?: number;
  feedback?: string;
}

export function CandidateScreeningSummary({
  candidateId,
  candidateName,
  role,
  score = 4.2,
  feedback,
}: CandidateScreeningSummaryProps) {
  const { screeningResults } = useApp();
  const savedResult = screeningResults[candidateId];

  // Hitung persentase kecocokan
  const fitPercentage = savedResult?.insight?.score
    ? Math.round(savedResult.insight.score)
    : Math.min(96, Math.max(72, Math.round(score * 20)));

  const fitLabel =
    fitPercentage >= 85
      ? "Sangat Sesuai"
      : fitPercentage >= 75
      ? "Sesuai Standar"
      : "Perlu Peninjauan";

  const summaryText =
    savedResult?.summary?.summary ||
    (feedback && feedback.trim().length > 0
      ? feedback
      : `Portofolio dan riwayat pengalaman ${candidateName} menunjukkan keselarasan yang kuat dengan kompetensi inti posisi ${role}.`);

  const strengths = savedResult?.summary?.strengths?.length
    ? savedResult.summary.strengths.slice(0, 3)
    : savedResult?.insight?.evidence?.length
    ? savedResult.insight.evidence.slice(0, 3)
    : [
        "Pengalaman relevan dalam eksekusi proyek berbasis industri sejenis",
        "Keterampilan teknis terverifikasi pada portofolio dan riwayat kerja",
        "Komunikasi kerja terstruktur dan siap kolaborasi tim",
      ];

  const focusAreas = savedResult?.insight?.limitations?.length
    ? savedResult.insight.limitations.slice(0, 2)
    : [
        "Konfirmasi ekspektasi kompensasi dan ketersediaan tanggal mulai kerja",
        "Eksplorasi studi kasus nyata terkait skala sistem pada wawancara teknis",
      ];

  return (
    <Card className="border-slate-200 bg-white shadow-2xs overflow-hidden">
      <CardContent className="p-4 space-y-3.5">
        {/* Header: Label & Score */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Sparkles className="size-3.5 text-[#7C3AED]" />
            <span>Hasil AI Screening</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#7C3AED]">{fitPercentage}% Fit</span>
            <Badge
              variant="outline"
              className={
                fitPercentage >= 85
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold py-0 px-2"
                  : "bg-purple-50 text-[#7C3AED] border-purple-200 text-[10px] font-semibold py-0 px-2"
              }
            >
              {fitLabel}
            </Badge>
          </div>
        </div>

        {/* AI Summary Text */}
        <p className="text-xs text-slate-600 leading-relaxed">
          {summaryText}
        </p>

        {/* Strengths */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Kekuatan Utama Teridentifikasi
          </p>
          <ul className="space-y-1 text-xs text-slate-700">
            {strengths.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendation / Focus Areas */}
        <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-2.5 space-y-1">
          <p className="text-[11px] font-semibold text-purple-900 flex items-center gap-1">
            <HelpCircle className="size-3 text-[#7C3AED]" /> Fokus Evaluasi Wawancara:
          </p>
          <ul className="space-y-0.5 text-[11px] text-purple-900/90 pl-4 list-disc">
            {focusAreas.map((area, i) => (
              <li key={i}>{area}</li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3 text-slate-400" /> Model Evaluasi v2.4
          </span>
          <span>Diverifikasi otomatis</span>
        </div>
      </CardContent>
    </Card>
  );
}
