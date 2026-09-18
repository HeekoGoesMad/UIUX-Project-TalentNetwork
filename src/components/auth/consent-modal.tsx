"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, CheckCircle2, FileText, Lock, ShieldCheck } from "lucide-react";

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  initialStep?: 1 | 2;
  actionTitle?: string;
}

export function ConsentModal({ isOpen, onClose, onAccept, initialStep = 1, actionTitle }: ConsentModalProps) {
  const [step, setStep] = useState<1 | 2>(initialStep);

  const handleNext = () => {
    setStep(2);
  };

  const handlePrev = () => {
    setStep(1);
  };

  const handleClose = () => {
    setStep(initialStep);
    onClose();
  };

  const handleFinalAgree = () => {
    setStep(initialStep);
    onAccept();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl sm:max-w-2xl max-h-[88dvh] flex flex-col p-0 overflow-hidden rounded-2xl border-slate-200 shadow-2xl">
        {/* Distilled Minimal Header */}
        <div className="border-b border-slate-100 p-5 sm:p-6 shrink-0 bg-white">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] bg-purple-50 px-2.5 py-1 rounded-full">
              <ShieldCheck className="size-3.5" />
              {step === 1 ? "Langkah 1 dari 2: Ketentuan & Akses Data" : "Langkah 2 dari 2: Kebijakan Privasi"}
            </span>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <div className={`h-1.5 w-7 rounded-full transition-colors ${step === 1 ? "bg-[#7C3AED]" : "bg-emerald-500"}`} />
              <div className={`h-1.5 w-7 rounded-full transition-colors ${step === 2 ? "bg-[#7C3AED]" : "bg-slate-200"}`} />
            </div>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900">
            {step === 1 ? "Syarat, Ketentuan & Persetujuan Akses Data" : "Kebijakan Privasi & Perlindungan Data"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            {step === 1
              ? "Tinjau transparansi akses data profil sebelum melanjutkan registrasi akun."
              : "Prinsip perlindungan privasi dan hak kendali penuh atas data Anda."}
          </DialogDescription>
        </div>

        {/* Scrollable Document Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {step === 1 ? (
            <>
              {/* Highlight Box: Primary Data Access Consent */}
              <div className="rounded-xl border border-purple-200/80 bg-purple-50/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
                  <ShieldCheck className="size-3.5 shrink-0" />
                  <span>Pernyataan Persetujuan Akses Data</span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-800 font-medium leading-relaxed">
                  Saat mendaftar, Anda menyetujui bahwa data kualifikasi, riwayat, dan framework kompetensi profil Anda dapat diakses oleh DJoin serta rekruter terverifikasi untuk evaluasi kualifikasi dan penawaran karier yang relevan.
                </p>
              </div>

              {/* Distilled Terms Sections */}
              <div className="space-y-3.5 pt-1">
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <FileText className="size-3.5 text-[#7C3AED] shrink-0" />
                    1. Integritas Data &amp; Kualifikasi
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-5.5">
                    Talenta wajib memberikan informasi kualifikasi, riwayat pekerjaan, dan kontak yang valid serta dapat dipertanggungjawabkan.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <Lock className="size-3.5 text-[#7C3AED] shrink-0" />
                    2. Kerahasiaan &amp; Akses Terverifikasi
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-5.5">
                    Hanya perusahaan dan rekruter berstatus terverifikasi yang berhak mengakses profil dan framework kompetensi kandidat.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <ShieldCheck className="size-3.5 text-[#7C3AED] shrink-0" />
                    3. Validasi Afiliasi Kampus
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-5.5">
                    Bagi talenta jalur Career Center, status kelulusan dan kompetensi divalidasi oleh institusi partner untuk penerbitan badge resmi.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Distilled Privacy Sections */}
              <div className="space-y-3.5 pt-1">
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <Lock className="size-3.5 text-emerald-600 shrink-0" />
                    1. Data yang Dikumpulkan
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-5.5">
                    Informasi identitas dasar (nama, kontak email), resume/portofolio, serta framework kompetensi teknis dan interpersonal yang Anda masukkan secara sukarela.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <FileText className="size-3.5 text-emerald-600 shrink-0" />
                    2. Tujuan Penggunaan
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-5.5">
                    Data diproses semata-mata untuk pencocokan kandidat dengan kebutuhan rekruter, evaluasi sinyal talenta, dan notifikasi peluang karier resmi.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    3. Hak Kendali Pengguna
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-5.5">
                    Anda memiliki hak penuh untuk mengubah status visibilitas akun (*Open to Work* atau nonaktif), menyunting portofolio, atau menghapus profil Anda kapan pun.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Navigation */}
        <DialogFooter className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-row items-center justify-between gap-2.5 shrink-0">
          {step === 1 ? (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={handleClose} className="text-xs text-slate-500 hover:text-slate-800">
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white gap-2 font-semibold shadow-2xs text-xs sm:text-sm h-9 sm:h-10 px-4 rounded-xl cursor-pointer"
              >
                Lanjut ke Kebijakan Privasi
                <ArrowRight className="size-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" size="sm" onClick={handlePrev} className="gap-1.5 text-slate-700 text-xs sm:text-sm h-9 sm:h-10 px-4 rounded-xl cursor-pointer">
                <ArrowLeft className="size-3.5" />
                Kembali
              </Button>
              <Button
                type="button"
                onClick={handleFinalAgree}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-bold shadow-2xs text-xs sm:text-sm h-9 sm:h-10 px-4 rounded-xl cursor-pointer"
              >
                <CheckCircle2 className="size-3.5" />
                {actionTitle ? `Saya Setuju & ${actionTitle}` : "Saya Setuju & Lanjutkan"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
