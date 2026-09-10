"use client";

import { useState } from "react";
import {
  Banknote,
  Calendar,
  CheckCircle2,
  FileCheck2,
  Gift,
  Loader2,
} from "lucide-react";
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
import type { Candidate } from "@/types";

export function CreateOfferModal({
  open,
  onOpenChange,
  candidate,
  applicationId,
  onOfferSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate;
  applicationId?: string;
  onOfferSent?: () => void;
}) {
  const { dbMode } = useApp();

  const [startDate, setStartDate] = useState(() =>
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [expirationDate, setExpirationDate] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );

  // Extract initial numerical salary estimate from candidate.salary if present (e.g. "Rp 15.000.000")
  const initialSalaryNumber = candidate.salary
    ? candidate.salary.replace(/[^0-9]/g, "")
    : "15000000";

  const [salary, setSalary] = useState(
    initialSalaryNumber ? parseInt(initialSalaryNumber, 10) || 15000000 : 15000000
  );
  const [currency, setCurrency] = useState("IDR");
  const [benefits, setBenefits] = useState(
    "• Asuransi Kesehatan Penuh (BPJS & Swasta)\n• Tunjangan Laptop & WFH\n• 15 Hari Cuti Tahunan\n• Program Pengembangan Skill & Kursus"
  );
  const [notes, setNotes] = useState(
    `Selamat bergabung ${candidate.name}! Tim kami sangat terkesan dengan kualifikasi dan pengalaman Anda.`
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salary || salary <= 0) {
      toast.error("Nominal gaji harus valid.");
      return;
    }
    if (!startDate || !expirationDate) {
      toast.error("Tanggal mulai dan batas konfirmasi wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      if (dbMode) {
        const bodyPayload = applicationId
          ? {
              applicationId,
              salary,
              currency,
              startDate,
              expirationDate,
              benefits,
              notes,
            }
          : {
              candidateProfileId: candidate.id,
              salary,
              currency,
              startDate,
              expirationDate,
              benefits,
              notes,
            };

        const res = await fetch("/api/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
        });

        const data = (await res.json()) as { offer?: { id: string }; error?: string };
        if (!res.ok || !data.offer) {
          throw new Error(data.error ?? "Gagal menerbitkan surat penawaran kerja.");
        }
      }

      toast.success("Surat penawaran kerja (Offer Letter) berhasil dikirim!", {
        description: `Kandidat ${candidate.name} telah menerima notifikasi dan formulir penerimaan satu klik.`,
      });

      onOpenChange(false);
      onOfferSent?.();
    } catch (err) {
      toast.error("Gagal mengirim offer", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <FileCheck2 className="size-4" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold">
                Buat Surat Penawaran Kerja (Offer)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Kirim penawaran kerja terstruktur dengan fitur digital 1-click acceptance untuk{" "}
                <span className="font-semibold text-foreground">{candidate.name}</span>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-sm">
          {/* Salary & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Banknote className="size-3.5 text-emerald-600" />
                Gaji Pokok / Bulan
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">
                  Rp
                </span>
                <input
                  type="number"
                  step="500000"
                  min="1000000"
                  value={salary}
                  onChange={(e) => setSalary(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Ekspektasi kandidat:{" "}
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {candidate.salary || "N/A"}
                </span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Mata Uang</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              >
                <option value="IDR">IDR (Rp)</option>
                <option value="USD">USD ($)</option>
                <option value="SGD">SGD (S$)</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-[#7C3AED]" />
                Tanggal Mulai Bekerja
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-amber-600" />
                Batas Waktu Konfirmasi
              </label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                required
              />
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Gift className="size-3.5 text-violet-600" />
              Daftar Benefit & Fasilitas
            </label>
            <textarea
              rows={4}
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="Tuliskan benefit per baris..."
              className="w-full rounded-md border border-input bg-background p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Catatan Tambahan & Pesan Sambutan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Pesan selamat atau petunjuk persiapan kerja..."
              className="w-full rounded-md border border-input bg-background p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          {/* One-Click Notice Banner */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-semibold">Format Penawaran Dover 1-Click Acceptance</p>
                <p className="mt-0.5 text-muted-foreground text-[11px]">
                  Kandidat dapat langsung menyetujui penawaran ini dengan 1-klik di portal kandidat.
                  Setelah disetujui, status aplikasi otomatis diperbarui menjadi{" "}
                  <strong>Hired / Diterima</strong>.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Kirim Surat Penawaran
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
