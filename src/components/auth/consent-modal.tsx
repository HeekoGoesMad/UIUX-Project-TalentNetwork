"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, CheckCircle2, FileText, Lock, ShieldCheck, Scale, AlertTriangle, Coins, Ban } from "lucide-react";
import type { UserRole } from "@/types";
import { RECRUITER_TERMS, CANDIDATE_TERMS } from "@/lib/terms-content";

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  initialStep?: 1 | 2;
  actionTitle?: string;
  role?: UserRole;
}

export function ConsentModal({
  isOpen,
  onClose,
  onAccept,
  initialStep = 1,
  actionTitle,
  role = "recruiter",
}: ConsentModalProps) {
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [prevInitialStep, setPrevInitialStep] = useState<1 | 2>(initialStep);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen || initialStep !== prevInitialStep) {
    setPrevIsOpen(isOpen);
    setPrevInitialStep(initialStep);
    if (isOpen) {
      setStep(initialStep);
    }
  }

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

  const isRecruiter = role === "recruiter";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl sm:max-w-3xl max-h-[90dvh] flex flex-col p-0 overflow-hidden rounded-2xl border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-100 p-5 sm:p-6 shrink-0 bg-white">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] bg-purple-50 px-2.5 py-1 rounded-full">
              <ShieldCheck className="size-3.5" />
              {step === 1
                ? isRecruiter
                  ? "Langkah 1 dari 2: Ketentuan Penggunaan Layanan (Rekruter)"
                  : "Langkah 1 dari 2: Ketentuan Penggunaan Layanan (Kandidat)"
                : "Langkah 2 dari 2: Kebijakan Privasi"}
            </span>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <div
                className={`h-1.5 w-7 rounded-full transition-colors ${
                  step === 1 ? "bg-[#7C3AED]" : "bg-emerald-500"
                }`}
              />
              <div
                className={`h-1.5 w-7 rounded-full transition-colors ${
                  step === 2 ? "bg-[#7C3AED]" : "bg-slate-200"
                }`}
              />
            </div>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            {step === 1
              ? "Ketentuan Penggunaan Layanan ProofyLink Talent Network"
              : "Kebijakan Privasi & Perlindungan Data"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            {step === 1
              ? isRecruiter
                ? "Perjanjian resmi dan mengikat secara hukum antara Perusahaan Klien dan PT Solusi Anak Sakti (Djoin)."
                : "Perjanjian resmi dan mengikat secara hukum antara Anda (Klien/Kandidat) dan PT Solusi Anak Sakti (Djoin)."
              : "Prinsip perlindungan privasi dan hak kendali penuh atas data Anda."}
          </DialogDescription>
        </div>

        {/* Scrollable Document Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {step === 1 ? (
            isRecruiter ? (
              /* ================= RECRUITER TERMS (10 PASAL) ================= */
              <div className="space-y-6">
                {/* Highlight Preamble Banner */}
                <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-4 sm:p-5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
                      <Scale className="size-4 shrink-0" />
                      <span>Perjanjian Pengikatan Hukum Layanan Klien</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-purple-200 font-semibold">
                      NPWP: 0959721861903000
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-800 font-medium leading-relaxed">
                    {RECRUITER_TERMS.preambleNotice}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-purple-200/80">
                    {RECRUITER_TERMS.preambleAgreement}
                  </p>
                </div>

                {/* Quick Anchor Jump Pills */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Navigasi Cepat Pasal:
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar text-xs">
                    {RECRUITER_TERMS.sections.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(`modal-sec-${s.id}`);
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-[#7C3AED] text-slate-700 font-medium text-[11px] transition-colors cursor-pointer"
                      >
                        {s.number}. {s.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 1: Definisi */}
                <div id="modal-sec-definisi" className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">DEFINISI</h3>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Untuk menghindari keraguan penafsiran, istilah-istilah berikut memiliki arti yang spesifik dalam Ketentuan ini:
                  </p>
                  <div className="grid grid-cols-1 gap-2 pl-8">
                    {RECRUITER_TERMS.sections[0].subsections?.map((sub) => (
                      <div key={sub.number} className="rounded-lg bg-slate-50/80 p-2.5 border border-slate-200/70 text-xs">
                        <span className="font-bold text-slate-900 mr-1.5">{sub.number} {sub.title} :</span>
                        <span className="text-slate-600">{sub.content}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Registrasi dan Verifikasi Akun */}
                <div id="modal-sec-registrasi" className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">REGISTRASI DAN VERIFIKASI AKUN</h3>
                  </div>
                  <div className="space-y-3 pl-8">
                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">2.1 Syarat Legalitas</h4>
                      <p className="text-xs text-slate-600">
                        Untuk mengaktifkan akun sebagai Klien, Anda wajib mengunggah dokumen legalitas perusahaan yang sah dan masih berlaku, meliputi:
                      </p>
                      <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
                        <li><strong>Nomor Induk Berusaha (NIB)</strong>;</li>
                        <li><strong>Nomor Pajak Wajib Pajak (NPWP)</strong>.</li>
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">2.2 Proses Verifikasi</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Akun Anda hanya dapat digunakan secara optimal setelah tim Kami selesai memverifikasi keabsahan dokumen legalitas tersebut. Kami berhak menolak pendaftaran dan meminta mengunggah ulang jika dokumen dinilai tidak valid, kedaluwarsa atau mencurigakan.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">2.3 Tujuan Penggunaan</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Anda menjamin bahwa akun ini semata-mata digunakan untuk kepentingan rekrutmen yang sah dan pengelolaan sumber daya manusia, bukan untuk tujuan penipuan, pencurian data, atau tindakan ilegal lainnya.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">2.4 Keamanan Akun</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Klien bertanggung jawab penuh menjaga kerahasiaan nama pengguna (username) dan kata sandi (password) akun Anda. Segala aktivitas, pembelian Token, atau pengunduhan data yang dilakukan melalui akun Klien akan dianggap sebagai aktivitas sah yang dilakukan oleh Klien.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Mekanisme Layanan */}
                <div id="modal-sec-mekanisme-layanan" className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">MEKANISME LAYANAN</h3>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Melalui platform ProofyLink Talent Network, Klien dapat memanfaatkan layanan berikut sesuai dengan kebutuhan:
                  </p>
                  <div className="space-y-3 pl-8">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                      <h4 className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                        <FileText className="size-4 text-[#7C3AED]" />
                        3.1 Penggunaan Layanan Dasar
                      </h4>
                      <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5">
                        <li>
                          Klien dapat melakukan pencarian, penyaringan, dan melihat ringkasan profil Kandidat secara singkat yang telah dipublikasikan di dalam ProofyLink Talent Network tanpa dikenakan biaya tambahan.
                        </li>
                        <li>
                          Klien akan mendapatkan token gratis sesuai kebijakan yang berlaku. Token gratis hanya dapat digunakan untuk membuka Fitur Unlock Profile dasar dan tidak mencakup analisis AI yang terdapat dalam Fitur Unlock Profile.
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-xl border border-purple-200/80 bg-white p-3.5 space-y-3 shadow-2xs">
                      <h4 className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                        <Coins className="size-4 text-[#7C3AED]" />
                        3.2 Penggunaan Fitur Berbayar
                      </h4>
                      <p className="text-xs text-slate-600">
                        Untuk mengakses data lebih lanjut, Klien dapat menggunakan Token yang telah dibayar untuk memotong biaya fitur berikut:
                      </p>
                      <div className="space-y-2.5 pl-2">
                        <div>
                          <strong className="text-xs text-slate-900 font-semibold block mb-0.5">
                            a. Fitur Unlock Profile
                          </strong>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Klien menggunakan Token untuk membuka seluruh detail profil Kandidat (pendidikan lengkap, riwayat pekerjaan, detail kontak) guna melakukan penawaran lebih lanjut. Pemotongan Token untuk fitur ini terjadi secara langsung saat Klien mengklik tombol unlock profile.
                          </p>
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                          <strong className="text-xs text-slate-900 font-semibold block mb-1">
                            b. Fitur Pengecekan Riwayat Kredit
                          </strong>
                          <p className="text-xs text-slate-600 leading-relaxed mb-2">
                            Klien menggunakan Token untuk mengecek latar belakang finansial Kandidat. Penggunaan fitur ini tunduk pada syarat operasional berikut:
                          </p>
                          <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5">
                            <li>
                              <strong className="text-slate-800">Persetujuan Kandidat :</strong> Klien wajib mendapatkan persetujuan eksplisit dari Kandidat sebelum mendapatkan Laporan Kredit Kandidat.
                            </li>
                            <li>
                              <strong className="text-slate-800">Mekanisme Persetujuan :</strong> Klien mengetahui bahwa data riwayat kredit adalah Data Pribadi yang bersifat rahasia sehingga Klien menjamin bahwa sebelum melakukan pengecekan, Klien telah mendapatkan persetujuan yang sah dari Kandidat. Sistem Kami akan mengirimkan notifikasi permintaan persetujuan kepada Kandidat.
                            </li>
                            <li>
                              <strong className="text-slate-800">Pembagian Hasil :</strong> Klien memahami bahwa hasil Laporan Kredit hanya dikirimkan kepada Klien dan tidak mengirimkan hasil Laporan Kredit kepada Kandidat. Namun Klien dilarang menghalangi hak Kandidat untuk melihat laporan mereka sendiri.
                            </li>
                            <li>
                              Token Klien akan dipotong dan proses pengecekan hanya dapat berjalan apabila Kandidat telah memberikan persetujuan kepada Klien.
                            </li>
                            <li>
                              Kami berhak sewaktu-waktu meminta bukti Formulir Persetujuan tersebut kepada Klien untuk keperluan audit. Kegagalan Klien menunjukan bukti tersebut dapat mengakibatkan penghentian layanan.
                            </li>
                            <li>
                              Segala tuntutan hukum yang timbul akibat pengecekan yang dilakukan Klien tanpa sepengetahuan atau persetujuan Kandidat sepenuhnya menjadi tanggung jawab Klien.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Biaya, Pembayaran, dan Kebijakan Pengembalian */}
                <div id="modal-sec-biaya-pembayaran" className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      4
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">BIAYA, PEMBAYARAN, DAN KEBIJAKAN PENGEMBALIAN</h3>
                  </div>
                  <div className="space-y-2.5 pl-8 text-xs text-slate-600">
                    <p>
                      <strong>4.1 Pembelian Token:</strong> Kami menyediakan fitur pembelian atau top-up Token yang dapat dilakukan secara mandiri oleh Klien. Klien dapat memilih Token sesuai kebutuhan dan menyelesaikan pesanan langsung dalam platform ProofyLink Talent Network. Setiap pembelian yang dikonfirmasi melalui akun Klien dianggap sebagai pesanan yang sah dan mengikat.
                    </p>
                    <p>
                      <strong>4.2 Kewajiban Pembayaran:</strong> Biaya hanya akan dikenakan apabila Klien membeli Token untuk menggunakan Fitur Berbayar. Biaya sesuai dengan yang tertera pada halaman checkout di platform serta biaya wajib dibayar lunas di muka (pre-paid).
                    </p>
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                        <AlertTriangle className="size-3.5 text-amber-700 shrink-0" />
                        <span>4.3 Kebijakan Pengembalian Dana (No Refund)</span>
                      </div>
                      <p className="text-xs text-amber-950">
                        Seluruh pembayaran untuk pembelian Token bersifat final, Kami TIDAK melayani pengembalian dana (refund) untuk kondisi berikut:
                      </p>
                      <ul className="list-disc pl-5 text-xs text-amber-900 space-y-1">
                        <li>Sisa Token yang tidak terpakai hingga masa aktif berakhir;</li>
                        <li>Kandidat menolak memberikan persetujuan atas permintaan penggunaan Fitur Pengecekan Riwayat Kredit;</li>
                        <li>Kesalahan Klien dalam memilih jumlah/paket Token;</li>
                        <li>Penghentian sepihak penggunaan ProofyLink Talent Network oleh Klien sebelum Token habis.</li>
                      </ul>
                    </div>
                    <p>
                      <strong>4.4 Perubahan Harga:</strong> Kami berhak untuk mengubah harga layanan sewaktu-waktu dengan menampilkan harga terbaru pada platform. Perubahan harga tidak berlaku surut untuk transaksi yang telah diselesaikan sebelum perubahan tersebut berlaku.
                    </p>
                  </div>
                </div>

                {/* Section 5: Perlindungan Data, Kerahasiaan dan Larangan */}
                <div id="modal-sec-perlindungan-data" className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      5
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">PERLINDUNGAN DATA, KERAHASIAAN DAN LARANGAN</h3>
                  </div>
                  <div className="space-y-2.5 pl-8 text-xs text-slate-600">
                    <p>
                      <strong>5.1 Status Pengendali Data:</strong> Setelah Laporan Kredit diterima oleh Klien, Klien bertindak sebagai Pengendali Data atas data tersebut dan wajib tunduk pada Undang-Undang Nomor 27 Tahun 2022 Tentang Perlindungan Data Pribadi.
                    </p>
                    <p>
                      <strong>5.2 Kerahasiaan Mutlak:</strong> Klien wajib menjaga kerahasiaan Laporan Kredit dengan standar keamanan tertinggi. Data hanya boleh diakses oleh pihak internal Klien yang memiliki kewenangan langsung dalam proses rekrutmen.
                    </p>
                    <div className="rounded-xl border border-red-200 bg-red-50/50 p-3.5 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-red-700 text-xs uppercase tracking-wide">
                        <Ban className="size-4 shrink-0 text-red-600" />
                        <span>5.3 Larangan Keras Klien</span>
                      </div>
                      <p className="text-xs text-red-950 font-medium">Klien DILARANG KERAS untuk:</p>
                      <ul className="list-disc pl-5 text-xs text-red-900 space-y-1">
                        <li>Menjual, menyewakan, melisensikan kembali, atau mengomersialisasikan data Laporan Kredit kepada pihak ketiga manapun;</li>
                        <li>Mempublikasikan skor atau riwayat kredit Kandidat di media sosial atau platform publik;</li>
                        <li>Menggunakan data untuk tujuan diskriminasi SARA atau tindakan yang melanggar hak asasi manusia;</li>
                        <li>Melakukan pengecekan riwayat kredit pada Fitur Pengecekan Riwayat Kredit tanpa memiliki persetujuan yang sah dari Kandidat;</li>
                        <li>Memalsukan, memaksa atau memanipulasi persetujuan Kandidat dalam penggunaan Fitur Pengecekan Riwayat Kredit.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Section 6: Penyangkalan Jaminan */}
                <div id="modal-sec-penyangkalan-jaminan" className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      6
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">PENYANGKALAN JAMINAN</h3>
                  </div>
                  <div className="space-y-2 pl-8 text-xs text-slate-600 leading-relaxed">
                    <p>
                      <strong>6.1</strong> Klien memahami bahwa skor dan analisis yang dihasilkan oleh ProofyLink merupakan hasil perhitungan statistik dan prediktif AI. Hasil ini bukanlah jaminan mutlak atas perilaku finansial seseorang dimasa depan, melainkan alat bantu pendukung keputusan (<em>decision support tool</em>).
                    </p>
                    <p>
                      <strong>6.2</strong> Keputusan untuk menerima, melanjutkan proses, atau menolak Kandidat sepenuhnya berada di tangan dan merupakan tanggung jawab Klien. Kami tidak memberikan jaminan bahwa Kandidat tertentu akan lolos evaluasi internal perusahaan Klien, maupun menjamin Kandidat pasti akan merespons tawaran Klien.
                    </p>
                    <p>
                      <strong>6.3</strong> Data riwayat kredit bersumber dari Lembaga Pengelola Informasi Perkreditan (LPIP). Kami tidak bertanggung jawab atas keakuratan, kelengkapan, atau pembaruan data yang disediakan oleh LPIP. Jika data di LPIP salah, perbaikan harus dilakukan melalui mekanisme LPIP bukan melalui ProofyLink Talent Network.
                    </p>
                    <p>
                      <strong>6.4</strong> Data yang tersedia pada Fitur Unlock Profile disajikan berdasarkan apa yang diunggah oleh Kandidat, Kami menyajikan data sebagaimana adanya dan tidak bertanggung jawab atas ketidakakuratan, kelengkapan, atau pembaruan data dari Kandidat.
                    </p>
                    <p>
                      <strong>6.5</strong> Kami berupaya menjaga layanan tetap aktif. Dalam hal terjadi gangguan teknis yang bersumber dari sistem internal Kami, Kami bertanggung jawab untuk melakukan perbaikan sesegera mungkin untuk memulihkan layanan.
                    </p>
                    <p>
                      <strong>6.6</strong> Kami menyediakan Fitur Pengecekan Riwayat Kredit dengan asumsi itikad baik bahwa Klien telah mematuhi persetujuan data pribadi. Kami tidak bertanggung jawab atas segala kerugian, gugatan privasi, atau sengketa hukum yang muncul akibat tindakan Klien yang melakukan pengecekan data seseorang melalui Fitur Pengecekan Riwayat Kredit tanpa izin dan/atau persetujuan yang sah.
                    </p>
                  </div>
                </div>

                {/* Section 7: Hak Kekayaan Intelektual */}
                <div id="modal-sec-hki" className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      7
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">HAK KEKAYAAN INTELEKTUAL</h3>
                  </div>
                  <div className="space-y-2 pl-8 text-xs text-slate-600 leading-relaxed">
                    <p>
                      <strong>7.1</strong> Seluruh hak cipta termasuk namun tidak terbatas pada merek dagang, kode sumber, algoritma AI, desain antarmuka, dan konten pada layanan ProofyLink Talent Network adalah aset milik Kami.
                    </p>
                    <p>
                      <strong>7.2</strong> Klien hanya diberikan lisensi terbatas, non eksklusif dan apabila Klien melakukan pelanggaran akses untuk menggunakan layanan dapat ditarik kembali selama masa berlangganan. Klien dilarang menyalin, memodifikasi, membongkar, atau membuat produk yang meniru.
                    </p>
                  </div>
                </div>

                {/* Section 8: Ganti Rugi (Indemnification) */}
                <div id="modal-sec-ganti-rugi" className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      8
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">GANTI RUGI (INDEMNIFICATION)</h3>
                  </div>
                  <div className="space-y-2.5 pl-8 text-xs text-slate-600 leading-relaxed">
                    <p>
                      <strong>8.1</strong> Anda setuju untuk mengganti rugi, membebaskan, dan melepaskan Kami dari segala bentuk klaim, tuntutan, gugatan, kerugian, kewajiban, kerusakan, dan biaya yang timbul akibat atau terkait dengan:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>a. Pelanggaran Ketentuan:</strong> Pelanggaran yang Anda lakukan terhadap Syarat dan Ketentuan ini.</li>
                      <li><strong>b. Penyalahgunaan Layanan:</strong> Penggunaan platform yang tidak semestinya, ilegal, atau melanggar hukum oleh Anda (misal: pemalsuan identitas);</li>
                      <li><strong>c. Pelanggaran Hak Pihak Lain:</strong> Pelanggaran Anda terhadap hak pihak lain manapun, termasuk namun tidak terbatas pada hak privasi, hak cipta, atau hak milik orang lain (misal: scraping data kandidat lain, Perusahaan, atau Partner Djoin); dan/atau</li>
                      <li><strong>d. Kelalaian Keamanan:</strong> Kebocoran akses yang disebabkan oleh kelalaian Anda dalam menjaga keamanan perangkat seluler, kerahasiaan OTP, PIN, atau akses biometrik akun Anda.</li>
                    </ul>
                    <p>
                      <strong>8.2 Mekanisme Penyelesaian:</strong> Dalam hal terjadi tuntutan sebagaimana dimaksud dalam pasal ini, Kami berhak untuk mengontrol pertahanan dan penyelesaian hukum atas klaim tersebut, dan Anda diwajibkan untuk bekerja sama sepenuhnya dengan Kami dalam mempertahankan hak-hak tersebut serta menanggung seluruh biaya yang timbul.
                    </p>
                  </div>
                </div>

                {/* Section 9: Masa Berlaku dan Pengakhiran */}
                <div id="modal-sec-pengakhiran" className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      9
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">MASA BERLAKU DAN PENGAKHIRAN</h3>
                  </div>
                  <div className="space-y-2 pl-8 text-xs text-slate-600 leading-relaxed">
                    <p>
                      <strong>9.1 Masa Berlaku:</strong> Syarat dan Ketentuan ini mulai berlaku dan mengikat secara hukum sejak tanggal Anda mendaftarkan akun atau menggunakan layanan ProofyLink Talent Network, dan akan terus berlaku selama akun Anda masih aktif atau sampai diakhiri oleh salah satu pihak sesuai dengan ketentuan pasal ini.
                    </p>
                    <p>
                      <strong>9.2 Masa Berlaku Token:</strong> Setiap paket Token memiliki masa aktif yang spesifik sesuai paket yang dibeli Klien. Token yang tidak digunakan setelah masa aktif berakhir akan hangus secara otomatis.
                    </p>
                    <p>
                      <strong>9.3 Pengakhiran oleh Anda (Hapus Akun):</strong> Anda berhak untuk mengakhiri penggunaan layanan dalam platform sewaktu-waktu dengan cara mengajukan permohonan penghapusan akun melalui fitur “Hapus Akun” yang tersedia di menu Pengaturan platform atau menghubungi layanan pelanggan kami.
                    </p>
                    <p>
                      <strong>9.4 Pengakhiran oleh Kami (Suspensi/Blokir):</strong> Kami berhak untuk membekukan, menangguhkan (suspend), atau mengakhiri akun Anda secara sepihak dan seketika tanpa pemberitahuan sebelumnya apabila:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Anda melanggar salah satu poin dalam Syarat dan Ketentuan ini atau peraturan perundang-undangan yang berlaku;</li>
                      <li>Terdeteksi adanya aktivitas mencurigakan, penipuan (fraud), pemalsuan identitas, atau penyalahgunaan akun untuk aktivitas ilegal;</li>
                      <li>Anda mencemarkan nama baik atau reputasi Kami;</li>
                      <li>Adanya perintah dari kepolisian, pengadilan, atau otoritas yang berwenang; atau</li>
                      <li>Akun Anda tidak aktif dalam jangka waktu yang lama sesuai kebijakan retensi data Kami.</li>
                    </ul>
                    <p>
                      <strong>9.5 Efek Pengakhiran:</strong> Dalam hal terjadi pengakhiran akun (baik oleh Anda maupun oleh Kami):
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Seluruh hak penggunaan platform yang diberikan kepada Anda otomatis berakhir;</li>
                      <li>Kami tidak berkewajiban untuk mengembalikan dana (refund) atas sisa langganan yang masih tersisa di akun Anda pada saat pengakhiran terjadi, terutama jika pengakhiran disebabkan oleh pelanggaran yang Anda lakukan.</li>
                    </ul>
                  </div>
                </div>

                {/* Section 10: Hukum yang Berlaku dan Penyelesaian Sengketa */}
                <div id="modal-sec-hukum-sengketa" className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      10
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">HUKUM YANG BERLAKU DAN PENYELESAIAN SENGKETA</h3>
                  </div>
                  <div className="space-y-2 pl-8 text-xs text-slate-600 leading-relaxed">
                    <p>
                      <strong>10.1 Hukum:</strong> Ketentuan ini diatur dan ditafsirkan berdasarkan hukum Negara Republik Indonesia.
                    </p>
                    <p>
                      <strong>10.2 Musyawarah:</strong> Segala perselisihan yang timbul akan diselesaikan terlebih dahulu secara musyawarah untuk mufakat dalam jangka waktu 30 (tiga puluh) hari kalender.
                    </p>
                    <p>
                      <strong>10.3 Domisili Hukum:</strong> Apabila musyawarah tidak tercapai, perselisihan akan diselesaikan melalui <strong>Pengadilan Negeri Kota Denpasar</strong>.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* ================= CANDIDATE TERMS (DRAFT RESMI 9 PASAL) ================= */
              <div className="space-y-6">
                {/* Highlight Preamble Banner */}
                <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
                      <Scale className="size-3.5 shrink-0" />
                      <span>Perjanjian Penggunaan Layanan Kandidat</span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-purple-200 font-semibold shadow-2xs">
                      PT Solusi Anak Sakti · NPWP: 0959721861903000
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    {CANDIDATE_TERMS.preambleNotice}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-purple-200/80">
                    {CANDIDATE_TERMS.preambleAgreement}
                  </p>
                </div>

                {/* Quick Anchor Navigation */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Navigasi Cepat Pasal:
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar text-xs">
                    {CANDIDATE_TERMS.sections.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(`modal-cand-sec-${s.id}`);
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-[#7C3AED] text-slate-700 font-medium text-[11px] transition-colors cursor-pointer"
                      >
                        {s.number}. {s.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 1: Definisi */}
                <div id="modal-cand-sec-definisi" className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">DEFINISI</h3>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Istilah-istilah berikut memiliki arti yang spesifik dalam Ketentuan Penggunaan ini:
                  </p>
                  <div className="grid grid-cols-1 gap-2 pl-8">
                    {CANDIDATE_TERMS.sections[0].subsections?.map((sub) => (
                      <div key={sub.number} className="rounded-lg bg-slate-50/80 p-2.5 border border-slate-200/70 text-xs">
                        <span className="font-bold text-slate-900 mr-1.5">{sub.number} {sub.title} :</span>
                        <span className="text-slate-600">{sub.content}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Registrasi Akun dan Verifikasi */}
                <div id="modal-cand-sec-registrasi" className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">REGISTRASI AKUN DAN VERIFIKASI</h3>
                  </div>
                  <div className="space-y-3 pl-8 text-xs text-slate-600 leading-relaxed">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">2.1 Kelayakan Klien</h4>
                      <p>
                        Anda menyatakan dan menjamin bahwa Anda adalah orang-perorangan atau individu yang memiliki keabsahan dan kecakapan hukum penuh berdasarkan peraturan perundang-undangan yang berlaku untuk mengikatkan diri dengan syarat dan ketentuan ini.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">2.2 Pembuatan Akun dan Keakuratan Data</h4>
                      <p>
                        Anda wajib membuat akun dan memberikan data secara lengkap, benar, dan akurat, termasuk namun tidak terbatas pada:
                      </p>
                      <ul className="list-disc pl-5 text-slate-700 space-y-0.5">
                        {CANDIDATE_TERMS.sections[1].subsections?.[1]?.items?.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <p className="pt-1 font-medium text-slate-700">
                        Setiap kesalahan, ketidakakuratan, atau kelalaian dalam memberikan data menjadi tanggung jawab Klien sepenuhnya.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">2.3 Pernyataan Tujuan Penggunaan</h4>
                      <p>
                        Anda menjamin bahwa akun ini hanya digunakan untuk keperluan proses pencarian kerja. Profil dan informasi yang Anda berikan melalui akun ini hanya akan digunakan dan dibagikan kepada Rekruter atau calon pemberi kerja untuk keperluan proses rekrutmen.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">2.4 Keamanan Kredensial</h4>
                      <p>
                        Anda bertanggung jawab penuh untuk menjaga kerahasiaan nama pengguna (username), kata sandi (password), dan OTP yang digunakan untuk mengakses platform Proofylink Talent Network. Segala aktivitas yang dilakukan melalui akun Anda akan dianggap sebagai aktivitas yang sah dan menjadi tanggung jawab Anda.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">2.5 Verifikasi Status Klien</h4>
                      <p>
                        Anda secara sadar mengetahui dan menyetujui bahwa penggunaan layanan ProofyLink Talent Network memberikan akses kepada Partner Djoin untuk melakukan verifikasi status alumni dan/atau keanggotaan Anda dalam universitas dan/atau lembaga pendidikan dan pelatihan berdasarkan informasi dan/atau dokumen yang Anda cantumkan saat proses pendaftaran akun.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">2.6 Kegagalan Verifikasi Identitas</h4>
                      <p>
                        Apabila status Anda gagal terverifikasi dalam proses verifikasi oleh Partner Djoin karena adanya ketidaksesuaian, ketidakakuratan, dan/atau ketidakabsahan informasi dan/atau dokumen, maka Anda dapat mengajukan permohonan verifikasi ulang sesuai prosedur yang ditetapkan dalam platform.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">2.7 Penolakan atau Penangguhan Akun</h4>
                      <p>
                        Apabila ditemukan ketidaksesuaian, ketidakakuratan, ketidakabsahan informasi dan/atau dokumen yang diberikan oleh Anda, atau terdapat dugaan atau indikasi pelanggaran hukum, maka Kami berhak untuk menolak pendaftaran dan/atau menangguhkan akun Anda.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Mekanisme Layanan */}
                <div id="modal-cand-sec-mekanisme-layanan" className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">MEKANISME LAYANAN</h3>
                  </div>
                  <div className="space-y-3 pl-8 text-xs text-slate-600 leading-relaxed">
                    <p>
                      <strong>3.1 Ketentuan Penggunaan Platform:</strong> Layanan ProofyLink Talent Network dapat digunakan melalui metode akses secara langsung di dalam platform untuk kepentingan pribadi Klien. Klien tidak memerlukan perantara dengan perusahaan manapun untuk menggunakan layanan ini.
                    </p>
                    <p>
                      <strong>3.2 Penggunaan Fitur Tidak Berbayar:</strong> Anda dapat melakukan pendaftaran akun serta mengedit profil tanpa dikenakan biaya.
                    </p>
                    <div className="space-y-2">
                      <p>
                        <strong>3.3 Penggunaan Fitur Berbayar:</strong> Anda dapat mengakses fitur-fitur berbayar dalam platform ProofyLink Talent Network setelah melakukan pembelian Token melalui skema pembayaran dan biaya yang telah ditentukan dalam platform, yang meliputi:
                      </p>
                      <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200/70 space-y-1">
                        <span className="font-bold text-slate-900">a. Fitur Pembuatan CV:</span>
                        <p>Klien dapat membeli Token untuk mengakses fitur pembuatan CV yang memungkinkan Klien untuk membuat dan mengunduh CV dengan menggunakan informasi yang diberikan atau dicantumkan oleh Klien melalui platform Proofylink Talent Network.</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200/70 space-y-1">
                        <span className="font-bold text-slate-900">b. Fitur Career Advisor:</span>
                        <p>Klien dapat melakukan pembelian Token untuk mengakses fitur rekomendasi karir yang menyediakan analisis profil dan rekomendasi karir berbasis teknologi Artificial Intelligence (AI).</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Biaya, Pembayaran, dan Pengembalian */}
                <div id="modal-cand-sec-biaya-pembayaran" className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      4
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">BIAYA, PEMBAYARAN, DAN PENGEMBALIAN</h3>
                  </div>
                  <div className="space-y-2.5 pl-8 text-xs text-slate-600 leading-relaxed">
                    <p>
                      <strong>4.1 Pembelian Token:</strong> Kami menyediakan fitur pembelian atau top-up Token yang dapat dilakukan secara mandiri oleh Klien. Klien dapat memilih Token sesuai kebutuhan dan menyelesaikan pesanan langsung dalam platform ProofyLink Talent Network. Setiap pembelian yang dikonfirmasi melalui akun Klien dianggap sebagai pesanan yang sah dan mengikat.
                    </p>
                    <div className="space-y-1">
                      <p><strong>4.2 Ketentuan Pembayaran Token:</strong></p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Privasi Penuh:</strong> Data pembayaran (kartu, VA, e-wallet) bersifat rahasia dan hanya dapat dilihat oleh Anda melalui perangkat Anda.</li>
                        <li><strong>Tujuan Penggunaan:</strong> Mutlak hanya ditujukan sebagai pendukung proses pembayaran fitur berbayar yang dikehendaki.</li>
                        <li><strong>Persetujuan:</strong> Anda memberikan persetujuan ketentuan biaya dengan mengklik checkbox atau tombol konfirmasi saat checkout.</li>
                        <li><strong>Metode Pembayaran:</strong> Pembayaran resmi wajib dibayarkan lunas di muka (pre-paid).</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 space-y-1.5 text-amber-950">
                      <span className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="size-3.5 text-amber-600" />
                        4.3 Kebijakan No Refund Policy
                      </span>
                      <p className="text-[11px] text-amber-900">
                        Kami tidak melayani pengembalian dana (refund) atau pembatalan transaksi dengan alasan pengguna berubah pikiran, tidak puas dengan hasil CV/analisis AI, kegagalan teknis perangkat/internet pengguna, atau kesalahan input data.
                      </p>
                    </div>
                    <p>
                      <strong>4.4 Perubahan Harga:</strong> Kami berhak mengubah harga Token sewaktu-waktu dengan menampilkan harga terbaru pada platform tanpa berlaku surut untuk transaksi yang telah selesai.
                    </p>
                  </div>
                </div>

                {/* Section 5: Perlindungan Data, Kerahasiaan, dan Larangan */}
                <div id="modal-cand-sec-perlindungan-data" className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      5
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">PERLINDUNGAN DATA, KERAHASIAAN, DAN LARANGAN</h3>
                  </div>
                  <div className="space-y-2.5 pl-8 text-xs text-slate-600 leading-relaxed">
                    <p>
                      <strong>5.1 UU PDP No. 27/2022:</strong> Kami berkomitmen melindungi data pribadi Anda sesuai UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi dan Kebijakan Privasi platform.
                    </p>
                    <p>
                      <strong>5.2 Keamanan Akun:</strong> Anda bertanggung jawab penuh atas keamanan perangkat dan kerahasiaan OTP/PIN/kredensial Anda. Kami tidak bertanggung jawab atas kebocoran akibat kelalaian Anda atau korban phishing.
                    </p>
                    <div className="rounded-lg border border-red-200 bg-red-50/60 p-3 space-y-1.5 text-red-950">
                      <span className="font-bold flex items-center gap-1.5">
                        <Ban className="size-3.5 text-red-600" />
                        5.3 Larangan Keras (Prohibited Acts)
                      </span>
                      <ul className="list-disc pl-5 text-[11px] text-red-900 space-y-1">
                        <li><strong>Pemalsuan Informasi:</strong> Dilarang memberikan data palsu/menyesatkan (nama, NIK, alamat, usia, alumni, dsb).</li>
                        <li><strong>Scraping Data:</strong> Dilarang menggunakan program/bot untuk mengekstrak data kandidat lain, partner, atau perusahaan.</li>
                        <li><strong>Manipulasi Sistem:</strong> Dilarang melakukan hacking, manipulasi, atau bypass sistem keamanan platform.</li>
                      </ul>
                    </div>
                    <p>
                      <strong>5.4 Sanksi Pelanggaran:</strong> Kami berhak memblokir akun secara permanen tanpa peringatan, menghapus riwayat data, tidak mengembalikan dana token, serta melaporkan ke pihak kepolisian.
                    </p>
                  </div>
                </div>

                {/* Section 6: Penyangkalan Jaminan (Disclaimer) */}
                <div id="modal-cand-sec-penyangkalan-jaminan" className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      6
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">PENYANGKALAN JAMINAN (DISCLAIMER)</h3>
                  </div>
                  <div className="space-y-2 pl-8 text-xs text-slate-600 leading-relaxed">
                    <p>
                      <strong>6.1 Sifat Hasil AI:</strong> Hasil pembuatan CV dan Career Advisor bersifat prediktif berbasis AI dan disajikan semata sebagai referensi, BUKAN nasihat karir profesional, bukan jaminan mutlak kecocokan, dan bukan penentu tunggal keputusan karir Anda.
                    </p>
                    <p>
                      <strong>6.2 Verifikasi Partner:</strong> Verifikasi status alumni bersumber dari Partner Djoin. Kami tidak bertanggung jawab atas ketidakakuratan data dari pihak partner; perbaikan harus dilakukan melalui institusi partner terkait.
                    </p>
                    <p>
                      <strong>6.3 Peran Pendukung:</strong> Career Advisor hanya bertindak sebagai platform pendukung perencanaan karir.
                    </p>
                    <p>
                      <strong>6.4 Gangguan Teknis Internal:</strong> Kami berkomitmen memulihkan layanan secepatnya jika terjadi kendala teknis internal.
                    </p>
                  </div>
                </div>

                {/* Section 7: Ganti Rugi (Indemnification) */}
                <div id="modal-cand-sec-ganti-rugi" className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      7
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">GANTI RUGI (INDEMNIFICATION)</h3>
                  </div>
                  <div className="space-y-2 pl-8 text-xs text-slate-600 leading-relaxed">
                    <p>
                      <strong>7.1 Pembebasan:</strong> Anda setuju membebaskan dan mengganti rugi Kami dari segala klaim akibat pelanggaran Ketentuan ini, penyalahgunaan identitas, pelanggaran hak pihak ketiga (scraping), atau kelalaian kredensial akun Anda.
                    </p>
                    <p>
                      <strong>7.2 Mekanisme Penyelesaian:</strong> Kami berhak mengontrol pertahanan hukum dan Anda wajib bekerja sama serta menanggung seluruh biaya yang timbul.
                    </p>
                  </div>
                </div>

                {/* Section 8: Masa Berlaku dan Pengakhiran */}
                <div id="modal-cand-sec-pengakhiran" className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      8
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">MASA BERLAKU DAN PENGAKHIRAN</h3>
                  </div>
                  <div className="space-y-2 pl-8 text-xs text-slate-600 leading-relaxed">
                    <p>
                      <strong>8.1 Masa Berlaku:</strong> Mengikat sejak Anda mendaftar atau mengakses layanan hingga akun diakhiri.
                    </p>
                    <p>
                      <strong>8.2 Pengakhiran oleh Anda:</strong> Dapat mengajukan penghapusan akun kapan pun melalui menu Pengaturan.
                    </p>
                    <p>
                      <strong>8.3 Pengakhiran oleh Kami:</strong> Kami berhak menangguhkan atau menutup akun seketika bila ada pelanggaran, penipuan, pemalsuan data, pencemaran nama baik, atau perintah penegak hukum.
                    </p>
                    <p>
                      <strong>8.4 Efek Pengakhiran:</strong> Seluruh hak akses otomatis berakhir dan tidak ada pengembalian dana (refund) atas sisa langganan/token.
                    </p>
                  </div>
                </div>

                {/* Section 9: Hukum yang Berlaku dan Penyelesaian Sengketa */}
                <div id="modal-cand-sec-hukum-sengketa" className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-lg bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                      9
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">HUKUM YANG BERLAKU DAN PENYELESAIAN SENGKETA</h3>
                  </div>
                  <div className="space-y-2 pl-8 text-xs text-slate-600 leading-relaxed">
                    <p>
                      <strong>9.1 Hukum:</strong> Diatur dan ditafsirkan berdasarkan hukum Negara Republik Indonesia.
                    </p>
                    <p>
                      <strong>9.2 Musyawarah:</strong> Diselesaikan secara musyawarah untuk mufakat dalam jangka waktu 30 (tiga puluh) hari kalender.
                    </p>
                    <p>
                      <strong>9.3 Domisili Hukum:</strong> Apabila tidak tercapai mufakat, perselisihan diselesaikan melalui <strong>Pengadilan Negeri Kota Denpasar</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* ================= STEP 2: PRIVACY POLICY (AS-IS) ================= */
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
                    Anda memiliki hak penuh untuk mengubah status visibilitas akun (<em>Open to Work</em> atau nonaktif), menyunting portofolio, atau menghapus profil Anda kapan pun.
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="gap-1.5 text-slate-700 text-xs sm:text-sm h-9 sm:h-10 px-4 rounded-xl cursor-pointer"
              >
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
