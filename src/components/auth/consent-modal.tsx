"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, CheckCircle2, FileText, Lock, ShieldCheck, Sparkles } from "lucide-react";

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  initialStep?: 1 | 2;
}

export function ConsentModal({ isOpen, onClose, onAccept, initialStep = 1 }: ConsentModalProps) {
  const [step, setStep] = useState<1 | 2>(initialStep);

  const handleNext = () => {
    setStep(2);
  };

  const handlePrev = () => {
    setStep(1);
  };

  const handleFinalAgree = () => {
    onAccept();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border-purple-100 shadow-2xl">
        {/* Header with Step Indicator */}
        <div className="bg-gradient-to-r from-[#7C3AED] to-[#9333EA] p-6 text-white shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full text-purple-50">
              <ShieldCheck className="size-3.5" />
              {step === 1 ? "Tahap 1 dari 2: Ketentuan & Akses Data" : "Tahap 2 dari 2: Kebijakan Privasi"}
            </span>
            <span className="text-xs font-medium text-purple-100">
              Wajib ditinjau sebelum pendaftaran
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-white">
            {step === 1 ? "Syarat, Ketentuan & Persetujuan Akses Data" : "Kebijakan Privasi & Perlindungan Data"}
          </DialogTitle>
          <DialogDescription className="text-purple-100 text-xs mt-1">
            Harap baca dan pahami ketentuan berikut sebelum bergabung dengan Talent Network ProofyLink.
          </DialogDescription>
        </div>

        {/* Scrollable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {step === 1 ? (
            <>
              {/* Highlight Box: FEATURE 8 DATA ACCESS CONSENT */}
              <div className="rounded-xl border-2 border-purple-300 bg-purple-50/80 p-4 space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-[#7C3AED] font-bold text-sm">
                  <Sparkles className="size-4.5 shrink-0" />
                  <span>Persetujuan Akses Data (Data Access Consent)</span>
                </div>
                <p className="font-semibold text-slate-900 leading-snug">
                  Saat registrasi, Anda menyatakan dan menyetujui bahwa:
                </p>
                <blockquote className="border-l-4 border-[#7C3AED] pl-3 py-1 text-slate-800 italic bg-white/80 rounded-r-lg font-medium text-xs sm:text-[13px]">
                  &ldquo;Data yang dimasukkan ke dalam platform dapat diakses oleh DJoin dan recruiter yang telah terverifikasi sesuai Kebijakan Privasi dan Ketentuan Penggunaan yang berlaku.&rdquo;
                </blockquote>
              </div>

              {/* Terms Section 1 */}
              <div className="space-y-2 border-b pb-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <FileText className="size-4 text-[#7C3AED]" /> 1. Ketentuan Penggunaan Platform
                </h4>
                <p className="text-slate-600">
                  ProofyLink menyediakan platform jaringan talenta cerdas yang menghubungkan talenta terverifikasi dari berbagai universitas/institusi dengan rekruter dan perusahaan kredibel. Dengan mendaftar, Anda setuju untuk memberikan data yang akurat, jujur, dan dapat dipertanggungjawabkan.
                </p>
              </div>

              {/* Terms Section 2 */}
              <div className="space-y-2 border-b pb-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Lock className="size-4 text-[#7C3AED]" /> 2. Hak Akses &amp; Kerahasiaan
                </h4>
                <p className="text-slate-600">
                  Data profil, framework kompetensi (Hard Competencies, Tools, Soft Skills), serta riwayat pendidikan dan pengalaman kerja Anda akan ditampilkan kepada rekruter terverifikasi untuk tujuan pencarian talent, screening kualifikasi, dan penawaran kesempatan karier.
                </p>
              </div>

              {/* Terms Section 3 */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-[#7C3AED]" /> 3. Integritas Verifikasi Kampus
                </h4>
                <p className="text-slate-600">
                  Talent yang berafiliasi dengan Career Center kampus partner menyetujui validasi data kelulusan/akademik oleh institusi kampus masing-masing untuk memperoleh badge verifikasi resmi.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Privacy Section 1 */}
              <div className="space-y-2 border-b pb-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Lock className="size-4 text-emerald-600" /> 1. Data Pribadi yang Kami Kumpulkan
                </h4>
                <p className="text-slate-600">
                  Kami mengumpulkan data yang Anda masukkan secara sukarela, termasuk identitas nama, kontak (email &amp; nomor telepon), riwayat pendidikan, riwayat pekerjaan, portofolio, serta framework kompetensi teknis dan interpersonal.
                </p>
              </div>

              {/* Privacy Section 2 */}
              <div className="space-y-2 border-b pb-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <FileText className="size-4 text-emerald-600" /> 2. Tujuan Pemrosesan Data
                </h4>
                <p className="text-slate-600">
                  Data Anda digunakan semata-mata untuk:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
                  <li>Mencocokkan profil Anda dengan kriteria lowongan dari rekruter terpercaya.</li>
                  <li>Melakukan evaluasi kesiapan ATS, ringkasan AI, dan verifikasi kompetensi.</li>
                  <li>Memfasilitasi komunikasi resmi terkait penawaran kerja dan undangan screening.</li>
                  <li>DJoin dan rekruter terverifikasi dapat mengakses data sesuai izin akses yang Anda berikan.</li>
                </ul>
              </div>

              {/* Privacy Section 3 */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" /> 3. Hak Pengguna atas Data
                </h4>
                <p className="text-slate-600">
                  Anda memiliki kendali penuh untuk memperbarui, mengubah status ketersediaan kerja (*Open to Work* / *Not Available*), maupun menghapus profil CV Anda kapan pun melalui dashboard akun.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Navigation */}
        <DialogFooter className="p-4 sm:p-5 bg-slate-50 border-t flex flex-row items-center justify-between gap-3 shrink-0">
          {step === 1 ? (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-slate-500">
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white gap-2 font-semibold shadow-xs"
              >
                Lanjut ke Kebijakan Privasi
                <ArrowRight className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" size="sm" onClick={handlePrev} className="gap-1.5 text-slate-700">
                <ArrowLeft className="size-4" />
                Kembali ke Syarat &amp; Ketentuan
              </Button>
              <Button
                type="button"
                onClick={handleFinalAgree}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-bold shadow-sm"
              >
                <CheckCircle2 className="size-4" />
                Saya Setuju &amp; Lanjutkan Pendaftaran
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
