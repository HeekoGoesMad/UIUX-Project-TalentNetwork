"use client";

import { useState } from "react";
import { ShieldCheck, Building2, Link as LinkIcon, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type EducationItem } from "@/types";
import { useApp } from "@/providers/app-provider";

interface RequestVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEducation?: EducationItem | null;
}

function VerificationForm({
  onClose,
  initialEducation,
}: {
  onClose: () => void;
  initialEducation?: EducationItem | null;
}) {
  const {
    requestCampusVerification,
    recommendCampus,
    isPartnerCampus,
    approvedPartnerCampuses,
    cvProfile,
  } = useApp();
  const fallbackEdu = cvProfile?.education?.[0];

  const [institution, setInstitution] = useState(initialEducation?.school || fallbackEdu?.school || "");
  const [program, setProgram] = useState(initialEducation?.program || fallbackEdu?.program || "");
  const [year, setYear] = useState(initialEducation?.dates || fallbackEdu?.dates || "2024");
  const [proofNote, setProofNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isPartner = isPartnerCampus(institution);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution.trim()) return;

    if (!isPartner) {
      await handleRecommend();
      return;
    }

    setSubmitting(true);
    try {
      await requestCampusVerification({
        institution: institution.trim(),
        program: program.trim() || undefined,
        year: year.trim() || undefined,
        proofDocumentUrl: proofNote.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecommend = async () => {
    if (!institution.trim()) return;
    setSubmitting(true);
    try {
      await recommendCampus(institution.trim(), proofNote.trim() || undefined);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      {/* Institution input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span>Nama Kampus / Institusi</span>
          <span className="text-[10px] text-muted-foreground font-normal">Wajib</span>
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Contoh: ITB STIKOM Bali atau Universitas Indonesia"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            required
            className="pl-9 text-sm"
          />
        </div>

        {/* Quick chips of active partner campuses */}
        {approvedPartnerCampuses.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-muted-foreground">Mitra resmi ProofyLink:</span>
            {approvedPartnerCampuses.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setInstitution(p)}
                className="rounded-md border border-purple-200 bg-purple-50/70 px-2 py-0.5 text-[10px] font-semibold text-[#7C3AED] hover:bg-purple-100 transition-colors cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Partnership status explanation banner */}
      {institution.trim() && (
        <div>
          {isPartner ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800">
              <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
              <span>
                <strong>Mitra Resmi Terdaftar:</strong> Permintaan Anda akan langsung diteruskan ke Career Center <strong>{institution}</strong> untuk diverifikasi.
              </span>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-amber-900">
                <Building2 className="size-4 shrink-0 text-amber-600" />
                <span>Belum Menjadi Mitra Resmi ProofyLink</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>{institution}</strong> saat ini belum memiliki akun kemitraan resmi. Verifikasi profil otomatis hanya dapat diproses oleh Career Center kampus mitra. Rekomendasikan kampus ini agar tim kami segera menjalin kemitraan resmi!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Program & Year Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Program Studi / Jurusan</label>
          <Input
            placeholder="Sistem Informasi"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className="text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Tahun / Periode</label>
          <Input
            placeholder="2020 — 2024"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="text-sm"
          />
        </div>
      </div>

      {/* Proof / Document / Link Note */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span>{isPartner ? "NIM / Tautan Bukti Kredensial (Opsional)" : "Kontak Career Center / Catatan (Opsional)"}</span>
          <span className="text-[10px] text-muted-foreground font-normal">Opsional</span>
        </label>
        <div className="relative">
          <LinkIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={isPartner ? "Contoh: NIM 23001001 atau link sertifikat" : "Contoh: careercenter@kampus.ac.id"}
            value={proofNote}
            onChange={(e) => setProofNote(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <p className="text-[11px] text-muted-foreground leading-normal">
          {isPartner
            ? "Informasi ini diteruskan ke admin mitra kampus Anda untuk memvalidasi status mahasiswa/alumni."
            : "Data ini membantu tim ProofyLink menghubungi perwakilan kampus yang tepat."}
        </p>
      </div>

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={submitting}
          className="text-xs"
        >
          Batal
        </Button>
        {isPartner ? (
          <Button
            type="submit"
            disabled={submitting || !institution.trim()}
            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-semibold"
          >
            {submitting ? "Mengirim Permintaan..." : "Kirim Permintaan Verifikasi"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleRecommend}
            disabled={submitting || !institution.trim()}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold gap-1.5"
          >
            <Sparkles className="size-3.5 text-amber-300" />
            {submitting ? "Mengirim Rekomendasi..." : "Rekomendasikan Kampus Ini"}
          </Button>
        )}
      </DialogFooter>
    </form>
  );
}

export function RequestVerificationDialog({
  open,
  onOpenChange,
  initialEducation,
}: RequestVerificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] mb-1">
            <ShieldCheck className="size-5" />
          </div>
          <DialogTitle className="text-xl">Verifikasi Institusi Kampus</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Dapatkan lencana resmi terverifikasi melalui Career Center kampus mitra. Untuk kampus yang belum bermitra, Anda dapat mengirim rekomendasi agar kemitraan segera dibuka.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <VerificationForm
            onClose={() => onOpenChange(false)}
            initialEducation={initialEducation}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
