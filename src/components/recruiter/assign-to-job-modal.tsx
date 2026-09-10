"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/providers/app-provider";
import { DEMO_JOBS, type Job } from "@/lib/jobs";
import type { Candidate } from "@/types";

export function AssignToJobModal({
  open,
  onOpenChange,
  candidate,
  onAssigned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate;
  onAssigned?: () => void;
}) {
  const router = useRouter();
  const { dbMode } = useApp();
  const [jobs, setJobs] = useState<Job[]>(() => (!dbMode ? DEMO_JOBS : []));
  const [selectedJobId, setSelectedJobId] = useState<string>(() => (!dbMode && DEMO_JOBS[0] ? DEMO_JOBS[0].id : ""));
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !dbMode) return;
    let active = true;

    setLoadingJobs(true);
    fetch("/api/jobs", { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as { jobs?: Job[] };
        if (active && res.ok && data.jobs) {
          const published = data.jobs.filter((j) => j.status === "published" || j.status === "draft");
          setJobs(published.length > 0 ? published : data.jobs);
          if (published[0]) setSelectedJobId(published[0].id);
        }
      })
      .catch(() => {
        if (active) {
          setJobs(DEMO_JOBS);
          if (DEMO_JOBS[0]) setSelectedJobId(DEMO_JOBS[0].id);
        }
      })
      .finally(() => {
        if (active) setLoadingJobs(false);
      });

    return () => {
      active = false;
    };
  }, [open, dbMode]);

  const handleAssign = async () => {
    if (!selectedJobId) {
      toast.error("Pilih lowongan pekerjaan terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    try {
      if (dbMode) {
        const response = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateProfileId: candidate.id,
            jobId: selectedJobId,
          }),
        });

        if (!response.ok) {
          const err = (await response.json()) as { error?: string };
          throw new Error(err.error ?? "Gagal memasukkan kandidat ke lowongan.");
        }
      }

      const selectedJob = jobs.find((j) => j.id === selectedJobId);
      toast.success(`${candidate.name} berhasil dimasukkan ke pipeline!`, {
        description: `Posisi: ${selectedJob?.title ?? "Lowongan Pekerjaan"}`,
        action: {
          label: "Buka Pipeline",
          onClick: () => router.push("/recruiter/operations"),
        },
      });

      onOpenChange(false);
      onAssigned?.();
    } catch (error) {
      toast.error("Terjadi kendala", {
        description: error instanceof Error ? error.message : "Coba lagi.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Briefcase className="size-5 text-primary" />
            Masukkan ke Pipeline Lowongan
          </DialogTitle>
          <DialogDescription>
            Pindahkan kandidat yang sudah di-scan ini ke alur rekrutmen aktif perusahaan Anda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Kandidat Terpilih</p>
            <p className="mt-1 font-bold text-foreground">{candidate.name}</p>
            <p className="text-xs text-muted-foreground">
              {candidate.role} · {candidate.location}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Pilih Lowongan Pekerjaan
            </label>
            {loadingJobs ? (
              <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Memuat daftar lowongan aktif...
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                Belum ada lowongan aktif. Buat lowongan baru di menu Jobs terlebih dahulu.
              </div>
            ) : (
              <select
                aria-label="Pilih lowongan pekerjaan"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="field w-full text-sm"
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} ({job.location || "Remote"})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" /> Alur Otomatis
            </p>
            <p>
              Kandidat akan mulai di tahap <strong>Screening</strong> pada Hiring Operations Anda dan siap untuk dijadwalkan wawancara atau diberikan penawaran.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={() => void handleAssign()}
            disabled={submitting || loadingJobs || !selectedJobId}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 size-4" /> Masukkan ke Pipeline
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
