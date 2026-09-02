"use client";

import { useState } from "react";
import {
  Download,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  LayoutGrid,
  FileText,
  Printer,
  Eye,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { CvProfile } from "@/types";
import { cn } from "@/lib/utils";
import { buildCvHtml, type CvTemplateId } from "@/lib/cv/templates";

export type { CvTemplateId } from "@/lib/cv/templates";

// ─── Template definitions ─────────────────────────────────────────────────────

interface CvTemplate {
  id: CvTemplateId;
  name: string;
  tag: string;
  badgeClass: string;
  desc: string;
  recommended?: boolean;
  preview: React.ReactNode;
}

const templates: CvTemplate[] = [
  {
    id: "ats",
    name: "ATS Friendly",
    tag: "Free · Standar HR",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    desc: "Single-column hitam-putih, divider tegas, tanggal rata kanan. Terstandarisasi lolos ATS.",
    recommended: true,
    preview: (
      <div className="h-full w-full rounded-md border border-slate-200/90 bg-white p-2.5 text-[7px] leading-tight flex flex-col justify-between shadow-2xs font-serif select-none">
        {/* Centered Name & Contact */}
        <div className="text-center pb-1 border-b border-slate-900/80">
          <div className="h-1.5 w-16 bg-slate-900 rounded-xs mx-auto mb-0.5" />
          <div className="h-0.5 w-20 bg-slate-400 rounded-xs mx-auto" />
        </div>
        {/* Section 1: Pengalaman */}
        <div className="space-y-0.5">
          <div className="border-b border-slate-900/60 pb-0.5 flex justify-between items-center">
            <div className="h-1 w-12 bg-slate-900 rounded-xs" />
            <div className="h-0.5 w-6 bg-slate-400 rounded-xs" />
          </div>
          <div className="h-0.5 w-full bg-slate-200 rounded-xs" />
          <div className="h-0.5 w-4/5 bg-slate-200 rounded-xs" />
        </div>
        {/* Section 2: Pendidikan */}
        <div className="space-y-0.5">
          <div className="border-b border-slate-900/60 pb-0.5 flex justify-between items-center">
            <div className="h-1 w-10 bg-slate-900 rounded-xs" />
            <div className="h-0.5 w-5 bg-slate-400 rounded-xs" />
          </div>
          <div className="h-0.5 w-3/4 bg-slate-200 rounded-xs" />
        </div>
        {/* Section 3: Keterampilan */}
        <div className="space-y-0.5">
          <div className="border-b border-slate-900/60 pb-0.5">
            <div className="h-1 w-11 bg-slate-900 rounded-xs" />
          </div>
          <div className="flex gap-2">
            <div className="h-0.5 w-1/2 bg-slate-300 rounded-xs" />
            <div className="h-0.5 w-1/2 bg-slate-300 rounded-xs" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "modern",
    name: "Creative Design",
    tag: "Free · Visual Portfolio",
    badgeClass: "bg-purple-50 text-[#7C3AED] border-purple-200",
    desc: "Top pastel blush banner, foto avatar bundar, layout 2-kolom dengan timeline riwayat kerja.",
    recommended: true,
    preview: (
      <div className="h-full w-full rounded-md border border-slate-200/90 bg-white overflow-hidden flex flex-col shadow-2xs select-none">
        {/* Top pastel blush banner */}
        <div className="h-2.5 bg-[#EBD6CB] w-full shrink-0" />
        {/* Two columns */}
        <div className="flex-1 p-2 flex gap-2">
          {/* Left column */}
          <div className="w-[32%] space-y-1.5 border-r border-slate-100 pr-1 text-center">
            <div className="size-4.5 rounded-full bg-slate-800 mx-auto" />
            <div className="h-0.5 w-full bg-slate-300 rounded-xs" />
            <div className="h-0.5 w-3/4 bg-slate-300 rounded-xs mx-auto" />
            <div className="pt-0.5 space-y-0.5">
              <div className="h-1 w-6 bg-slate-800 rounded-xs" />
              <div className="h-0.5 w-full bg-slate-200 rounded-xs" />
              <div className="h-0.5 w-4/5 bg-slate-200 rounded-xs" />
            </div>
          </div>
          {/* Right column */}
          <div className="flex-1 space-y-1">
            <div className="border-b border-slate-200 pb-0.5">
              <div className="h-1.5 w-14 bg-slate-900 rounded-xs mb-0.5" />
              <div className="h-0.5 w-10 bg-slate-400 rounded-xs" />
            </div>
            {/* Timeline */}
            <div className="space-y-1.5 pl-1.5 border-l border-slate-300">
              <div className="space-y-0.5 relative">
                <div className="size-1 rounded-full border border-slate-600 bg-white absolute -left-[8.5px] top-0.5" />
                <div className="h-0.5 w-8 bg-slate-600 rounded-xs" />
                <div className="h-1 w-12 bg-slate-900 rounded-xs" />
                <div className="h-0.5 w-full bg-slate-200 rounded-xs" />
              </div>
              <div className="space-y-0.5 relative">
                <div className="size-1 rounded-full border border-slate-600 bg-white absolute -left-[8.5px] top-0.5" />
                <div className="h-0.5 w-7 bg-slate-600 rounded-xs" />
                <div className="h-1 w-10 bg-slate-900 rounded-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "sidebar",
    name: "Sidebar Dark",
    tag: "Free · Kontras Tinggi",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    desc: "Sidebar gelap dengan konten utama terang. Visual tegas cocok untuk peran teknologi & multimedia.",
    preview: (
      <div className="h-full w-full rounded-md border border-slate-200/90 bg-white overflow-hidden flex shadow-2xs select-none">
        {/* Left dark sidebar */}
        <div className="w-[34%] bg-slate-800 p-2 flex flex-col justify-between shrink-0">
          <div className="space-y-1 text-center">
            <div className="size-4.5 rounded-full bg-purple-400/80 mx-auto" />
            <div className="h-1 w-10 bg-white rounded-xs mx-auto" />
            <div className="h-0.5 w-8 bg-slate-400 rounded-xs mx-auto" />
          </div>
          <div className="space-y-0.5">
            <div className="h-0.5 w-full bg-slate-600 rounded-xs" />
            <div className="h-0.5 w-3/4 bg-slate-600 rounded-xs" />
          </div>
        </div>
        {/* Right main */}
        <div className="flex-1 p-2 space-y-1.5 flex flex-col justify-between">
          <div className="border-b border-purple-200 pb-0.5">
            <div className="h-1 w-12 bg-purple-700 rounded-xs" />
          </div>
          <div className="space-y-0.5">
            <div className="h-1 w-14 bg-slate-900 rounded-xs" />
            <div className="h-0.5 w-full bg-slate-200 rounded-xs" />
            <div className="h-0.5 w-4/5 bg-slate-200 rounded-xs" />
          </div>
          <div className="space-y-0.5 pt-0.5 border-t border-slate-100">
            <div className="h-1 w-12 bg-slate-900 rounded-xs" />
            <div className="h-0.5 w-full bg-slate-200 rounded-xs" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "minimal",
    name: "Minimal Elegant",
    tag: "Free · Editorial Klasik",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    desc: "Tipografi tegas dengan batas tipis dan whitespace luas. Memberi impresi editorial korporat.",
    preview: (
      <div className="h-full w-full rounded-md border border-slate-200/90 bg-white p-2.5 flex flex-col justify-between shadow-2xs font-serif select-none">
        {/* Header */}
        <div className="flex justify-between items-end border-b border-slate-900 pb-1">
          <div>
            <div className="h-1.5 w-14 bg-slate-900 rounded-xs mb-0.5" />
            <div className="h-0.5 w-10 bg-slate-500 rounded-xs italic" />
          </div>
          <div className="space-y-0.5 text-right">
            <div className="h-0.5 w-8 bg-slate-400 rounded-xs ml-auto" />
            <div className="h-0.5 w-6 bg-slate-400 rounded-xs ml-auto" />
          </div>
        </div>
        {/* Body rows */}
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <div className="w-6 shrink-0 h-0.5 bg-slate-400 rounded-xs" />
            <div className="flex-1 space-y-0.5">
              <div className="h-1 w-12 bg-slate-900 rounded-xs" />
              <div className="h-0.5 w-full bg-slate-200 rounded-xs" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-6 shrink-0 h-0.5 bg-slate-400 rounded-xs" />
            <div className="flex-1 space-y-0.5">
              <div className="h-1 w-10 bg-slate-900 rounded-xs" />
              <div className="h-0.5 w-4/5 bg-slate-200 rounded-xs" />
            </div>
          </div>
        </div>
        <div className="h-0.5 w-full bg-slate-200 rounded-xs" />
      </div>
    ),
  },
];

// ─── Browser Print Helper ─────────────────────────────────────────────────────

function printCvBrowser(profile: CvProfile, templateId: CvTemplateId) {
  const html = buildCvHtml(profile, templateId);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Gagal membuka jendela cetak. Izinkan pop-up di browser Anda.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CvDownload({ profile }: { profile: CvProfile }) {
  const [selected, setSelected] = useState<CvTemplateId>("ats");
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    let directDownloaded = false;

    try {
      // 1. Coba download direct via server API
      const res = await fetch("/api/cv/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, templateId: selected }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const safeFileName = `proofylink-cv-${(profile.fullName ?? "cv").toLowerCase().replace(/\s+/g, "-")}.pdf`;
        link.href = url;
        link.download = safeFileName;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("CV berhasil diunduh sebagai PDF!");
        directDownloaded = true;
      }
    } catch {
      // Fallback
    } finally {
      setDownloading(false);
    }

    // 2. Jika serverless/Vercel tidak memiliki browser runtime, fallback mulus tanpa error
    if (!directDownloaded) {
      toast.info("Menyiapkan dokumen — silakan pilih 'Simpan sebagai PDF' (Save as PDF) di jendela cetak.", {
        duration: 5000,
      });
      printCvBrowser(profile, selected);
    }
  };

  const selectedTpl = templates.find((t) => t.id === selected) || templates[0];
  const renderedHtml = buildCvHtml(profile, selected);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="size-5 text-slate-700" />
          <div>
            <p className="font-semibold text-[#111827]">Pilih Template CV Gratis</p>
            <p className="text-xs text-muted-foreground">
              Tersedia pilihan ATS Friendly (standar lolos filter rekrutmen) dan Creative Design (presentasi portofolio visual).
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreviewOpen(true)}
          className="gap-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Eye className="size-3.5" />
          Pratinjau CV
        </Button>
      </div>

      {/* Template Grid (4 Cards Seragam & Konsisten) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {templates.map((tpl) => {
          const isSelected = selected === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setSelected(tpl.id)}
              className={cn(
                "group flex flex-col h-full rounded-2xl border p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]",
                isSelected
                  ? "border-[#7C3AED] bg-purple-50/25 ring-2 ring-[#7C3AED] shadow-sm -translate-y-0.5"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs hover:-translate-y-0.5"
              )}
            >
              {/* Preview Thumbnail Container (Tinggi seragam h-28) */}
              <div className="h-28 w-full shrink-0 mb-3 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/80 p-1.5 transition-colors group-hover:border-slate-300">
                {tpl.preview}
              </div>

              {/* Title & Checkmark */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <p className={cn("text-sm font-bold tracking-tight", isSelected ? "text-[#7C3AED]" : "text-slate-900")}>
                  {tpl.name}
                </p>
                {isSelected && <CheckCircle2 className="size-4 shrink-0 text-[#7C3AED]" />}
              </div>

              {/* Tag Badge (Konsisten bentuk & padding) */}
              <div className="mb-2">
                <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold border", tpl.badgeClass)}>
                  {tpl.tag}
                </span>
              </div>

              {/* Description (Tinggi teks rata) */}
              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3 mt-auto">
                {tpl.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Action area */}
      <Card className="border border-slate-200 bg-white">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                selected === "ats"
                  ? "bg-slate-900 text-white"
                  : selected === "modern"
                  ? "bg-[#EBD6CB] text-slate-900 font-bold"
                  : "bg-slate-100 text-slate-600"
              )}
            >
              {selected === "modern" ? <Sparkles className="size-5 text-[#7C3AED]" /> : <FileText className="size-5" />}
            </div>
            <div>
              <p className="font-semibold text-sm text-[#111827]">
                Template Terpilih: <span className="text-slate-900 font-bold">{selectedTpl.name}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed max-w-md">
                {selectedTpl.desc}
              </p>
              {selected === "ats" ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-700 font-medium">
                  <ShieldCheck className="size-3.5 text-emerald-600" /> Format ini 100% kompatibel dengan sistem ATS (Workday, Taleo, Greenhouse, dll.)
                </p>
              ) : selected === "modern" ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-purple-700 font-medium">
                  <Sparkles className="size-3.5 text-purple-600" /> Dilengkapi timeline visual dan aksen pastel modern untuk portfolio.
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => printCvBrowser(profile, selected)}
              className="gap-1.5 border-slate-300 text-xs font-semibold hover:bg-slate-50"
            >
              <Printer className="size-3.5" /> Cetak Langsung
            </Button>
            <Button
              onClick={() => void handleDownload()}
              disabled={downloading}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold rounded-xl px-5 text-xs shadow-xs"
            >
              {downloading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" /> Menyiapkan...
                </>
              ) : (
                <>
                  <Download className="size-4 mr-1.5" /> Unduh PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Guidance Alert */}
      <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <ShieldCheck className="size-4 shrink-0 text-[#7C3AED] mt-0.5" />
        <p className="text-xs text-slate-700 leading-relaxed">
          <strong>Rekomendasi Penggunaan:</strong> Gunakan <strong>ATS Friendly</strong> saat melamar pekerjaan melalui portal karir formal atau LinkedIn Job posting. Gunakan <strong>Creative Design</strong> jika mengirim CV via email langsung ke user, tim desain, startup, atau saat interview tatap muka.
        </p>
      </div>

      {/* Full Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-4 sm:p-6">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-3">
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Pratinjau CV — {selectedTpl.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Tampilan persis sesuai dokumen PDF yang akan dicetak dan diunduh.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 mr-6">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => printCvBrowser(profile, selected)}
                className="gap-1 text-xs"
              >
                <Printer className="size-3.5" /> Cetak / Simpan PDF
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleDownload()}
                disabled={downloading}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white gap-1 text-xs"
              >
                <Download className="size-3.5" /> Unduh PDF
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 w-full overflow-hidden rounded-lg border bg-slate-100 p-2">
            <iframe
              srcDoc={renderedHtml}
              title="Pratinjau CV"
              className="w-full h-full rounded bg-white shadow-md border-0"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
