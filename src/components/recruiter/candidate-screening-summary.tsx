"use client";

import { CheckCircle2, HelpCircle, Lock, ShieldCheck, Sparkles, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";

interface CandidateScreeningSummaryProps {
  candidateId: string;
  candidateName: string;
  role: string;
  score?: number;
  feedback?: string;
  isUnlocked?: boolean;
  onUnlock?: () => void;
}

export function CandidateScreeningSummary({
  candidateId,
  candidateName,
  role,
  score = 4.2,
  feedback,
  isUnlocked = true,
  onUnlock,
}: CandidateScreeningSummaryProps) {
  const { screeningResults } = useApp();
  const savedResult = screeningResults[candidateId];

  // If candidate is locked (inbound triage), screening results are hidden until unlocked
  if (isUnlocked === false) {
    return (
      <Card className="border-purple-200/80 bg-white shadow-2xs overflow-hidden">
        <CardContent className="p-4 space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Sparkles className="size-3.5 text-[#7C3AED]" />
              <span>Hasil AI Screening</span>
            </div>
            <Badge
              variant="outline"
              className="bg-purple-50 text-[#7C3AED] border-purple-200 text-[10px] font-semibold py-0.5 px-2.5 flex items-center gap-1"
            >
              <Lock className="size-2.5 text-[#7C3AED]" /> Terkunci
            </Badge>
          </div>

          {/* Locked State Teaser */}
          <div className="rounded-xl border border-dashed border-purple-200 bg-purple-50/40 p-4 text-center space-y-2.5">
            <div className="size-8 rounded-full bg-purple-100 text-[#7C3AED] flex items-center justify-center mx-auto ring-4 ring-purple-50/80">
              <Lock className="size-3.5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-900">
                Evaluasi AI Screening Belum Terbuka
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                Hasil evaluasi kecocokan peran, deteksi kekuatan utama, dan panduan wawancara AI akan otomatis ditampilkan setelah profil dibuka.
              </p>
            </div>

            {onUnlock ? (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onUnlock}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7C3AED] hover:text-[#6D28D9] hover:underline transition-colors"
                >
                  <Unlock className="size-3 text-[#7C3AED]" />
                  Buka profil untuk evaluasi AI lengkap (1 Token) &rarr;
                </button>
              </div>
            ) : (
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] text-purple-700 bg-purple-100/60 border border-purple-200/70 px-2.5 py-1 rounded-full font-medium">
                  <Lock className="size-3 text-[#7C3AED]" />
                  Akan otomatis dianalisis saat profil dibuka (1 Token)
                </span>
              </div>
            )}
          </div>

          {/* Feature Points Preview (Locked) */}
          <div className="space-y-1.5 pt-0.5 opacity-60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Komponen yang Akan Terbuka
            </p>
            <div className="space-y-1 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-3 text-purple-600 shrink-0" />
                <span>Analisis keselarasan kompetensi inti dan riwayat pelamar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-3 text-purple-600 shrink-0" />
                <span>Rangkuman 3 kekuatan utama pelamar berbasis bukti portofolio</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-3 text-purple-600 shrink-0" />
                <span>Rekomendasi topik uji kompetensi untuk sesi wawancara</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3 text-slate-400" /> Model Evaluasi v2.4
            </span>
            <span>Akses Terproteksi · 1 Token</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Kualifikasi kecocokan kualitatif murni tanpa angka skor
  const isHighFit = savedResult?.insight?.score
    ? savedResult.insight.score >= 80
    : score >= 4.0;

  const fitLabel = isHighFit ? "Sangat Sesuai" : "Terverifikasi AI";

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
        {/* Header: Label Status Kualitatif */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Sparkles className="size-3.5 text-[#7C3AED]" />
            <span>Hasil AI Screening</span>
          </div>
          <Badge
            variant="outline"
            className={
              isHighFit
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold py-0.5 px-2.5"
                : "bg-purple-50 text-[#7C3AED] border-purple-200 text-[10px] font-semibold py-0.5 px-2.5"
            }
          >
            {fitLabel}
          </Badge>
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
