/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

export type ImageCropDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  aspectRatio: number; // 1 for avatar (square), 3 for banner (wide)
  cropShape?: "round" | "rect";
  title?: string;
  description?: string;
  onCropComplete: (blob: Blob) => Promise<void> | void;
};

function ImageCropContent({
  imageSrc,
  aspectRatio,
  cropShape = "round",
  title,
  description,
  onClose,
  onCropComplete,
}: {
  imageSrc: string;
  aspectRatio: number;
  cropShape?: "round" | "rect";
  title: string;
  description: string;
  onClose: () => void;
  onCropComplete: (blob: Blob) => Promise<void> | void;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isPending, startTransition] = useTransition();

  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Compute boundaries and clamp pan
  const clampPan = (newX: number, newY: number, currentZoom: number) => {
    if (!viewportRef.current || !imgRef.current) return { x: newX, y: newY };
    const vp = viewportRef.current.getBoundingClientRect();
    const naturalW = imgRef.current.naturalWidth || 1;
    const naturalH = imgRef.current.naturalHeight || 1;

    // Cover scale factor
    const baseRatio = Math.max(vp.width / naturalW, vp.height / naturalH);
    const renderedW = naturalW * baseRatio * currentZoom;
    const renderedH = naturalH * baseRatio * currentZoom;

    const maxPanX = Math.max(0, (renderedW - vp.width) / 2);
    const maxPanY = Math.max(0, (renderedH - vp.height) / 2);

    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, newX)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newY)),
    };
  };

  // Mouse / Touch handlers for dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ x: pan.x, y: pan.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    const clamped = clampPan(panStart.x + deltaX, panStart.y + deltaY, zoom);
    setPan(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture already released
      }
    }
  };

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(1, Math.min(3, newZoom));
    setZoom(clampedZoom);
    setPan((prev) => clampPan(prev.x, prev.y, clampedZoom));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleConfirmCrop = () => {
    if (!viewportRef.current || !imgRef.current) return;

    startTransition(async () => {
      try {
        const vp = viewportRef.current!.getBoundingClientRect();
        const img = imgRef.current!;
        const naturalW = img.naturalWidth || 1;
        const naturalH = img.naturalHeight || 1;

        // Target canvas resolution (high-DPI, crisp export)
        const targetW = cropShape === "round" ? 512 : 1440;
        const targetH = Math.round(targetW / aspectRatio);

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Gagal menginisialisasi canvas untuk crop gambar.");

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        const baseRatio = Math.max(vp.width / naturalW, vp.height / naturalH);
        const renderedW = naturalW * baseRatio * zoom;
        const renderedH = naturalH * baseRatio * zoom;

        const imgX = (vp.width - renderedW) / 2 + pan.x;
        const imgY = (vp.height - renderedH) / 2 + pan.y;

        const scale = targetW / vp.width;

        ctx.drawImage(
          img,
          imgX * scale,
          imgY * scale,
          renderedW * scale,
          renderedH * scale
        );

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), "image/webp", 0.92);
        });

        if (!blob) throw new Error("Gagal mengonversi hasil potongan gambar.");

        await onCropComplete(blob);
        onClose();
      } catch (err) {
        console.error("Gagal melakukan crop gambar:", err);
      }
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      {/* Crop Viewport */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div
          ref={viewportRef}
          className={`relative overflow-hidden bg-slate-900 select-none touch-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          } ${
            aspectRatio === 1
              ? "w-64 h-64 sm:w-72 sm:h-72 rounded-2xl"
              : "w-full max-w-[460px] aspect-[3/1] rounded-xl"
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Pratinjau Crop"
            draggable={false}
            className="pointer-events-none absolute max-w-none origin-center"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isDragging ? "none" : "transform 0.05s ease-out",
            }}
          />

          {/* Circular or rectangular viewfinder overlay */}
          {cropShape === "round" ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="size-56 sm:size-64 rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-0 border-2 border-white/80 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.3)]" />
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Tahan &amp; geser untuk mengatur posisi
        </p>
      </div>

      {/* Zoom & Reset Controls */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => handleZoomChange(zoom - 0.2)}
            disabled={zoom <= 1 || isPending}
            aria-label="Perkecil"
          >
            <ZoomOut className="size-4" />
          </Button>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            disabled={isPending}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#7C3AED]"
            aria-label="Tingkat Pembesaran"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => handleZoomChange(zoom + 0.2)}
            disabled={zoom >= 3 || isPending}
            aria-label="Perbesar"
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs text-muted-foreground"
            onClick={handleReset}
            disabled={isPending || (zoom === 1 && pan.x === 0 && pan.y === 0)}
          >
            <RotateCcw className="size-3.5" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      <DialogFooter className="mt-4 gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button
          type="button"
          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
          onClick={handleConfirmCrop}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <span>Terapkan &amp; Simpan</span>
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  aspectRatio,
  cropShape = "round",
  title = "Sesuaikan Gambar",
  description = "Geser dan sesuaikan zoom untuk mengatur posisi tampilan.",
  onCropComplete,
}: ImageCropDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 sm:max-w-lg">
        {open && imageSrc ? (
          <ImageCropContent
            key={imageSrc}
            imageSrc={imageSrc}
            aspectRatio={aspectRatio}
            cropShape={cropShape}
            title={title}
            description={description}
            onClose={() => onOpenChange(false)}
            onCropComplete={onCropComplete}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
