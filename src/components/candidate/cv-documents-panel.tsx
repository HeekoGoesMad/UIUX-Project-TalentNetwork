"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, FileText, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Document = { id: string; originalFileName: string; sizeBytes: number; status: string; createdAt: string };
const statusLabels: Record<string, string> = {
  uploaded: "Tersimpan",
  processing: "Memproses",
  review: "Perlu review",
  approved: "Disetujui",
  rejected: "Ditolak",
  deleted: "Dihapus",
};

export function CvDocumentsPanel() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  async function load() {
    const response = await fetch("/api/cv/documents", { cache: "no-store" });
    const body = (await response.json()) as { documents?: Document[]; error?: string };
    if (!response.ok) throw new Error(body.error ?? "Dokumen belum tersedia.");
    setDocuments(body.documents ?? []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((error: unknown) =>
        setMessage(error instanceof Error ? error.message : "Dokumen belum tersedia.")
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function upload(file: File) {
    setBusy(true);
    setMessage("Mengunggah dokumen...");
    const form = new FormData();
    form.set("file", file);
    try {
      const response = await fetch("/api/cv/documents", { method: "POST", body: form });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(body.error ?? "Upload gagal.");
      } else {
        setMessage("Dokumen berhasil diunggah dan tersimpan aman.");
        await load();
      }
    } catch {
      setMessage("Terjadi kesalahan jaringan saat mengunggah dokumen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="overflow-hidden border-border/70 bg-card shadow-xs transition-colors">
      <CardHeader
        className="cursor-pointer px-4 py-3.5 transition-colors hover:bg-muted/30 sm:px-6 sm:py-4"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <FileText className="size-3.5 text-foreground" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Dokumen CV Asli
                </CardTitle>
                <Badge variant="secondary" className="px-2 py-0 text-[11px] font-normal text-muted-foreground">
                  {documents.length} berkas
                </Badge>
              </div>
              {!isExpanded && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Dokumen PDF asli tersimpan privat. Buka untuk mengunggah atau melihat riwayat.
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            aria-label={isExpanded ? "Tutup panel dokumen" : "Buka panel dokumen"}
          >
            <span>{isExpanded ? "Tutup" : "Kelola"}</span>
            {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="border-t border-border/50 px-4 py-4 sm:px-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Unggah file PDF resmi kamu sebagai referensi dokumen arsip pelengkap.
            </p>
            <label
              className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-within:ring-2 focus-within:ring-ring ${
                busy ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <Upload className="size-3.5" />
              <span>{busy ? "Mengunggah..." : "Unggah PDF"}</span>
              <input
                className="sr-only"
                type="file"
                accept="application/pdf,.pdf"
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                  event.target.value = "";
                }}
              />
            </label>
          </div>

          {message && (
            <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground" role="status">
              {message}
            </p>
          )}

          {documents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/80 p-6 text-center">
              <FileText className="mx-auto size-6 text-muted-foreground/60" />
              <p className="mt-2 text-xs font-medium text-foreground">Belum ada dokumen PDF terunggah</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Unggah salinan CV PDF kamu untuk menyimpan cadangan resmi di akunmu.
              </p>
            </div>
          ) : (
            <ul className="grid gap-2">
              {documents.map((document) => (
                <li
                  key={document.id}
                  className="flex flex-col justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium text-foreground">
                      {document.originalFileName}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {Math.ceil(document.sizeBytes / 1024)} KB
                    </span>
                  </div>
                  <Badge variant="secondary" className="w-fit text-[11px] font-normal">
                    {statusLabels[document.status] ?? document.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  );
}

