"use client";

import { memo, useEffect, useRef, useState, useTransition } from "react";
import {
  Download,
  Printer,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  FileText,
  Columns,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

// ─── Template Meta Definitions ───────────────────────────────────────────────

interface CvTemplateMeta {
  id: CvTemplateId;
  name: string;
  tag: string;
  shortDesc: string;
  recommendedRole: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TEMPLATES: CvTemplateMeta[] = [
  {
    id: "ats",
    name: "ATS Friendly",
    tag: "Standar HR",
    shortDesc: "Format standar teks lolos scanner ATS (Workday, Taleo, Greenhouse).",
    recommendedRole: "Portal Karir & Korporasi",
    icon: ShieldCheck,
  },
  {
    id: "modern",
    name: "Creative Modern",
    tag: "Visual Portfolio",
    shortDesc: "Aksen pastel peach, avatar bundar, 2-kolom & timeline pengalaman.",
    recommendedRole: "Startup, Tech & Agensi Kreatif",
    icon: Sparkles,
  },
  {
    id: "sidebar",
    name: "Sidebar Dark",
    tag: "Kontras Tinggi",
    shortDesc: "Sidebar navy gelap dengan konten utama terang.",
    recommendedRole: "Engineering, Data & Tech Lead",
    icon: Columns,
  },
  {
    id: "minimal",
    name: "Minimal Elegant",
    tag: "Editorial",
    shortDesc: "Tipografi serif klasik dengan whitespace luas.",
    recommendedRole: "Konsultan, Finansial & Akademik",
    icon: FileText,
  },
];

// ─── Invisible Print Helper ───────────────────────────────────────────────────

function triggerIframePrint(htmlContent: string) {
  let iframe = document.getElementById("cv-hidden-print-iframe") as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "cv-hidden-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
  }
  iframe.srcdoc = htmlContent;
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
      } catch {
        // Fallback popup if iframe print is blocked
        const win = window.open("", "_blank");
        if (win) {
          win.document.open();
          win.document.write(htmlContent);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 300);
        }
      }
    }, 250);
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const CvDownload = memo(function CvDownload({ profile }: { profile: CvProfile }) {
  const [selected, setSelected] = useState<CvTemplateId>("ats");
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(0.7);
  const [, startTransition] = useTransition();

  // Debounced/Deferred live HTML generation to keep typing silky smooth
  const [renderedHtml, setRenderedHtml] = useState(() => buildCvHtml(profile, selected));

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setRenderedHtml(buildCvHtml(profile, selected));
      });
    }, 180);
    return () => clearTimeout(timer);
  }, [profile, selected]);

  const activeTpl = TEMPLATES.find((t) => t.id === selected) ?? TEMPLATES[0];

  const handleDownload = async () => {
    setDownloading(true);
    let directDownloaded = false;

    try {
      const res = await fetch("/api/cv/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, templateId: selected }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const safeName = `proofylink-cv-${(profile.fullName || "kandidat").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${selected}.pdf`;
        link.href = url;
        link.download = safeName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("CV berhasil diunduh sebagai PDF!");
        directDownloaded = true;
      }
    } catch {
      // Fallback below
    } finally {
      setDownloading(false);
    }

    if (!directDownloaded) {
      toast.info("Menyiapkan dokumen — silakan pilih 'Simpan sebagai PDF' pada dialog cetak.", {
        duration: 4500,
      });
      triggerIframePrint(renderedHtml);
    }
  };

  const handlePrint = () => {
    toast.info("Membuka dialog cetak dokumen...");
    triggerIframePrint(renderedHtml);
  };

  const adjustZoom = (delta: number) => {
    setZoomScale((prev) => Math.min(1.3, Math.max(0.4, +(prev + delta).toFixed(2))));
  };

  const resetZoom = () => setZoomScale(0.7);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Allow CTRL + Scroll Wheel zoom when hovering over preview canvas
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        setZoomScale((prev) => Math.min(1.3, Math.max(0.4, +(prev + delta).toFixed(2))));
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/70 shadow-xs">
      {/* Top Control Bar */}
      <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-white p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#7C3AED]/10 text-[#7C3AED]">
              <activeTpl.icon className="size-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                Pratinjau Live &amp; Unduh CV
              </h3>
              <p className="text-[11px] text-muted-foreground truncate">
                Disinkronkan otomatis dengan form profil Anda
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setPreviewOpen(true)}
              className="size-8 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:bg-purple-50 hover:text-[#7C3AED] transition-colors"
              aria-label="Tampilan Layar Penuh"
              title="Buka Pratinjau Layar Penuh"
            >
              <Maximize2 className="size-3.5" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handlePrint}
              className="size-8 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:bg-purple-50 hover:text-[#7C3AED] transition-colors"
              aria-label="Cetak CV"
              title="Cetak / Simpan via Browser"
            >
              <Printer className="size-3.5" />
            </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => void handleDownload()}
                disabled={downloading}
                className="h-8 rounded-lg bg-[#7C3AED] px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#6D28D9] transition-transform active:scale-95"
              >
                {downloading ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Menyiapkan...
                  </>
                ) : (
                  <>
                    <Download className="size-3.5 mr-1.5" />
                    Unduh PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Template Switcher Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-xl bg-slate-100/90 p-1">
            {TEMPLATES.map((tpl) => {
              const isCurrent = selected === tpl.id;
              const Icon = tpl.icon;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelected(tpl.id)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-lg px-2.5 py-1.5 text-left transition-all",
                    isCurrent
                      ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="flex items-center gap-1 text-xs font-bold truncate">
                      <Icon className={cn("size-3.5 shrink-0", isCurrent ? "text-[#7C3AED]" : "text-slate-400")} />
                      {tpl.name}
                    </span>
                    {isCurrent && <CheckCircle2 className="size-3 text-[#7C3AED]" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {tpl.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Zoom & Quick Controls Bar */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/90 px-3.5 py-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
            <span className="font-semibold text-slate-800">{activeTpl.name}</span>
            <span className="text-[10px] text-slate-400">&bull; A4 (210 &times; 297 mm)</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono font-semibold text-slate-700 px-1">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => adjustZoom(-0.1)}
              disabled={zoomScale <= 0.4}
              className="rounded p-1 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors disabled:opacity-40"
              title="Perkecil (Ctrl + Scroll)"
              aria-label="Perkecil"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              className="rounded p-1 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
              title="Reset Zoom (70%)"
              aria-label="Reset zoom"
            >
              <RotateCcw className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => adjustZoom(0.1)}
              disabled={zoomScale >= 1.3}
              className="rounded p-1 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors disabled:opacity-40"
              title="Perbesar (Ctrl + Scroll)"
              aria-label="Perbesar"
            >
              <ZoomIn className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Live Canvas Viewport with Unrestricted 2D Scrolling */}
        <div
          ref={canvasRef}
          className="relative flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/70"
          title="Gunakan Ctrl + Scroll untuk Zoom In/Out"
        >
          <div className="min-w-full min-h-full flex">
            {/* Sized Wrapper to inform the scroll container of the scaled document boundaries */}
            <div
              className="m-auto shrink-0 transition-[width,height] duration-150 ease-out py-2"
              style={{
                width: `${Math.round(794 * zoomScale)}px`,
                height: `${Math.round(1123 * zoomScale)}px`,
              }}
            >
              <div
                className="origin-top-left transition-transform duration-150 ease-out"
                style={{
                  transform: `scale(${zoomScale})`,
                  width: "794px",
                  height: "1123px",
                }}
              >
                <div className="relative h-[1123px] w-[794px] overflow-hidden rounded-md border border-slate-300/80 bg-white shadow-xl">
                  <iframe
                    srcDoc={renderedHtml}
                    title={`Live Preview CV - ${activeTpl.name}`}
                    className="h-full w-full border-0 bg-white select-none pointer-events-none"
                    tabIndex={-1}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Meta & Tip */}
        <div className="border-t border-slate-200/80 bg-white px-4 py-2 text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-800">
              {activeTpl.name}:
            </span>
            <span>{activeTpl.shortDesc}</span>
          </div>
          <div className="text-[10px] font-medium text-slate-400">
            A4 &bull; 210 &times; 297 mm
          </div>
        </div>

        {/* Fullscreen Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-5xl h-[92vh] flex flex-col p-4 sm:p-6">
            <DialogHeader className="flex flex-row items-center justify-between border-b pb-3 pr-6">
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Pratinjau Layar Penuh &mdash; {activeTpl.name}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {activeTpl.tag}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Dokumen persis seperti yang akan dihasilkan saat diekspor ke PDF.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handlePrint}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Printer className="size-3.5" />
                  Cetak Dokumen
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleDownload()}
                  disabled={downloading}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white gap-1.5 text-xs font-semibold shadow-xs"
                >
                  {downloading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Download className="size-3.5" />
                  )}
                  Unduh PDF
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 w-full overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-4 sm:p-6 flex justify-center dark:border-slate-800 dark:bg-slate-950">
              <div className="w-[794px] min-h-[1123px] rounded-md bg-white shadow-2xl border border-slate-300/80 overflow-hidden">
                <iframe
                  srcDoc={renderedHtml}
                  title="Fullscreen CV Preview"
                  className="w-full h-full min-h-[1123px] border-0 bg-white"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
});

