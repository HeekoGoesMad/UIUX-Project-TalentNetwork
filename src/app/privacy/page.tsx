import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Eye, Lock, ShieldCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | ProofyLink",
  description: "Kebijakan privasi dan perlindungan data ProofyLink Talent Network.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-mono text-xs font-bold text-emerald-800 border border-emerald-200">
            <ShieldCheck className="size-3.5" />
            Perlindungan Data Pribadi
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Kebijakan Privasi
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Terakhir diperbarui: 28 Agustus 2026 · Standar Keamanan Data Talent Network
          </p>
        </div>

        {/* Highlight Banner: Feature 8 Data Access Consent */}
        <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 p-6 sm:p-7 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
            <Sparkles className="size-5 shrink-0" />
            <span>Persetujuan Akses Data (Data Access Consent)</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Dengan mendaftar sebagai kandidat di ProofyLink, Anda memberikan izin akses:
          </p>
          <blockquote className="border-l-4 border-emerald-600 pl-4 py-2 text-slate-900 italic bg-emerald-100/50 rounded-r-xl font-medium text-sm sm:text-base leading-relaxed">
            &ldquo;Data yang dimasukkan ke dalam platform dapat diakses oleh DJoin dan recruiter yang telah terverifikasi sesuai Kebijakan Privasi dan Ketentuan Penggunaan yang berlaku.&rdquo;
          </blockquote>
          <p className="text-xs text-slate-600">
            Pemberian akses ini bertujuan agar rekruter dapat menilai kesesuaian kualifikasi Anda dengan posisi yang relevan secara transparan, aman, dan tanpa perantara ilegal.
          </p>
        </div>

        {/* Section 1 */}
        <div className="rounded-2xl border bg-card p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Lock className="size-5 text-emerald-600" />
            1. Data Pribadi yang Dikumpulkan
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Kami mengumpulkan informasi yang Anda berikan secara langsung saat pembuatan profil CV dan onboarding, meliputi:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground leading-relaxed">
            <li><strong>Identitas Diri &amp; Kontak:</strong> Nama lengkap, domisili, email, nomor telepon/WhatsApp, dan foto profil.</li>
            <li><strong>Riwayat Pendidikan:</strong> Jenjang studi, nama universitas/institusi, program studi, IPK, serta tahun masuk dan kelulusan.</li>
            <li><strong>Riwayat Pengalaman Kerja:</strong> Nama perusahaan, posisi, tipe pekerjaan (*Full Time, Internship, Contract, Freelance*), periode kerja, deskripsi pekerjaan, dan capaian utama.</li>
            <li><strong>Framework Kompetensi:</strong> Hard Competencies teknis, Tools/Software yang dikuasai, serta Soft Skills interpersonal.</li>
            <li><strong>Portofolio &amp; Sertifikat:</strong> Tautan proyek publik, berkas PDF CV, dan dokumen pendukung lainnya.</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="rounded-2xl border bg-card p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Eye className="size-5 text-emerald-600" />
            2. Pihak yang Berwenang Mengakses Data Anda
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Data Anda dijaga dengan standar privasi tinggi dan hanya dibagikan kepada:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground leading-relaxed">
            <li><strong>DJoin &amp; ProofyLink:</strong> Sebagai pengelola platform untuk memproses pencocokan algoritmik, evaluasi skor ATS, dan moderasi akun.</li>
            <li><strong>Verified Recruiters:</strong> Rekruter korporat yang akun dan legalitas perusahaannya telah disetujui (*Approved*) oleh admin platform.</li>
            <li><strong>Career Center Kampus:</strong> Pengelola universitas terafiliasi yang melakukan validasi status kemahasiswaan/alumni.</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="rounded-2xl border bg-card p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-600" />
            3. Hak Kendali dan Privasi Kandidat
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Anda berhak mengatur status ketersediaan kerja (*Open to Work*, *Open for Opportunities*, *Freelance*, atau *Not Available*), memperbarui isi CV kapan saja, mengunduh salinan CV dalam format ATS/Modern, atau meminta penghapusan akun beserta seluruh data terkait.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
          <Button variant="outline" asChild>
            <Link href="/register" className="gap-1.5">
              <ArrowLeft className="size-4" /> Kembali ke Pendaftaran
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/terms">Baca Syarat &amp; Ketentuan</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
