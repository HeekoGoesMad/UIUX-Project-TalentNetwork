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
    name: "Executive ATS",
    tag: "Standar HR",
    shortDesc: "Format standar teks lolos scanner ATS (Workday, Taleo, Greenhouse). Tipografi serif klasik.",
    recommendedRole: "Portal Karir & Korporasi",
    icon: ShieldCheck,
  },
  {
    id: "modern",
    name: "Contemporary Studio",
    tag: "Startup & Produk",
    shortDesc: "Tata letak kontemporer dengan tipografi modern, pill tags keahlian, dan timeline karir.",
    recommendedRole: "Startup, Product, Tech & Agensi",
    icon: Sparkles,
  },
  {
    id: "sidebar",
    name: "Technical Architecture",
    tag: "Engineering & Data",
    shortDesc: "Split layout terstruktur dengan font monospaced untuk tech stack dan metrik rekayasa.",
    recommendedRole: "Software Engineer, Data & Tech Lead",
    icon: Columns,
  },
  {
    id: "minimal",
    name: "Editorial Swiss",
    tag: "Konsultan & Eksekutif",
    shortDesc: "Disiplin tipografi grid Swiss dengan gutter tanggal terstruktur dan kontras tinggi.",
    recommendedRole: "Konsultan, Finansial & Advisory",
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
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs">
      {/* Top Control Bar */}
      <div className="flex flex-col gap-3 border-b border-border/60 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">
              Pratinjau CV Langsung
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              Tersinkron otomatis secara instan
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setPreviewOpen(true)}
              className="size-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Tampilan layar penuh"
              title="Buka pratinjau layar penuh"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handlePrint}
              className="size-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Cetak CV"
              title="Cetak via browser"
            >
              <Printer className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => void handleDownload()}
              disabled={downloading}
              className="h-8 rounded-md px-3 text-xs font-medium shadow-xs"
            >
              {downloading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Menyiapkan...
                </>
              ) : (
                <>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Unduh PDF
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Template Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-muted/60 p-1.5">
          {TEMPLATES.map((tpl) => {
            const isCurrent = selected === tpl.id;
            const Icon = tpl.icon;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelected(tpl.id)}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-md px-2.5 py-1.5 text-left transition-all min-w-0 w-full overflow-hidden border",
                  isCurrent
                    ? "bg-card text-foreground shadow-xs border-border/80 ring-1 ring-primary/25"
                    : "border-transparent text-muted-foreground hover:bg-card/60 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-1.5 w-full min-w-0">
                  <Icon className={cn("size-3.5 shrink-0", isCurrent ? "text-primary" : "text-muted-foreground")} />
                  <span className="truncate text-xs font-semibold text-foreground">{tpl.name}</span>
                </div>
                <span className="truncate text-[11px] text-muted-foreground/80 pl-5 w-full">
                  {tpl.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Zoom & Quick Controls Bar */}
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-3.5 py-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{activeTpl.name}</span>
          <span className="text-[11px] text-muted-foreground/80">· Standar A4</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="px-1 font-mono text-xs text-muted-foreground">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => adjustZoom(-0.1)}
            disabled={zoomScale <= 0.4}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:opacity-40"
            title="Perkecil (Ctrl + Scroll)"
            aria-label="Perkecil"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
            title="Reset zoom (70%)"
            aria-label="Reset zoom"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => adjustZoom(0.1)}
            disabled={zoomScale >= 1.3}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:opacity-40"
            title="Perbesar (Ctrl + Scroll)"
            aria-label="Perbesar"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Live Canvas Viewport with Unrestricted 2D Scrolling */}
      <div
        ref={canvasRef}
        className="relative flex-1 overflow-auto bg-muted/50 p-4 pb-12 sm:p-6 sm:pb-16"
        title="Gunakan Ctrl + Scroll untuk zoom"
      >
        <div className="flex min-h-full min-w-full">
          {/* Sized Wrapper to inform the scroll container of the scaled document boundaries */}
          <div
            className="m-auto shrink-0 py-2"
            style={{
              width: `${Math.round(794 * zoomScale)}px`,
              height: `${Math.round(1123 * zoomScale)}px`,
            }}
          >
            <div
              className="origin-top-left"
              style={{
                transform: `scale(${zoomScale})`,
                width: "794px",
                height: "1123px",
              }}
            >
              <div className="relative h-[1123px] w-[794px] overflow-hidden rounded-md border bg-white shadow-sm">
                <iframe
                  srcDoc={renderedHtml}
                  title={`Pratinjau CV - ${activeTpl.name}`}
                  className="pointer-events-none h-full w-full select-none border-0 bg-white"
                  tabIndex={-1}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="flex h-[92vh] max-w-5xl flex-col p-4 sm:p-6">
            <DialogHeader className="flex flex-row items-center justify-between border-b pb-3 pr-6">
              <div>
                <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span>Pratinjau — {activeTpl.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {activeTpl.tag}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Tampilan persis seperti hasil ekspor PDF.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handlePrint}
                  className="gap-1.5 rounded-md text-xs font-medium"
                >
                  <Printer className="h-4 w-4" />
                  Cetak
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleDownload()}
                  disabled={downloading}
                  className="gap-1.5 rounded-md text-xs font-medium shadow-xs"
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Unduh PDF
                </Button>
              </div>
            </DialogHeader>

            <div className="flex w-full flex-1 justify-center overflow-auto rounded-md border bg-muted p-4 sm:p-6">
              <div className="min-h-[1123px] w-[794px] overflow-hidden rounded-md border bg-white shadow-sm">
                <iframe
                  srcDoc={renderedHtml}
                  title="Pratinjau CV layar penuh"
                  className="h-full min-h-[1123px] w-full border-0 bg-white"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
});

