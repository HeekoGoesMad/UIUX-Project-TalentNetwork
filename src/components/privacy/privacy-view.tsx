"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Eye,
  FileCheck2,
  FolderLock,
  LayoutDashboard,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useLegalBackNav } from "@/hooks/use-legal-back-nav";
import { cn } from "@/lib/utils";

export function PrivacyView() {
  const { backHref, backLabel, isWorkspace, preserveQuery } = useLegalBackNav();

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
            <Link
              href={`/terms${preserveQuery}`}
              className="px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all"
            >
              Syarat &amp; Ketentuan
            </Link>
            <span className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-white text-slate-900 shadow-2xs cursor-default">
              Kebijakan Privasi
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 font-mono text-xs font-semibold text-[#7C3AED] border border-purple-200/70">
            <ShieldCheck className="size-3.5" />
            Standar Keamanan &amp; Perlindungan Data
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Kebijakan Privasi &amp; Perlindungan Data
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            Penjelasan transparan tentang bagaimana profil profesional, evaluasi pilar kompetensi, dan verifikasi identitas Anda dikumpulkan, diproses, dan dilindungi sesuai standar regulasi yang berlaku.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-200/70">
            <span>Terakhir diperbarui: 18 September 2026</span>
            <span>·</span>
            <span>Kepatuhan: UU No. 27/2022 tentang Perlindungan Data Pribadi (UU PDP)</span>
          </div>
        </div>

        {/* Quick Jump Anchor Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs font-medium">
          <a
            href="#konsen-utama"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-colors shadow-2xs"
          >
            1. Persetujuan Akses Data
          </a>
          <a
            href="#data-dikumpulkan"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-colors shadow-2xs"
          >
            2. Data yang Dikumpulkan
          </a>
          <a
            href="#pihak-berwenang"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-colors shadow-2xs"
          >
            3. Pihak yang Berwenang
          </a>
          <a
            href="#keamanan-token"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-colors shadow-2xs"
          >
            4. Masking &amp; 1 Token
          </a>
          <a
            href="#hak-kendali"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-colors shadow-2xs"
          >
            5. Hak Kendali Pengguna
          </a>
        </div>

        {/* Focused Editorial Document Canvas */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-10 lg:p-12 shadow-xs space-y-10">
          {/* Section 1: Data Access Consent Callout */}
          <section id="konsen-utama" className="scroll-mt-20">
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 space-y-3.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
                <FileCheck2 className="size-5 text-[#7C3AED] shrink-0" />
                <span>1. Persetujuan Akses Data Resmi (Data Access Consent)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Dengan mendaftar dan menggunakan platform ProofyLink, kandidat memberikan izin akses yang sah dan terikat:
              </p>
              <blockquote className="rounded-xl border border-slate-200 bg-white p-4 font-mono text-xs sm:text-sm text-slate-800 leading-relaxed shadow-2xs">
                &ldquo;Data yang dimasukkan ke dalam platform dapat diakses oleh DJoin dan recruiter yang telah terverifikasi sesuai Kebijakan Privasi dan Ketentuan Penggunaan yang berlaku.&rdquo;
              </blockquote>
              <p className="text-xs text-slate-500 leading-relaxed">
                Prinsip *Consent-First* menjamin bahwa sebelum ada izin eksplisit, kontak sensitif (nomor telepon WhatsApp dan email personal) tetap berada dalam status terenkripsi dan terlindung dari akses publik atau bot otomatis.
              </p>
            </div>
          </section>

          {/* Section 2: Data yang Dikumpulkan */}
          <section id="data-dikumpulkan" className="scroll-mt-20 space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <FolderLock className="size-5 text-[#7C3AED] shrink-0" />
              2. Kategori Data Pribadi yang Dikumpulkan
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                Kami hanya mengumpulkan informasi yang esensial untuk memproses verifikasi kredibilitas, asesmen sinyal kompetensi, dan pencocokan pekerjaan:
              </p>
              <div className="grid gap-3 sm:grid-cols-2 pt-1">
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                  <span className="font-semibold text-xs text-slate-900 block">Identitas &amp; Kontak Utama</span>
                  <p className="text-xs text-slate-600 leading-normal">
                    Nama lengkap, email kerja/pribadi, nomor WhatsApp, kota domisili, dan foto profil profesional.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                  <span className="font-semibold text-xs text-slate-900 block">Riwayat Akademik &amp; Kampus</span>
                  <p className="text-xs text-slate-600 leading-normal">
                    Institusi universitas, jenjang studi, program studi, tahun kelulusan, dan status verifikasi Career Center.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                  <span className="font-semibold text-xs text-slate-900 block">Framework Kompetensi Teknis</span>
                  <p className="text-xs text-slate-600 leading-normal">
                    Hard competencies, tools dan stack yang dikuasai, skor evaluasi pilar, serta matriks sinyal kompetensi tervalidasi.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                  <span className="font-semibold text-xs text-slate-900 block">Portofolio &amp; Bukti Karya</span>
                  <p className="text-xs text-slate-600 leading-normal">
                    Tautan GitHub/Figma publik, ringkasan studi kasus, sertifikat kredensial, dan dokumen PDF pendukung.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Pihak yang Berwenang */}
          <section id="pihak-berwenang" className="scroll-mt-20 space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <Eye className="size-5 text-[#7C3AED] shrink-0" />
              3. Pihak yang Berwenang Mengakses Data
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                Data kandidat dijaga dengan standar kepatuhan tinggi dan tidak pernah diperjualbelikan kepada broker data pihak ketiga:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li>
                  <strong className="text-slate-800">DJoin &amp; ProofyLink:</strong> Sebagai pengelola infrastruktur untuk melakukan evaluasi kecocokan sinyal AI, moderasi integritas akun, dan pemeliharaan platform.
                </li>
                <li>
                  <strong className="text-slate-800">Verified Corporate Recruiters:</strong> Rekruter korporat yang telah melalui proses verifikasi badan usaha resmi (*KYB - Know Your Business*) dan terikat perjanjian kerahasiaan (*NDA*).
                </li>
                <li>
                  <strong className="text-slate-800">Career Center Universitas Mitra:</strong> Tim pengelola kampus yang berwenang memeriksa validitas status kelulusan mahasiswa atau alumni mereka.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4: Masking & Model 1 Token */}
          <section id="keamanan-token" className="scroll-mt-20 space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <Lock className="size-5 text-[#7C3AED] shrink-0" />
              4. Mekanisme Masking Identitas &amp; Pembukaan Berizin
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                Untuk melindungi kandidat dari cold email massal dan spam tanpa izin:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>Sebelum kontak dibuka, rekruter hanya dapat melihat kode talenta unik (contoh: <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">TL-8842</code>), sinyal pilar kompetensi, dan tautan portofolio publik.</li>
                <li>Nomor WhatsApp dan email disamarkan secara kriptografis (*contact masking*).</li>
                <li>Kontak resmi hanya ditampilkan setelah rekruter mengonfirmasi alokasi 1 Token dan kandidat menyatakan persetujuan komunikasi.</li>
              </ul>
            </div>
          </section>

          {/* Section 5: Hak Kendali Pengguna */}
          <section id="hak-kendali" className="scroll-mt-20 space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <UserCheck className="size-5 text-[#7C3AED] shrink-0" />
              5. Hak Kendali, Koreksi, &amp; Penghapusan Data
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                Sesuai dengan Undang-Undang Perlindungan Data Pribadi (UU PDP), Anda memiliki kendali penuh atas data Anda:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li><strong className="text-slate-800">Hak Akses &amp; Koreksi:</strong> Memperbarui informasi profil, keahlian, dan riwayat pekerjaan setiap saat melalui dashboard pengaturan.</li>
                <li><strong className="text-slate-800">Pengaturan Ketersediaan:</strong> Mengubah status ketersediaan (*Open to Work, Notice Period, Freelance, Not Available*) untuk menyembunyikan profil dari pencarian publik.</li>
                <li><strong className="text-slate-800">Hak Portabilitas:</strong> Mengunduh resume yang terformat dalam standar ATS kapan saja.</li>
                <li><strong className="text-slate-800">Hak Penghapusan (Right to be Forgotten):</strong> Mengajukan permohonan penutupan akun dan penghapusan data secara permanen dari server kami.</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Data Protection Officer */}
          <section className="space-y-4 pt-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <Mail className="size-5 text-[#7C3AED] shrink-0" />
              6. Kontak Data Protection Officer (DPO)
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Jika Anda memiliki pertanyaan mengenai tata kelola privasi data, pelaporan potensi kerentanan keamanan, atau ingin mengajukan hak penghapusan data pribadi, silakan menghubungi pejabat perlindungan data kami melalui:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs space-y-1 text-slate-700">
              <p>Email: <a href="mailto:dpo@proofylink.com" className="text-[#7C3AED] font-semibold hover:underline">dpo@proofylink.com</a></p>
              <p>Subjek: <span className="text-slate-900 font-semibold">[Privasi Data] Permohonan Hak Pengguna</span></p>
              <p>Waktu Respons: Maksimal 2x24 jam kerja</p>
            </div>
          </section>

          {/* Bottom Action Strip */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-slate-100">
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
                <Link href={`/terms${preserveQuery}`}>Baca Syarat &amp; Ketentuan →</Link>
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              ProofyLink Talent Network · Jakarta, Indonesia
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
