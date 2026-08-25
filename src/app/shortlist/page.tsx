"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, Check, Download, FileText, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { candidates } from "@/data/candidates";
import { useApp } from "@/providers/app-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";

const consentLabels: Record<string, { label: string; className: string }> = {
  "pending-candidate-consent": { label: "Menunggu consent", className: "border-amber-200 bg-amber-50 text-amber-800" },
  consented: { label: "Consent diberikan", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  "screening-completed": { label: "Screening selesai", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  declined: { label: "Ditolak", className: "border-red-200 bg-red-50 text-red-700" },
};

export default function Shortlist() {
  const { shortlisted, scans, notes, saveNote, toggleShortlist, screeningConsents, requestConsentBatch, user, dbMode, bootstrapped, databaseError, shortlists } = useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!user || user.role !== "recruiter") return <ProtectedRoute role="recruiter"><div /></ProtectedRoute>;
  if (dbMode && !bootstrapped) return <div className="container mx-auto px-4 py-8"><div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground" role="status">Memuat shortlist...</div></div>;
  if (dbMode && databaseError) return <div className="container mx-auto px-4 py-8"><div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700" role="alert">Shortlist belum dapat dimuat. {databaseError}</div></div>;

  const ids = [...new Set([...shortlisted, ...scans.map((scan) => scan.candidateId)])];
  const remoteItems = shortlists.flatMap((shortlist) => shortlist.items).filter((item) => item.status === "active");
  const list = dbMode
    ? remoteItems.filter((item) => item.candidate).map((item) => ({ id: item.candidateProfileId, name: item.candidate?.name ?? "Nama kandidat belum tersedia", role: item.candidate?.role ?? "Role belum tersedia", location: item.candidate?.location ?? "Lokasi belum tersedia", experience: 0, skills: [], availability: "", salary: "", notes: item.notes ?? "", itemId: item.id }))
    : candidates.filter((candidate) => ids.includes(candidate.id)).map((candidate) => ({ ...candidate, notes: notes[candidate.id] ?? "", itemId: undefined }));
  const selectedCandidates = list.filter((candidate) => selected.includes(candidate.id));
  const pending = list.filter((candidate) => screeningConsents[candidate.id] === "pending-candidate-consent").length;

  const toggleSelected = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const requestSelectedConsent = async () => { if (await requestConsentBatch(selectedCandidates.map((candidate) => candidate.id))) { setSelected([]); setDialogOpen(false); } };
  const exportCsv = () => {
    const rows = [["Name", "Role", "Location", "Experience", "Skills", "Availability", "Salary", "Notes"], ...list.map((candidate) => [candidate.name, candidate.role, candidate.location, String(candidate.experience), candidate.skills.join(" | "), candidate.availability, candidate.salary, candidate.notes])];
    const blob = new Blob([rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "proofylink-shortlist.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Shortlist berhasil diekspor");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col justify-between gap-4 border-b pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-[#7C3AED]">Workspace Recruiter</p>
          <h1 className="mt-2 text-3xl font-bold">Shortlist</h1>
          <p className="mt-2 text-muted-foreground">Pilih kandidat untuk mengatur consent dan langkah screening berikutnya.</p>
        </div>
        {list.length > 0 && (
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4" /> Ekspor CSV
          </Button>
        )}
      </div>

      {list.length > 0 && (
        <div className="mt-6 flex flex-col justify-between gap-3 rounded-2xl border border-purple-200 bg-purple-50/50 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold">{selected.length ? `${selected.length} kandidat dipilih` : "Consent kandidat"}</p>
            <p className="text-sm text-muted-foreground">{pending ? `${pending} permintaan sedang menunggu jawaban.` : "Pilih kandidat untuk mengirim permintaan consent secara bersamaan."}</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} disabled={!selected.length}>
            <Send className="size-4" /> Minta consent
          </Button>
        </div>
      )}

      {list.length ? (
        <div className="mt-8 flex flex-col gap-4">
          {list.map((candidate) => {
            const status = consentLabels[screeningConsents[candidate.id]] ?? { label: "Belum diminta", className: "border-slate-200 bg-slate-50 text-slate-700" };
            const selectable = shortlisted.includes(candidate.id);
            return (
              <Card key={candidate.id} className={selected.includes(candidate.id) ? "border-[#7C3AED] shadow-md" : ""}>
                <CardContent className="grid gap-4 p-5 md:grid-cols-[auto_1fr_1.4fr_auto] md:items-center">
                  <label className="flex items-center justify-center">
                    <input type="checkbox" className="size-4 accent-[#7C3AED]" checked={selected.includes(candidate.id)} disabled={!selectable} onChange={() => toggleSelected(candidate.id)} aria-label={`Pilih ${candidate.name}`} />
                  </label>
                  <div>
                    <p className="font-semibold">{candidate.name}</p>
                    <p className="text-sm text-muted-foreground">{candidate.role} · {candidate.location}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{selectable ? "Dalam Shortlist" : "Profil dibuka"}</p>
                  </div>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Input defaultValue={candidate.notes} onBlur={(event) => saveNote(candidate.id, event.target.value)} placeholder="Catatan recruiter..." className="pl-9" />
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <Badge className={status.className}>
                      {screeningConsents[candidate.id] === "consented" || screeningConsents[candidate.id] === "screening-completed" ? <Check className="mr-1 size-3" /> : null}
                      {status.label}
                    </Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleShortlist(candidate.id)}>
                        <Trash2 className="size-3" /> Hapus
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <Link
                          href={
                            screeningConsents[candidate.id] === "screening-completed"
                              ? `/recruiter/screenings/${candidate.id}`
                              : `/recruiter/screenings/new?candidateId=${candidate.id}`
                          }
                        >
                          Screening
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Bookmark}
          title={dbMode && remoteItems.length ? "Profil kandidat shortlist tidak ditemukan di database." : "Belum ada kandidat di shortlist."}
          className="mt-8 border-dashed"
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kirim permintaan consent?</DialogTitle>
            <DialogDescription>
              Permintaan akan dibuat untuk {selectedCandidates.length} kandidat yang dipilih. Kandidat tetap memegang kendali sebelum screening dimulai.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-muted p-4 text-sm">
            {selectedCandidates.map((candidate) => (
              <p key={candidate.id} className="py-1 font-medium">
                {candidate.name} <span className="font-normal text-muted-foreground">· {candidate.role}</span>
              </p>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={requestSelectedConsent}>Kirim permintaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
