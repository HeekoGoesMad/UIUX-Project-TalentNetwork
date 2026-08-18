"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Document = { id: string; originalFileName: string; sizeBytes: number; status: string; createdAt: string };
const statusLabels: Record<string, string> = { uploaded: "Uploaded", processing: "Processing", review: "Perlu review", approved: "Disetujui", rejected: "Ditolak", deleted: "Dihapus" };

export function CvDocumentsPanel() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() { const response = await fetch("/api/cv/documents", { cache: "no-store" }); const body = await response.json() as { documents?: Document[]; error?: string }; if (!response.ok) throw new Error(body.error ?? "Dokumen belum tersedia."); setDocuments(body.documents ?? []); }
  useEffect(() => { const timer = window.setTimeout(() => { void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Dokumen belum tersedia.")); }, 0); return () => window.clearTimeout(timer); }, []);
  async function upload(file: File) { setBusy(true); setMessage("Mengunggah dokumen..."); const form = new FormData(); form.set("file", file); const response = await fetch("/api/cv/documents", { method: "POST", body: form }); const body = await response.json() as { error?: string }; if (!response.ok) setMessage(body.error ?? "Upload gagal."); else { setMessage("Dokumen tersimpan sebagai demo aman dan menunggu proses provider."); await load(); } setBusy(false); }
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-4 text-primary" />Dokumen CV</CardTitle><p className="text-sm text-muted-foreground">PDF privat, maksimal 5 MB. Upload development memakai mock storage dan tidak menulis file ke disk.</p></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-3"><label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-within:ring-2 focus-within:ring-ring"><Upload className="size-4" /><span>Upload PDF</span><input className="sr-only" type="file" accept="application/pdf,.pdf" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} /></label><Button asChild variant="outline"><Link href="/candidate/verifications"><ShieldCheck className="size-4" />Lihat status verifikasi</Link></Button></div>{message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}{documents.length === 0 ? <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Belum ada dokumen tersimpan.</p> : <ul className="grid gap-2">{documents.map((document) => <li key={document.id} className="flex flex-col justify-between gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center"><span className="font-medium">{document.originalFileName}<span className="ml-2 font-normal text-muted-foreground">{Math.ceil(document.sizeBytes / 1024)} KB</span></span><span className="rounded-full border px-2.5 py-1 text-xs font-semibold">{statusLabels[document.status] ?? document.status}</span></li>)}</ul>}</CardContent></Card>;
}
