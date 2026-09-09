"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, FileText, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Document = { id: string; originalFileName: string; sizeBytes: number; status: string; createdAt: string };
const statusLabels: Record<string, string> = { uploaded: "Uploaded", processing: "Processing", review: "Perlu review", approved: "Disetujui", rejected: "Ditolak", deleted: "Dihapus" };

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
      void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Dokumen belum tersedia."));
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
    <Card className="border-border shadow-xs overflow-hidden">
      <CardHeader className="cursor-pointer py-3.5 sm:py-4 hover:bg-slate-50/60 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground">
              Dokumen CV Terunggah
            </CardTitle>
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-[#7C3AED] border border-purple-200">
              {documents.length} berkas
            </span>
          </div>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-medium text-muted-foreground gap-1">
            <span>{isExpanded ? "Sembunyikan" : "Kelola Berkas"}</span>
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>
        {!isExpanded && (
          <p className="text-xs text-muted-foreground mt-0.5">
            PDF tersimpan di storage privat. Klik untuk mengunggah atau melihat riwayat verifikasi.
          </p>
        )}
      </CardHeader>
      {isExpanded && (
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-within:ring-2 focus-within:ring-ring ${busy ? "pointer-events-none opacity-60" : ""}`}>
            <Upload className="size-4" />
            <span>{busy ? "Mengunggah..." : "Upload PDF"}</span>
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
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
        )}
        {documents.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Belum ada file dokumen CV tersimpan. Silakan unggah PDF resmi Anda.
          </p>
        ) : (
          <ul className="grid gap-2">
            {documents.map((document) => (
              <li
                key={document.id}
                className="flex flex-col justify-between gap-2 rounded-lg border border-border p-3 text-sm sm:flex-row sm:items-center"
              >
                <span className="font-medium text-foreground">
                  {document.originalFileName}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {Math.ceil(document.sizeBytes / 1024)} KB
                  </span>
                </span>
                <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-foreground">
                  {statusLabels[document.status] ?? document.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      )}
    </Card>
  );
}
