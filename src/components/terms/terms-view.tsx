"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Building2,
  FileCheck2,
  FileText,
  LayoutDashboard,
  Lock,
  Scale,
  ShieldCheck,
  User,
  WalletCards,
  AlertTriangle,
  Coins,
  Ban,
} from "lucide-react";
import { RECRUITER_TERMS, CANDIDATE_TERMS } from "@/lib/terms-content";
import { useLegalBackNav } from "@/hooks/use-legal-back-nav";
import { useApp } from "@/providers/app-provider";
import { cn } from "@/lib/utils";

export function TermsView() {
  const searchParams = useSearchParams();
  const { user, hydrated } = useApp();
  const { backHref, backLabel, isWorkspace, preserveQuery } = useLegalBackNav();

  const queryRole = searchParams.get("role");
  const initialRole = queryRole === "candidate" || (!queryRole && hydrated && user?.role === "candidate")
    ? "candidate"
    : "recruiter";
  const [activeTab, setActiveTab] = useState<"recruiter" | "candidate">(initialRole);

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 sm:py-10 border-b border-slate-200/80">
      <div className="container mx-auto px-4 max-w-4xl space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            {isWorkspace ? <LayoutDashboard className="size-3.5 text-primary" /> : <ArrowLeft className="size-3.5" />}
            <span>{backLabel}</span>
          </Link>
        </div>

        {/* Top Header & Policy Switcher */}
        <div className="space-y-4">
          {/* Policy Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl max-w-fit">
            <span className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-white text-slate-900 shadow-2xs cursor-default">
              Syarat &amp; Ketentuan
            </span>
            <Link
              href={`/privacy${preserveQuery}`}
              className="px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all"
            >
              Kebijakan Privasi
            </Link>
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab("recruiter")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "recruiter"
                  ? "bg-[#7C3AED] text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Building2 className="size-4" />
              Ketentuan Rekruter &amp; Klien (Draft Resmi)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("candidate")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "candidate"
                  ? "bg-[#7C3AED] text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <User className="size-4" />
              Ketentuan Kandidat &amp; Pencari Kerja (Draft Resmi)
            </button>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 font-mono text-xs font-semibold text-[#7C3AED] border border-purple-200/70">
            <Scale className="size-3.5" />
            {activeTab === "recruiter"
              ? "Ketentuan Layanan Resmi Perusahaan & Klien"
              : "Ketentuan Layanan Resmi Kandidat & Pencari Kerja"}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Ketentuan Penggunaan Layanan ProofyLink Talent Network
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            {activeTab === "recruiter"
              ? "Perjanjian yang sah dan mengikat secara hukum antara Perusahaan Anda (Klien) dan PT Solusi Anak Sakti (Djoin) dalam penggunaan ekosistem rekrutmen dan pengecekan kredit."
              : "Perjanjian yang sah dan mengikat secara hukum antara Anda (Klien/Kandidat) dan PT Solusi Anak Sakti (Djoin) dalam penggunaan layanan ProofyLink Talent Network."}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-200/70">
            <span>Terakhir diperbarui: 23 September 2026</span>
            <span>·</span>
            <span>
              Versi: 2.0 (PT Solusi Anak Sakti - Djoin NPWP 0959721861903000)
            </span>
          </div>
        </div>

        {activeTab === "recruiter" ? (
          /* ================= RECRUITER 10-SECTION DOCUMENT ================= */
          <div className="space-y-6">
            {/* Quick Jump Anchor Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs font-medium">
              {RECRUITER_TERMS.sections.map((s) => (
                <a
                  key={s.id}
                  href={`#terms-${s.id}`}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-purple-300 hover:text-[#7C3AED] transition-colors shadow-2xs"
                >
                  {s.number}. {s.title}
                </a>
              ))}
            </div>

            {/* Document Body */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-10 lg:p-12 shadow-xs space-y-10">
              {/* Highlight Preamble Banner */}
              <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-5 sm:p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#7C3AED] uppercase tracking-wider">
                    <Scale className="size-4 shrink-0" />
                    <span>Perjanjian Penggunaan Layanan Klien</span>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-white text-slate-700 border border-purple-200 font-semibold shadow-2xs">
                    PT Solusi Anak Sakti · NPWP: 0959721861903000
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                  {RECRUITER_TERMS.preambleNotice}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2.5 border-t border-purple-200/80">
                  {RECRUITER_TERMS.preambleAgreement}
                </p>
              </div>

              {/* Section 1: Definisi */}
              <section id="terms-definisi" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <FileText className="size-5 text-[#7C3AED] shrink-0" />
                  1. Definisi
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Untuk menghindari keraguan penafsiran, istilah-istilah berikut memiliki arti yang spesifik dalam Ketentuan ini:
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {RECRUITER_TERMS.sections[0].subsections?.map((sub) => (
                    <div key={sub.number} className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/70 text-xs sm:text-sm leading-relaxed">
                      <span className="font-bold text-slate-900 mr-2">{sub.number} {sub.title} :</span>
                      <span className="text-slate-600">{sub.content}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 2: Registrasi dan Verifikasi Akun */}
              <section id="terms-registrasi" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <Building2 className="size-5 text-[#7C3AED] shrink-0" />
                  2. Registrasi dan Verifikasi Akun
                </h2>
                <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-slate-800">2.1 Syarat Legalitas</h3>
                    <p>
                      Untuk mengaktifkan akun sebagai Klien, Anda wajib mengunggah dokumen legalitas perusahaan yang sah dan masih berlaku, meliputi:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li><strong>Nomor Induk Berusaha (NIB)</strong>;</li>
                      <li><strong>Nomor Pajak Wajib Pajak (NPWP)</strong>.</li>
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">2.2 Proses Verifikasi</h3>
                    <p>
                      Akun Anda hanya dapat digunakan secara optimal setelah tim Kami selesai memverifikasi keabsahan dokumen legalitas tersebut. Kami berhak menolak pendaftaran dan meminta mengunggah ulang jika dokumen dinilai tidak valid, kedaluwarsa atau mencurigakan.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">2.3 Tujuan Penggunaan</h3>
                    <p>
                      Anda menjamin bahwa akun ini semata-mata digunakan untuk kepentingan rekrutmen yang sah dan pengelolaan sumber daya manusia, bukan untuk tujuan penipuan, pencurian data, atau tindakan ilegal lainnya.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">2.4 Keamanan Akun</h3>
                    <p>
                      Klien bertanggung jawab penuh menjaga kerahasiaan nama pengguna (username) dan kata sandi (password) akun Anda. Segala aktivitas, pembelian Token, atau pengunduhan data yang dilakukan melalui akun Klien akan dianggap sebagai aktivitas sah yang dilakukan oleh Klien.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3: Mekanisme Layanan */}
              <section id="terms-mekanisme-layanan" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <Coins className="size-5 text-[#7C3AED] shrink-0" />
                  3. Mekanisme Layanan
                </h2>
                <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <p>
                    Melalui platform ProofyLink Talent Network, Klien dapat memanfaatkan layanan berikut sesuai dengan kebutuhan:
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm">3.1 Penggunaan Layanan Dasar</h3>
                    <ul className="list-disc pl-5 space-y-2 text-slate-600">
                      <li>
                        Klien dapat melakukan pencarian, penyaringan, dan melihat ringkasan profil Kandidat secara singkat yang telah dipublikasikan di dalam ProofyLink Talent Network tanpa dikenakan biaya tambahan.
                      </li>
                      <li>
                        Klien akan mendapatkan token gratis sesuai kebijakan yang berlaku. Token gratis hanya dapat digunakan untuk membuka Fitur Unlock Profile dasar dan tidak mencakup analisis AI yang terdapat dalam Fitur Unlock Profile.
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-purple-200 bg-white p-5 space-y-3.5 shadow-2xs">
                    <h3 className="font-bold text-slate-900 text-sm">3.2 Penggunaan Fitur Berbayar</h3>
                    <p className="text-slate-600">
                      Untuk mengakses data lebih lanjut, Klien dapat menggunakan Token yang telah dibayar untuk memotong biaya fitur berikut:
                    </p>
                    <div className="space-y-3 pl-2">
                      <div>
                        <strong className="text-slate-900 font-semibold block mb-1">
                          a. Fitur Unlock Profile
                        </strong>
                        <p className="text-slate-600">
                          Klien menggunakan Token untuk membuka seluruh detail profil Kandidat (pendidikan lengkap, riwayat pekerjaan, detail kontak) guna melakukan penawaran lebih lanjut. Pemotongan Token untuk fitur ini terjadi secara langsung saat Klien mengklik tombol unlock profile.
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-100">
                        <strong className="text-slate-900 font-semibold block mb-1">
                          b. Fitur Pengecekan Riwayat Kredit
                        </strong>
                        <p className="text-slate-600 mb-2">
                          Klien menggunakan Token untuk mengecek latar belakang finansial Kandidat. Penggunaan fitur ini tunduk pada syarat operasional berikut:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600">
                          <li>
                            <strong className="text-slate-900">Persetujuan Kandidat :</strong> Klien wajib mendapatkan persetujuan eksplisit dari Kandidat sebelum mendapatkan Laporan Kredit Kandidat.
                          </li>
                          <li>
                            <strong className="text-slate-900">Mekanisme Persetujuan :</strong> Klien mengetahui bahwa data riwayat kredit adalah Data Pribadi yang bersifat rahasia sehingga Klien menjamin bahwa sebelum melakukan pengecekan, Klien telah mendapatkan persetujuan yang sah dari Kandidat. Sistem Kami akan mengirimkan notifikasi permintaan persetujuan kepada Kandidat.
                          </li>
                          <li>
                            <strong className="text-slate-900">Pembagian Hasil :</strong> Klien memahami bahwa hasil Laporan Kredit hanya dikirimkan kepada Klien dan tidak mengirimkan hasil Laporan Kredit kepada Kandidat. Namun Klien dilarang menghalangi hak Kandidat untuk melihat laporan mereka sendiri.
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
              </section>

              {/* Section 4: Biaya & Kebijakan No Refund */}
              <section id="terms-biaya-pembayaran" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <WalletCards className="size-5 text-[#7C3AED] shrink-0" />
                  4. Biaya, Pembayaran, dan Kebijakan Pengembalian
                </h2>
                <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <p>
                    <strong>4.1 Pembelian Token:</strong> Kami menyediakan fitur pembelian atau top-up Token yang dapat dilakukan secara mandiri oleh Klien. Klien dapat memilih Token sesuai kebutuhan dan menyelesaikan pesanan langsung dalam platform ProofyLink Talent Network. Setiap pembelian yang dikonfirmasi melalui akun Klien dianggap sebagai pesanan yang sah dan mengikat.
                  </p>
                  <p>
                    <strong>4.2 Kewajiban Pembayaran:</strong> Biaya hanya akan dikenakan apabila Klien membeli Token untuk menggunakan Fitur Berbayar. Biaya sesuai dengan yang tertera pada halaman checkout di platform serta biaya wajib dibayar lunas di muka (pre-paid).
                  </p>
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                      <AlertTriangle className="size-4 text-amber-700 shrink-0" />
                      <span>4.3 Kebijakan Pengembalian Dana (No Refund)</span>
                    </div>
                    <p className="text-amber-950 text-xs sm:text-sm">
                      Seluruh pembayaran untuk pembelian Token bersifat final, Kami TIDAK melayani pengembalian dana (refund) untuk kondisi berikut:
                    </p>
                    <ul className="list-disc pl-5 text-amber-900 space-y-1 text-xs sm:text-sm">
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
              </section>

              {/* Section 5: Perlindungan Data & Larangan Keras */}
              <section id="terms-perlindungan-data" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <Lock className="size-5 text-[#7C3AED] shrink-0" />
                  5. Perlindungan Data, Kerahasiaan dan Larangan
                </h2>
                <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <p>
                    <strong>5.1 Status Pengendali Data:</strong> Setelah Laporan Kredit diterima oleh Klien, Klien bertindak sebagai Pengendali Data atas data tersebut dan wajib tunduk pada Undang-Undang Nomor 27 Tahun 2022 Tentang Perlindungan Data Pribadi.
                  </p>
                  <p>
                    <strong>5.2 Kerahasiaan Mutlak:</strong> Klien wajib menjaga kerahasiaan Laporan Kredit dengan standar keamanan tertinggi. Data hanya boleh diakses oleh pihak internal Klien yang memiliki kewenangan langsung dalam proses rekrutmen.
                  </p>
                  <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 font-bold text-red-700 text-sm uppercase tracking-wider">
                      <Ban className="size-4 shrink-0 text-red-600" />
                      <span>5.3 Larangan Keras Klien</span>
                    </div>
                    <p className="text-red-950 font-medium">Klien DILARANG KERAS untuk:</p>
                    <ul className="list-disc pl-5 text-red-900 space-y-1.5">
                      <li>Menjual, menyewakan, melisensikan kembali, atau mengomersialisasikan data Laporan Kredit kepada pihak ketiga manapun;</li>
                      <li>Mempublikasikan skor atau riwayat kredit Kandidat di media sosial atau platform publik;</li>
                      <li>Menggunakan data untuk tujuan diskriminasi SARA atau tindakan yang melanggar hak asasi manusia;</li>
                      <li>Melakukan pengecekan riwayat kredit pada Fitur Pengecekan Riwayat Kredit tanpa memiliki persetujuan yang sah dari Kandidat;</li>
                      <li>Memalsukan, memaksa atau memanipulasi persetujuan Kandidat dalam penggunaan Fitur Pengecekan Riwayat Kredit.</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 6: Penyangkalan Jaminan */}
              <section id="terms-penyangkalan-jaminan" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <ShieldCheck className="size-5 text-[#7C3AED] shrink-0" />
                  6. Penyangkalan Jaminan
                </h2>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
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
              </section>

              {/* Section 7: HKI */}
              <section id="terms-hki" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <FileCheck2 className="size-5 text-[#7C3AED] shrink-0" />
                  7. Hak Kekayaan Intelektual
                </h2>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <p>
                    <strong>7.1</strong> Seluruh hak cipta termasuk namun tidak terbatas pada merek dagang, kode sumber, algoritma AI, desain antarmuka, dan konten pada layanan ProofyLink Talent Network adalah aset milik Kami.
                  </p>
                  <p>
                    <strong>7.2</strong> Klien hanya diberikan lisensi terbatas, non eksklusif dan apabila Klien melakukan pelanggaran akses untuk menggunakan layanan dapat ditarik kembali selama masa berlangganan. Klien dilarang menyalin, memodifikasi, membongkar, atau membuat produk yang meniru.
                  </p>
                </div>
              </section>

              {/* Section 8: Ganti Rugi */}
              <section id="terms-ganti-rugi" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <Scale className="size-5 text-[#7C3AED] shrink-0" />
                  8. Ganti Rugi (Indemnification)
                </h2>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <p>
                    <strong>8.1</strong> Anda setuju untuk mengganti rugi, membebaskan, dan melepaskan Kami dari segala bentuk klaim, tuntutan, gugatan, kerugian, kewajiban, kerusakan, dan biaya yang timbul akibat atau terkait dengan:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>a. Pelanggaran Ketentuan:</strong> Pelanggaran yang Anda lakukan terhadap Syarat dan Ketentuan ini.</li>
                    <li><strong>b. Penyalahgunaan Layanan:</strong> Penggunaan platform yang tidak semestinya, ilegal, atau melanggar hukum oleh Anda (misal: pemalsuan identitas);</li>
                    <li><strong>c. Pelanggaran Hak Pihak Lain:</strong> Pelanggaran Anda terhadap hak pihak lain manapun, termasuk namun tidak terbatas pada hak privasi, hak cipta, atau hak milik orang lain (misal: scraping data kandidat lain, Perusahaan, atau Partner Djoin); dan/atau</li>
                    <li><strong>d. Kelalaian Keamanan:</strong> Kebocoran akses yang disebabkan oleh kelalaian Anda dalam menjaga keamanan perangkat seluler, kerahasiaan OTP, PIN, atau akses biometrik akun Anda.</li>
                  </ul>
                  <p>
                    <strong>8.2 Mekanisme Penyelesaian:</strong> Dalam hal terjadi tuntutan sebagaimana dimaksud dalam pasal ini, Kami berhak untuk mengontrol pertahanan dan penyelesaian hukum atas klaim tersebut, dan Anda diwajibkan untuk bekerja sama sepenuhnya dengan Kami dalam mempertahankan hak-hak tersebut serta menanggung seluruh biaya yang timbul.
                  </p>
                </div>
              </section>

              {/* Section 9: Masa Berlaku dan Pengakhiran */}
              <section id="terms-pengakhiran" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <Lock className="size-5 text-[#7C3AED] shrink-0" />
                  9. Masa Berlaku dan Pengakhiran
                </h2>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
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
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Anda melanggar salah satu poin dalam Syarat dan Ketentuan ini atau peraturan perundang-undangan yang berlaku;</li>
                    <li>Terdeteksi adanya aktivitas mencurigakan, penipuan (fraud), pemalsuan identitas, atau penyalahgunaan akun untuk aktivitas ilegal;</li>
                    <li>Anda mencemarkan nama baik atau reputasi Kami;</li>
                    <li>Adanya perintah dari kepolisian, pengadilan, atau otoritas yang berwenang; atau</li>
                    <li>Akun Anda tidak aktif dalam jangka waktu yang lama sesuai kebijakan retensi data Kami.</li>
                  </ul>
                  <p>
                    <strong>9.5 Efek Pengakhiran:</strong> Dalam hal terjadi pengakhiran akun (baik oleh Anda maupun oleh Kami):
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Seluruh hak penggunaan platform yang diberikan kepada Anda otomatis berakhir;</li>
                    <li>Kami tidak berkewajiban untuk mengembalikan dana (refund) atas sisa langganan yang masih tersisa di akun Anda pada saat pengakhiran terjadi, terutama jika pengakhiran disebabkan oleh pelanggaran yang Anda lakukan.</li>
                  </ul>
                </div>
              </section>

              {/* Section 10: Hukum dan Sengketa */}
              <section id="terms-hukum-sengketa" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <Scale className="size-5 text-[#7C3AED] shrink-0" />
                  10. Hukum yang Berlaku dan Penyelesaian Sengketa
                </h2>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
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
              </section>
            </div>
          </div>
        ) : (
          /* ================= CANDIDATE 9-SECTION DOCUMENT ================= */
          <div className="space-y-6">
            {/* Quick Jump Anchor Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs font-medium">
              {CANDIDATE_TERMS.sections.map((s) => (
                <a
                  key={s.id}
                  href={`#cand-terms-${s.id}`}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-purple-300 hover:text-[#7C3AED] transition-colors shadow-2xs"
                >
                  {s.number}. {s.title}
                </a>
              ))}
            </div>

            {/* Document Body */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-10 lg:p-12 shadow-xs space-y-10">
              {/* Highlight Preamble Banner */}
              <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-5 sm:p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#7C3AED] uppercase tracking-wider">
                    <Scale className="size-4 shrink-0" />
                    <span>Perjanjian Penggunaan Layanan Kandidat</span>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-white text-slate-700 border border-purple-200 font-semibold shadow-2xs">
                    PT Solusi Anak Sakti · NPWP: 0959721861903000
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                  {CANDIDATE_TERMS.preambleNotice}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2.5 border-t border-purple-200/80">
                  {CANDIDATE_TERMS.preambleAgreement}
                </p>
              </div>

              {/* Section 1: Definisi */}
              <section id="cand-terms-definisi" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <FileText className="size-5 text-[#7C3AED] shrink-0" />
                  1. Definisi
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Untuk menghindari keraguan penafsiran, istilah-istilah berikut memiliki arti yang spesifik dalam Ketentuan ini:
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {CANDIDATE_TERMS.sections[0].subsections?.map((sub) => (
                    <div key={sub.number} className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/70 text-xs sm:text-sm leading-relaxed">
                      <span className="font-bold text-slate-900 mr-2">{sub.number} {sub.title} :</span>
                      <span className="text-slate-600">{sub.content}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 2: Registrasi Akun dan Verifikasi */}
              <section id="cand-terms-registrasi" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <ShieldCheck className="size-5 text-[#7C3AED] shrink-0" />
                  2. Registrasi Akun dan Verifikasi
                </h2>
                <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">2.1 Kelayakan Klien</h3>
                    <p>
                      Anda menyatakan dan menjamin bahwa Anda adalah orang-perorangan atau individu yang memiliki keabsahan dan kecakapan hukum penuh berdasarkan peraturan perundang-undangan yang berlaku untuk mengikatkan diri dengan syarat dan ketentuan ini.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-800">2.2 Pembuatan Akun dan Keakuratan Data</h3>
                    <p>
                      Anda wajib membuat akun dan memberikan data secara lengkap, benar, dan akurat, termasuk namun tidak terbatas pada:
                    </p>
                    <ul className="list-none space-y-1.5 pl-2">
                      {CANDIDATE_TERMS.sections[1].subsections?.[1]?.items?.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-slate-700">
                          <span className="text-[#7C3AED] font-bold shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="pt-1 font-medium text-slate-700">
                      Setiap kesalahan, ketidakakuratan, atau kelalaian dalam memberikan data menjadi tanggung jawab Klien sepenuhnya.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">2.3 Pernyataan Tujuan Penggunaan</h3>
                    <p>
                      Anda menjamin bahwa akun ini hanya digunakan untuk keperluan proses pencarian kerja. Profil dan informasi yang Anda berikan melalui akun ini hanya akan digunakan dan dibagikan kepada Rekruter atau calon pemberi kerja untuk keperluan proses rekrutmen.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">2.4 Keamanan Kredensial</h3>
                    <p>
                      Anda bertanggung jawab penuh untuk menjaga kerahasiaan nama pengguna (<em>username</em>), kata sandi (<em>password</em>), dan OTP yang digunakan untuk mengakses platform Proofylink Talent Network. Segala aktivitas yang dilakukan melalui akun Anda akan dianggap sebagai aktivitas yang sah dan menjadi tanggung jawab Anda.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">2.5 Verifikasi Status Klien</h3>
                    <p>
                      Anda secara sadar mengetahui dan menyetujui bahwa penggunaan layanan ProofyLink Talent Network memberikan akses kepada Partner Djoin untuk melakukan verifikasi status alumni dan/atau keanggotaan Anda dalam universitas dan/atau lembaga pendidikan dan pelatihan berdasarkan informasi dan/atau dokumen yang Anda cantumkan saat proses pendaftaran akun.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">2.6 Kegagalan Verifikasi Identitas</h3>
                    <p>
                      Apabila status Anda gagal terverifikasi dalam proses verifikasi oleh Partner Djoin karena adanya ketidaksesuaian, ketidakakuratan, dan/atau ketidakabsahan informasi dan/atau dokumen, maka Anda dapat mengajukan permohonan verifikasi ulang sesuai prosedur yang ditetapkan dalam platform.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">2.7 Penolakan atau Penangguhan Akun</h3>
                    <p>
                      Apabila ditemukan ketidaksesuaian, ketidakakuratan, ketidakabsahan informasi dan/atau dokumen yang diberikan oleh Anda, atau terdapat dugaan atau indikasi pelanggaran hukum, maka Kami berhak untuk menolak pendaftaran dan/atau menangguhkan akun Anda.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3: Mekanisme Layanan */}
              <section id="cand-terms-mekanisme-layanan" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <Coins className="size-5 text-[#7C3AED] shrink-0" />
                  3. Mekanisme Layanan
                </h2>
                <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">3.1 Ketentuan Penggunaan Platform</h3>
                    <p>
                      Layanan ProofyLink Talent Network dapat digunakan melalui metode akses secara langsung di dalam platform untuk kepentingan pribadi Klien. Klien tidak memerlukan perantara dengan perusahaan manapun untuk menggunakan layanan ini.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">3.2 Penggunaan Fitur Tidak Berbayar</h3>
                    <p>
                      Anda dapat melakukan pendaftaran akun serta mengedit profil tanpa dikenakan biaya.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-800">3.3 Penggunaan Fitur Berbayar</h3>
                    <p>
                      Anda dapat mengakses fitur-fitur berbayar dalam platform ProofyLink Talent Network setelah melakukan pembelian Token melalui skema pembayaran dan biaya yang telah ditentukan dalam platform, yang meliputi:
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1.5">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">a. Fitur Pembuatan CV</span>
                        <p className="text-slate-600 text-xs sm:text-sm">
                          Klien dapat membeli Token untuk mengakses fitur pembuatan CV yang memungkinkan Klien untuk membuat dan mengunduh CV dengan menggunakan informasi yang diberikan atau dicantumkan oleh Klien melalui platform Proofylink Talent Network. Informasi tersebut dapat diberikan dengan cara mengunggah file yang memuat informasi mengenai data diri dasar, pengalaman, pendidikan, dan keahlian, melengkapi formulir profil yang tersedia di dalam platform secara manual, dan/atau menggunakan informasi, profil, dan pengalaman yang telah Klien cantumkan pada saat proses pendaftaran dan/atau melalui akun Klien.
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1.5">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">b. Fitur Career Advisor</span>
                        <p className="text-slate-600 text-xs sm:text-sm">
                          Klien dapat melakukan pembelian Token untuk mengakses fitur rekomendasi karir yang menyediakan analisis profil dan rekomendasi karir berbasis teknologi <em>Artificial Intelligence</em> (AI).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 4: Biaya, Pembayaran, dan Pengembalian */}
              <section id="cand-terms-biaya-pembayaran" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <WalletCards className="size-5 text-[#7C3AED] shrink-0" />
                  4. Biaya, Pembayaran, dan Pengembalian
                </h2>
                <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">4.1 Pembelian Token</h3>
                    <p>
                      Kami menyediakan fitur pembelian atau <em>top-up</em> Token yang dapat dilakukan secara mandiri oleh Klien. Klien dapat memilih Token sesuai kebutuhan dan menyelesaikan pesanan langsung dalam platform ProofyLink Talent Network. Setiap pembelian yang dikonfirmasi melalui akun Klien dianggap sebagai pesanan yang sah dan mengikat.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-800">4.2 Ketentuan Pembayaran</h3>
                    <p>
                      Apabila Anda melakukan pembelian atau <em>top-up</em> Token melalui pembayaran dalam platform, berlaku ketentuan-ketentuan sebagai berikut:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
                        <span className="font-bold text-slate-900 text-xs">a. Privasi Penuh</span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Informasi terkait nomor kartu kredit dan/atau debit, Virtual Account, nomor handphone yang digunakan sebagai nomor e-wallet, maupun informasi lainnya adalah bersifat rahasia dan hanya dapat dilihat oleh Anda melalui perangkat Anda. Kami tidak membagikan hasil tersebut kecuali diwajibkan hukum.
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
                        <span className="font-bold text-slate-900 text-xs">b. Tujuan Penggunaan</span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Segala informasi yang disebutkan sebelumnya mutlak hanya ditujukan sebagai pendukung dalam proses pembayaran fitur-fitur berbayar yang Anda kehendaki.
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
                        <span className="font-bold text-slate-900 text-xs">c. Persetujuan</span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Anda dapat memberikan persetujuan terkait ketentuan biaya dan skema pembayaran untuk memproses pembayaran dengan mengklik kotak centang (checkbox) atau tombol konfirmasi pada saat proses pembayaran.
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
                        <span className="font-bold text-slate-900 text-xs">d. Metode Pembayaran</span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Seluruh pembayaran atas pembelian atau top-up Token dilakukan melalui pembayaran resmi yang tersedia di dalam platform ProofyLink Talent Network. Biaya Token yang digunakan untuk mengakses fitur-fitur berbayar sesuai dengan yang tertera pada halaman checkout di platform serta wajib dibayarkan lunas di muka (pre-paid).
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
                    <h3 className="font-bold text-amber-950 flex items-center gap-1.5 text-xs sm:text-sm">
                      <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                      4.3 Kebijakan Tanpa Pengembalian Dana (No Refund Policy)
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-900">
                      Kami tidak melayani permintaan pengembalian dana (<em>refund</em>) atau pembatalan transaksi yang diajukan atas alasan tertentu, termasuk namun tidak terbatas pada:
                    </p>
                    <ul className="list-disc pl-5 text-xs sm:text-sm text-amber-900 space-y-1">
                      <li>Pengguna berubah pikiran setelah pembayaran berhasil dikonfirmasi;</li>
                      <li>Pengguna merasa tidak puas dengan hasil CV serta analisis dan rekomendasi karir yang diberikan oleh platform;</li>
                      <li>Kegagalan teknis yang disebabkan oleh perangkat atau koneksi internet Klien; dan</li>
                      <li>Kesalahan Klien dalam memasukkan data saat melengkapi proses pembayaran.</li>
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">4.4 Perubahan Harga</h3>
                    <p>
                      Kami berhak untuk mengubah harga Token untuk akses layanan sewaktu-waktu dengan menampilkan harga terbaru pada platform. Perubahan harga tidak berlaku surut untuk transaksi yang telah diselesaikan sebelum perubahan tersebut berlaku.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 5: Perlindungan Data, Kerahasiaan, dan Larangan */}
              <section id="cand-terms-perlindungan-data" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <Lock className="size-5 text-[#7C3AED] shrink-0" />
                  5. Perlindungan Data, Kerahasiaan, dan Larangan
                </h2>
                <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">5.1 Komitmen Perlindungan Data</h3>
                    <p>
                      Kami berkomitmen untuk melindungi data pribadi Anda sesuai dengan <strong>Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi</strong>. Kami hanya mengumpulkan, memproses, dan membagikan data Anda sesuai dengan Kebijakan Privasi (<em>Privacy Policy</em>) yang merupakan bagian tak terpisahkan dari Ketentuan ini.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">5.2 Keamanan Akun dan Perangkat</h3>
                    <p>
                      Anda bertanggung jawab penuh untuk menjaga keamanan perangkat seluler dan kerahasiaan kredensial akun (termasuk OTP, PIN, atau akses Biometrik). Segala aktivitas pengeditan profil atau pembelian fitur-fitur berbayar yang terjadi melalui akun Anda dianggap sebagai tindakan sah yang dilakukan oleh Anda sendiri. Kami tidak bertanggung jawab atas kebocoran data yang disebabkan oleh kelalaian Anda (seperti meminjamkan HP kepada orang lain atau menjadi korban <em>phishing</em>).
                    </p>
                  </div>
                  <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-2">
                    <h3 className="font-bold text-red-950 flex items-center gap-1.5 text-xs sm:text-sm">
                      <Ban className="size-4 text-red-600 shrink-0" />
                      5.3 Larangan Keras (Prohibited Acts)
                    </h3>
                    <p className="text-xs sm:text-sm text-red-900">
                      Dalam menggunakan platform ProofyLink Talent Network, Anda <strong>DILARANG KERAS</strong> untuk:
                    </p>
                    <ul className="list-disc pl-5 text-xs sm:text-sm text-red-900 space-y-1.5">
                      <li>
                        <strong>Pemalsuan Informasi:</strong> Memberikan, mengunggah, dan/atau menggunakan informasi yang palsu, tidak benar, tidak akurat, menyesatkan, dan/atau tidak sesuai dengan keadaan yang sebenarnya terkait dengan identitas dan profil diri Anda, termasuk namun tidak terbatas pada nama, NIK, alamat, usia, status alumni dan/atau keanggotaan, dan segala informasi lainnya yang berkaitan dengan profil diri Anda.
                      </li>
                      <li>
                        <strong>Larangan Tindakan Scraping Data:</strong> Menggunakan program atau bot tertentu untuk mengakses, mengambil, menyalin, mengumpulkan, mengekstrak, dan/atau mengunduh data kandidat lain, Partner Djoin, perusahaan, maupun data-data lainnya yang berada di dalam platform ProofyLink Talent Network.
                      </li>
                      <li>
                        <strong>Manipulasi Sistem:</strong> Melakukan upaya peretasan atau modifikasi platform untuk mengelabui sistem keamanan Kami.
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-800">5.4 Sanksi Pelanggaran</h3>
                    <p>
                      Kami berhak untuk melakukan pemantauan sistem secara aktif. Apabila ditemukan indikasi pelanggaran terhadap pasal ini, Kami berhak untuk:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li>Memblokir akun Anda secara permanen tanpa peringatan;</li>
                      <li>Menghapus seluruh riwayat data pada akun Anda;</li>
                      <li>Tidak mengembalikan dana yang telah digunakan untuk pembelian fitur-fitur premium; dan</li>
                      <li>Melaporkan tindakan pemalsuan identitas, scraping data, dan manipulasi sistem kepada pihak berwajib sesuai hukum yang berlaku.</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 6: Penyangkalan Jaminan (Disclaimer) */}
              <section id="cand-terms-penyangkalan-jaminan" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <AlertTriangle className="size-5 text-[#7C3AED] shrink-0" />
                  6. Penyangkalan Jaminan (Disclaimer)
                </h2>
                <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-800">6.1 Sifat Prediktif Hasil AI &amp; Bukan Penasihat Karir</h3>
                    <p>
                      Anda memahami dan menyetujui bahwa hasil yang diberikan melalui fitur pembuatan CV dan Career Advisor pada platform ProofyLink Talent Network merupakan hasil analisis informasi dalam profil Anda yang bersifat prediktif dan berbasis AI. Hasil tersebut bersifat informatif dan/atau prediktif serta disajikan semata-mata sebagai referensi, serta <strong>BUKAN</strong> merupakan:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li>Nasihat karir profesional;</li>
                      <li>Jaminan mutlak atas kesesuaian hasil analisis dan/atau rekomendasi dengan minat, kemampuan, kondisi, atau rencana karir Anda; atau</li>
                      <li>Penentu tunggal dalam membuat keputusan berkaitan dengan rencana karir Anda.</li>
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">6.2 Verifikasi Data Alumni Partner Djoin</h3>
                    <p>
                      Verifikasi data terkait status alumni Anda dilakukan berdasarkan data yang bersumber dari Partner Djoin. Anda memahami bahwa Kami tidak bertanggung jawab atas keakuratan, kelengkapan, dan/atau pembaruan data yang disediakan oleh Partner Djoin. Apabila terdapat kesalahan, ketidakakuratan, atau ketidaklengkapan data tersebut, perbaikan harus dilakukan melalui mekanisme Partner Djoin, bukan melalui ProofyLink Talent Network.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">6.3 Peran Pendukung Career Advisor</h3>
                    <p>
                      Fitur Career Advisor hanya bertindak sebagai platform pendukung untuk membantu Anda dalam melakukan perencanaan karir dan persiapan proses seleksi kerja.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">6.4 Pemulihan Gangguan Teknis Internal</h3>
                    <p>
                      Kami berupaya menjaga layanan tetap aktif. Dalam hal terjadi gangguan teknis yang bersumber dari internal Kami, Kami bertanggung jawab untuk melakukan perbaikan sesegera mungkin untuk memulihkan layanan.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 7: Ganti Rugi (Indemnification) */}
              <section id="cand-terms-ganti-rugi" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <Scale className="size-5 text-[#7C3AED] shrink-0" />
                  7. Ganti Rugi (Indemnification)
                </h2>
                <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <div className="space-y-2">
                    <p>
                      <strong>7.1 Pembebasan Tanggung Jawab:</strong> Anda setuju untuk mengganti rugi, membebaskan, dan melepaskan Kami dari segala bentuk klaim, tuntutan, gugatan, kerugian, kewajiban, kerusakan, dan biaya yang timbul akibat atau terkait dengan:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                      <li><strong>Pelanggaran Ketentuan:</strong> Pelanggaran yang Anda lakukan terhadap Syarat dan Ketentuan ini.</li>
                      <li><strong>Penyalahgunaan Layanan:</strong> Penggunaan platform yang tidak semestinya, ilegal, atau melanggar hukum oleh Anda (misal: pemalsuan identitas).</li>
                      <li><strong>Pelanggaran Hak Pihak Lain:</strong> Pelanggaran Anda terhadap hak pihak lain manapun, termasuk namun tidak terbatas pada hak privasi, hak cipta, atau hak milik orang lain (misal: scraping data kandidat lain, Perusahaan, atau Partner Djoin).</li>
                      <li><strong>Kelalaian Keamanan:</strong> Kebocoran akses yang disebabkan oleh kelalaian Anda dalam menjaga keamanan perangkat seluler, kerahasiaan OTP, PIN, atau akses biometrik akun Anda.</li>
                    </ul>
                  </div>
                  <p>
                    <strong>7.2 Mekanisme Penyelesaian:</strong> Dalam hal terjadi tuntutan sebagaimana dimaksud dalam pasal ini, Kami berhak untuk mengontrol pertahanan dan penyelesaian hukum atas klaim tersebut, dan Anda diwajibkan untuk bekerja sama sepenuhnya dengan Kami dalam mempertahankan hak-hak tersebut serta menanggung seluruh biaya yang timbul.
                  </p>
                </div>
              </section>

              {/* Section 8: Masa Berlaku dan Pengakhiran */}
              <section id="cand-terms-pengakhiran" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <Lock className="size-5 text-[#7C3AED] shrink-0" />
                  8. Masa Berlaku dan Pengakhiran
                </h2>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <p>
                    <strong>8.1 Masa Berlaku:</strong> Syarat dan Ketentuan ini mulai berlaku dan mengikat secara hukum sejak tanggal Anda mendaftarkan akun atau menggunakan layanan ProofyLink Talent Network, dan akan terus berlaku selama akun Anda masih aktif atau sampai diakhiri oleh salah satu pihak sesuai dengan ketentuan pasal ini.
                  </p>
                  <p>
                    <strong>8.2 Pengakhiran oleh Anda (Hapus Akun):</strong> Anda berhak untuk mengakhiri penggunaan layanan dalam platform sewaktu-waktu dengan cara mengajukan permohonan penghapusan akun melalui fitur “Hapus Akun” yang tersedia di menu Pengaturan platform atau menghubungi layanan pelanggan kami.
                  </p>
                  <p>
                    <strong>8.3 Pengakhiran oleh Kami (Suspensi/Blokir):</strong> Kami berhak untuk membekukan, menangguhkan (<em>suspend</em>), atau mengakhiri akun Anda secara sepihak dan seketika tanpa pemberitahuan sebelumnya apabila:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                    <li>Anda melanggar salah satu poin dalam Syarat dan Ketentuan ini atau peraturan perundang-undangan yang berlaku;</li>
                    <li>Terdeteksi adanya aktivitas mencurigakan, penipuan (<em>fraud</em>), pemalsuan identitas, atau penyalahgunaan akun untuk aktivitas ilegal;</li>
                    <li>Anda mencemarkan nama baik atau reputasi Kami;</li>
                    <li>Adanya perintah dari kepolisian, pengadilan, atau otoritas yang berwenang; atau</li>
                    <li>Akun Anda tidak aktif dalam jangka waktu yang lama sesuai kebijakan retensi data Kami.</li>
                  </ul>
                  <p>
                    <strong>8.4 Efek Pengakhiran:</strong> Dalam hal terjadi pengakhiran akun (baik oleh Anda maupun oleh Kami):
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                    <li>Seluruh hak penggunaan platform yang diberikan kepada Anda otomatis berakhir;</li>
                    <li>Kami tidak berkewajiban untuk mengembalikan dana (<em>refund</em>) atas sisa langganan yang masih tersisa di akun Anda pada saat pengakhiran terjadi, terutama jika pengakhiran disebabkan oleh pelanggaran yang Anda lakukan.</li>
                  </ul>
                </div>
              </section>

              {/* Section 9: Hukum yang Berlaku dan Penyelesaian Sengketa */}
              <section id="cand-terms-hukum-sengketa" className="scroll-mt-20 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <Scale className="size-5 text-[#7C3AED] shrink-0" />
                  9. Hukum yang Berlaku dan Penyelesaian Sengketa
                </h2>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <p>
                    <strong>9.1 Hukum:</strong> Ketentuan ini diatur dan ditafsirkan berdasarkan hukum Negara Republik Indonesia.
                  </p>
                  <p>
                    <strong>9.2 Musyawarah:</strong> Segala perselisihan yang timbul akan diselesaikan terlebih dahulu secara musyawarah untuk mufakat dalam jangka waktu 30 (tiga puluh) hari kalender.
                  </p>
                  <p>
                    <strong>9.3 Domisili Hukum:</strong> Apabila musyawarah tidak tercapai, perselisihan akan diselesaikan melalui <strong>Pengadilan Negeri Kota Denpasar</strong>.
                  </p>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Bottom Action Strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={isWorkspace ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-xl cursor-pointer",
                isWorkspace
                  ? "bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xs"
                  : "border-slate-200 text-slate-800 hover:bg-slate-50"
              )}
              asChild
            >
              <Link href={backHref} className="gap-2">
                {isWorkspace ? <LayoutDashboard className="size-4" /> : <ArrowLeft className="size-4" />}
                <span>{backLabel}</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="rounded-xl text-[#7C3AED] hover:bg-purple-50 hover:text-[#6D28D9] cursor-pointer" asChild>
              <Link href={`/privacy${preserveQuery}`}>Baca Kebijakan Privasi →</Link>
            </Button>
          </div>
          <p className="text-xs text-slate-400">
            Pertanyaan legal?{" "}
            <a href="mailto:legal@proofylink.com" className="text-slate-700 hover:text-slate-900 underline underline-offset-4">
              legal@proofylink.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
