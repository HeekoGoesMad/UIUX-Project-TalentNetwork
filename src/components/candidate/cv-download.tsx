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
  desc: string;
  recommended?: boolean;
  preview: React.ReactNode;
}

const templates: CvTemplate[] = [
  {
    id: "ats",
    name: "ATS Friendly",
    tag: "Free · Standar HR",
    desc: "Single-column hitam-putih, divider tegas, tanggal rata kanan. Terstandarisasi untuk lolos screening ATS.",
    recommended: true,
    preview: (
      <div className="w-full rounded-lg border bg-white p-3 text-[7.5px] leading-tight shadow-2xs font-serif text-slate-800">
        <div className="text-center pb-1 mb-1 border-b border-black">
          <div className="h-2 w-20 bg-black rounded mx-auto mb-0.5" />
          <div className="h-1 w-28 bg-neutral-400 rounded mx-auto" />
        </div>
        <div className="space-y-1">
          {["PENGALAMAN KERJA", "PENDIDIKAN", "KETERAMPILAN"].map((s) => (
            <div key={s}>
              <div className="border-b border-black pb-0.5 mb-0.5">
                <span className="font-bold text-[6.5px] tracking-wide text-black block uppercase">{s}</span>
              </div>
              <div className="flex justify-between items-center mb-0.5">
                <div className="h-1.5 w-16 bg-black rounded" />
                <div className="h-1 w-10 bg-neutral-400 rounded" />
              </div>
              <div className="h-1 w-full bg-neutral-200 rounded mb-0.5" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "modern",
    name: "Creative Design",
    tag: "Free · Visual Portfolio",
    desc: "Top pastel blush banner, foto avatar bundar, layout 2-kolom dengan timeline riwayat kerja elegan.",
    recommended: true,
    preview: (
      <div className="w-full rounded-lg border overflow-hidden shadow-2xs text-[7.5px] leading-tight bg-white">
        <div className="h-3.5 bg-[#EBD6CB] w-full" />
        <div className="p-2 flex gap-2">
          <div className="w-1/3 space-y-1.5 border-r border-slate-100 pr-1 text-center">
            <div className="size-6 rounded-full bg-slate-800 mx-auto" />
            <div className="h-1 w-full bg-slate-300 rounded" />
            <div className="h-1 w-3/4 bg-slate-300 rounded mx-auto" />
            <div className="pt-1 text-left">
              <div className="h-1 w-8 bg-slate-800 rounded mb-0.5 font-bold" />
              <div className="h-0.5 w-full bg-slate-200 rounded" />
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <div className="border-b border-slate-200 pb-0.5">
              <div className="h-2 w-16 bg-slate-900 rounded mb-0.5" />
              <div className="h-1 w-10 bg-slate-400 rounded" />
            </div>
            <div className="space-y-1 pl-1.5 border-l border-slate-300">
              <div className="h-1 w-full bg-slate-200 rounded" />
              <div className="h-1 w-4/5 bg-slate-200 rounded" />
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
    desc: "Sidebar gelap dengan konten utama terang. Visual tegas cocok untuk peran teknologi & multimedia.",
    preview: (
      <div className="w-full rounded-lg border overflow-hidden shadow-2xs text-[8px] leading-tight flex bg-white">
        <div className="w-1/3 bg-slate-800 p-2 space-y-1.5">
          <div className="size-5 rounded-full bg-white/30 mx-auto mb-1" />
          <div className="h-1 w-full bg-white/40 rounded" />
          <div className="h-1 w-3/4 bg-white/20 rounded" />
          <div className="h-1 w-full bg-white/20 rounded" />
        </div>
        <div className="flex-1 p-2 space-y-1">
          <div className="h-1.5 w-14 bg-slate-800 rounded mb-0.5" />
          <div className="h-1 w-full bg-slate-200 rounded" />
          <div className="h-1 w-4/5 bg-slate-200 rounded" />
        </div>
      </div>
    ),
  },
  {
    id: "minimal",
    name: "Minimal Elegant",
    tag: "Free · Editorial Klasik",
    desc: "Tipografi tegas dengan batas tipis dan whitespace luas. Memberi impresi profesional berwibawa.",
    preview: (
      <div className="w-full rounded-lg border bg-white p-3 text-[8px] leading-tight shadow-2xs font-serif">
        <div className="flex justify-between items-start border-b border-slate-800 pb-1.5 mb-1.5">
          <div>
            <div className="h-2 w-20 bg-slate-900 rounded mb-0.5" />
            <div className="h-1 w-14 bg-slate-400 rounded" />
          </div>
          <div className="text-right space-y-0.5">
            <div className="h-1 w-10 bg-slate-300 rounded" />
          </div>
        </div>
        <div className="space-y-1">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2">
              <div className="w-8 shrink-0 h-1 bg-slate-400 rounded mt-0.5" />
              <div className="flex-1 space-y-0.5">
                <div className="h-1 w-full bg-slate-200 rounded" />
                <div className="h-1 w-3/4 bg-slate-200 rounded" />
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
    try {
      await downloadCvPdf(profile, selected, (msg) => {
        toast.error("Gagal membuat PDF otomatis", {
          description: `${msg}. Anda dapat menggunakan opsi 'Cetak / Simpan PDF Browser'.`,
        });
      });
      toast.success("CV berhasil diunduh!");
    } catch {
      toast.error("Gagal mengunduh CV. Coba opsi Cetak Browser.");
    } finally {
      setDownloading(false);
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
          className="gap-1.5 text-xs font-semibold text-slate-700"
        >
          <Eye className="size-3.5" />
          Pratinjau CV
        </Button>
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
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs hover:-translate-y-0.5"
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
            <span
              className={cn(
                "mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold w-fit",
                tpl.id === "ats"
                  ? "bg-slate-900 text-white"
                  : tpl.id === "modern"
                  ? "bg-[#EBD6CB] text-slate-900"
                  : "bg-slate-100 text-slate-600"
              )}
            >
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
              {selected === "modern" ? <Sparkles className="size-5" /> : <FileText className="size-5" />}
            </div>
            <div>
              <p className="font-semibold text-sm text-[#111827]">
                Template Terpilih: <span className="text-slate-900 font-bold">{selectedTpl.name}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed max-w-sm">
                {selectedTpl.desc}
              </p>
              {selected === "ats" ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-700 font-medium">
                  <ShieldCheck className="size-3.5 text-emerald-600" /> Format ini 100% kompatibel dengan parser ATS (Workday, Taleo, Greenhouse, dll.)
                </p>
              ) : selected === "modern" ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-indigo-700 font-medium">
                  <Sparkles className="size-3.5 text-indigo-600" /> Dilengkapi timeline visual dan aksen pastel modern untuk portfolio.
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
              <Printer className="size-3.5" /> Cetak / Simpan PDF
            </Button>
            <Button
              onClick={() => void handleDownload()}
              disabled={downloading}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold rounded-xl px-5 text-xs"
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
          <strong>Rekomendasi Pemilihan:</strong> Gunakan <strong>ATS Friendly</strong> saat melamar pekerjaan melalui portal karir formal atau LinkedIn Job posting. Gunakan <strong>Creative Design</strong> jika mengirim CV via email langsung ke user, tim desain, startup, atau saat interview tatap muka.
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
                <Printer className="size-3.5" /> Cetak
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleDownload()}
                disabled={downloading}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white gap-1 text-xs"
              >
                <Download className="size-3.5" /> Unduh
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
