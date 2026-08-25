"use client";

import { useState } from "react";
import {
  Download,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  LayoutGrid,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CvProfile } from "@/types";
import { cn } from "@/lib/utils";
import { type CvTemplateId } from "@/lib/cv/templates";

export type { CvTemplateId } from "@/lib/cv/templates";

// ─── Template definitions ─────────────────────────────────────────────────────

interface CvTemplate {
  id: CvTemplateId;
  name: string;
  tag: string;
  desc: string;
  recommended?: boolean;
  preview: React.ReactNode;
}

const templates: CvTemplate[] = [
  {
    id: "ats",
    name: "ATS Clean",
    tag: "Direkomendasikan",
    desc: "Format standar ATS-friendly: hitam-putih, tanpa kolom, mudah diparsing sistem rekrutmen.",
    recommended: true,
    preview: (
      <div className="w-full rounded-lg border bg-white p-4 text-[8px] leading-tight shadow-sm font-mono">
        <div className="border-b pb-1.5 mb-1.5">
          <div className="h-2 w-28 bg-slate-900 rounded mb-0.5" />
          <div className="h-1.5 w-20 bg-slate-400 rounded" />
        </div>
        <div className="space-y-1">
          {["PENGALAMAN KERJA", "PENDIDIKAN", "SKILL"].map((s) => (
            <div key={s}>
              <div className="h-1.5 w-16 bg-slate-900 rounded mb-0.5" />
              <div className="h-1 w-full bg-slate-200 rounded mb-0.5" />
              <div className="h-1 w-4/5 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "modern",
    name: "Modern Purple",
    tag: "Populer",
    desc: "Header dengan aksen ungu ProofyLink, layout dua kolom elegan untuk fresh graduate & professional.",
    preview: (
      <div className="w-full rounded-lg border overflow-hidden shadow-sm text-[8px] leading-tight">
        <div className="bg-[#7C3AED] px-4 py-3">
          <div className="h-2.5 w-24 bg-white/80 rounded mb-0.5" />
          <div className="h-1.5 w-16 bg-purple-300 rounded" />
        </div>
        <div className="bg-white p-3 grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="h-1 w-full bg-purple-100 rounded" />
            <div className="h-1 w-4/5 bg-purple-100 rounded" />
            <div className="h-1 w-3/5 bg-purple-100 rounded" />
          </div>
          <div className="space-y-1">
            <div className="h-1 w-full bg-slate-200 rounded" />
            <div className="h-1 w-3/4 bg-slate-200 rounded" />
            <div className="flex flex-wrap gap-0.5 mt-1">
              {[1, 2, 3].map((i) => <div key={i} className="h-1.5 w-5 bg-purple-200 rounded-full" />)}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "sidebar",
    name: "Sidebar Creative",
    tag: "Kreatif",
    desc: "Sidebar gelap dengan konten utama terang. Cocok untuk desainer, marketers, dan creative roles.",
    preview: (
      <div className="w-full rounded-lg border overflow-hidden shadow-sm text-[8px] leading-tight flex">
        <div className="w-1/3 bg-slate-800 p-2 space-y-1.5">
          <div className="size-6 rounded-full bg-white/30 mx-auto mb-1" />
          <div className="h-1 w-full bg-white/40 rounded" />
          <div className="h-1 w-3/4 bg-white/20 rounded" />
          <div className="h-1 w-full bg-white/20 rounded" />
          <div className="h-1 w-4/5 bg-white/20 rounded" />
        </div>
        <div className="flex-1 bg-white p-2 space-y-1">
          <div className="h-1.5 w-16 bg-slate-800 rounded mb-0.5" />
          <div className="h-1 w-full bg-slate-200 rounded" />
          <div className="h-1 w-4/5 bg-slate-200 rounded" />
          <div className="h-1.5 w-16 bg-slate-800 rounded mt-1 mb-0.5" />
          <div className="h-1 w-full bg-slate-200 rounded" />
          <div className="h-1 w-3/4 bg-slate-200 rounded" />
        </div>
      </div>
    ),
  },
  {
    id: "minimal",
    name: "Minimal Elegant",
    tag: "Premium",
    desc: "Tipografi tegas dengan batas tipis dan whitespace maksimal. Kesan high-level professional.",
    preview: (
      <div className="w-full rounded-lg border bg-white p-4 text-[8px] leading-tight shadow-sm">
        <div className="flex justify-between items-start border-b border-slate-800 pb-2 mb-2">
          <div>
            <div className="h-2.5 w-24 bg-slate-900 rounded mb-0.5" />
            <div className="h-1.5 w-20 bg-slate-400 rounded" />
          </div>
          <div className="text-right space-y-0.5">
            <div className="h-1 w-14 bg-slate-300 rounded" />
            <div className="h-1 w-12 bg-slate-300 rounded" />
          </div>
        </div>
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2">
              <div className="w-12 shrink-0 h-1 bg-slate-400 rounded mt-0.5" />
              <div className="flex-1 space-y-0.5">
                <div className="h-1 w-full bg-slate-200 rounded" />
                <div className="h-1 w-4/5 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

// ─── Download logic ───────────────────────────────────────────────────────────

async function downloadCvPdf(
  profile: CvProfile,
  templateId: CvTemplateId,
  onError: (msg: string) => void
): Promise<void> {
  const response = await fetch("/api/cv/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, templateId }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    onError(data.error ?? "PDF tidak dapat dibuat. Coba lagi.");
    return;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeFileName = `proofylink-cv-${(profile.fullName ?? "cv").toLowerCase().replace(/\s+/g, "-")}.pdf`;
  link.href = url;
  link.download = safeFileName;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CvDownload({ profile }: { profile: CvProfile }) {
  const [selected, setSelected] = useState<CvTemplateId>("ats");
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCvPdf(profile, selected, (msg) => {
        toast.error("Gagal membuat PDF", { description: msg });
      });
      toast.success("CV berhasil diunduh!");
    } catch {
      toast.error("Gagal mengunduh CV. Coba lagi.");
    } finally {
      setDownloading(false);
    }
  };

  const selectedTpl = templates.find((t) => t.id === selected)!;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <LayoutGrid className="size-5 text-slate-700" />
        <div>
          <p className="font-semibold text-[#111827]">Pilih Template CV</p>
          <p className="text-xs text-muted-foreground">Template ATS wajib untuk mendaftar via sistem rekrutmen otomatis.</p>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => setSelected(tpl.id)}
            className={cn(
              "group flex flex-col rounded-2xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900",
              selected === tpl.id
                ? "border-slate-900 bg-slate-50 shadow-md ring-1 ring-slate-900 -translate-y-0.5"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5"
            )}
          >
            {/* Preview thumbnail */}
            <div className="mb-3 overflow-hidden rounded-lg border bg-slate-50">
              {tpl.preview}
            </div>

            {/* Info */}
            <div className="flex items-start justify-between gap-1 mb-1">
              <p className={cn("text-sm font-bold", selected === tpl.id ? "text-slate-900" : "text-[#111827]")}>
                {tpl.name}
              </p>
              {selected === tpl.id && <CheckCircle2 className="size-4 shrink-0 text-slate-900 mt-0.5" />}
            </div>
            <span className={cn(
              "mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold w-fit",
              tpl.recommended
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600"
            )}>
              {tpl.tag}
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{tpl.desc}</p>
          </button>
        ))}
      </div>

      {/* Action area */}
      <Card className="border border-slate-200 bg-white">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              selected === "ats" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
            )}>
              <FileText className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#111827]">
                Template: <span className="text-slate-900 font-bold">{selectedTpl.name}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed max-w-sm">
                {selectedTpl.desc}
              </p>
              {selected === "ats" && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-700 font-medium">
                  <ShieldCheck className="size-3.5 text-emerald-600" /> Format ini kompatibel dengan semua ATS (Workday, Taleo, Greenhouse, dll.)
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              onClick={() => void handleDownload()}
              disabled={downloading}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold rounded-xl px-5"
            >
              {downloading ? (
                <><Loader2 className="size-4 animate-spin mr-1.5" /> Membuat PDF...</>
              ) : (
                <><Download className="size-4 mr-1.5" /> Unduh PDF</>
              )}
            </Button>
            <p className="text-center text-[10px] text-muted-foreground">
              File PDF langsung diunduh ke perangkat
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ATS tip */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
        <ShieldCheck className="size-4 shrink-0 text-amber-600 mt-0.5" />
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong>Tips ATS:</strong> Gunakan template <strong>ATS Clean</strong> saat melamar ke perusahaan besar. Hindari tabel, kolom, dan gambar agar parser sistem rekrutmen dapat membaca semua informasimu dengan benar.
        </p>
      </div>
    </div>
  );
}
