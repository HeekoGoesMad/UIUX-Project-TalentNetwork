import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileCheck2,
  FileText,
  GraduationCap,
  Lock,
  Scale,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | ProofyLink",
  description: "Syarat dan ketentuan resmi penggunaan platform ProofyLink Talent Network.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-8 sm:py-10 border-b border-slate-200/80">
      <div className="container mx-auto px-4 max-w-4xl space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Kembali ke Pendaftaran
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
              href="/privacy"
              className="px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all"
            >
              Kebijakan Privasi
            </Link>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 font-mono text-xs font-semibold text-[#7C3AED] border border-purple-200/70">
            <Scale className="size-3.5" />
            Ketentuan Layanan Resmi
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Syarat &amp; Ketentuan Penggunaan
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            Dokumen hukum yang mengikat dan mengatur hak, kewajiban, serta standar integritas bagi kandidat, institusi universitas mitra, dan rekruter dalam ekosistem ProofyLink Talent Network.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-200/70">
            <span>Terakhir diperbarui: 18 September 2026</span>
            <span>·</span>
            <span>Versi: 2.4 (Kepatuhan UU PDP &amp; Consent-First)</span>
          </div>
        </div>

        {/* Quick Jump Anchor Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs font-medium">
          <a
            href="#definisi"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-colors shadow-2xs"
          >
            1. Definisi &amp; Layanan
          </a>
          <a
            href="#persetujuan"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-colors shadow-2xs"
          >
            2. Persetujuan Akses Data
          </a>
          <a
            href="#kewajiban"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-colors shadow-2xs"
          >
            3. Kewajiban &amp; Akurasi
          </a>
          <a
            href="#verifikasi"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-colors shadow-2xs"
          >
            4. Verifikasi Kampus
          </a>
          <a
            href="#token-transaksi"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-colors shadow-2xs"
          >
            5. Model 1 Token
          </a>
        </div>

        {/* Focused Editorial Document Canvas */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-10 lg:p-12 shadow-xs space-y-10">
          {/* Section 1: Definisi */}
          <section id="definisi" className="scroll-mt-20 space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <FileText className="size-5 text-[#7C3AED] shrink-0" />
              1. Definisi &amp; Ruang Lingkup Layanan
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                ProofyLink adalah platform jaringan talenta profesional terverifikasi yang mengintegrasikan ekosistem verifikasi universitas, sistem evaluasi sinyal kompetensi objektif, dan asesmen kepatuhan rekruter korporat.
              </p>
              <p>
                Layanan ProofyLink mencakup:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>Penyusunan profil talenta cerdas berbasis bukti kompetensi konkret (*proof of competence*).</li>
                <li>Evaluasi kecocokan sinyal AI berbasis pilar kemampuan teknis, bukan sekadar kata kunci resume.</li>
                <li>Sistem verifikasi almamater bersama Career Center universitas mitra terakreditasi.</li>
                <li>Fasilitas interaksi dan pembukaan kontak berbasis izin aktif (*Consent-First*) dengan model ekonomis 1 token transparan tanpa biaya langganan berulang.</li>
              </ul>
            </div>
          </section>

          {/* Section 2: Data Access Consent Callout */}
          <section id="persetujuan" className="scroll-mt-20">
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 space-y-3.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
                <FileCheck2 className="size-5 text-[#7C3AED] shrink-0" />
                <span>2. Klausul Persetujuan Akses Data (Data Access Consent)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Saat melakukan registrasi akun di ProofyLink, kandidat menyatakan dan menyetujui secara sadar bahwa:
              </p>
              <blockquote className="rounded-xl border border-slate-200 bg-white p-4 font-mono text-xs sm:text-sm text-slate-800 leading-relaxed shadow-2xs">
                &ldquo;Data yang dimasukkan ke dalam platform dapat diakses oleh DJoin dan recruiter yang telah terverifikasi sesuai Kebijakan Privasi dan Ketentuan Penggunaan yang berlaku.&rdquo;
              </blockquote>
              <p className="text-xs text-slate-500 leading-relaxed">
                Klausul ini menjamin bahwa profil talenta, framework kompetensi (Hard Competencies, Tools, Soft Skills), serta riwayat pendidikan dan portofolio Anda hanya dapat ditinjau oleh pihak rekruter yang telah melalui verifikasi kepatuhan legalitas resmi (*Verified Corporate Recruiter*).
              </p>
            </div>
          </section>

          {/* Section 3: Kewajiban & Akurasi */}
          <section id="kewajiban" className="scroll-mt-20 space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <Lock className="size-5 text-[#7C3AED] shrink-0" />
              3. Kewajiban &amp; Akurasi Informasi Pengguna
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                Kredibilitas platform bergantung penuh pada keaslian informasi yang tercatat. Seluruh pengguna wajib mematuhi standar berikut:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>
                  <strong className="text-slate-800">Kejujuran Data:</strong> Kandidat wajib mencantumkan riwayat pendidikan, riwayat pekerjaan, dan portofolio proyek yang faktual dan dapat dipertanggungjawabkan.
                </li>
                <li>
                  <strong className="text-slate-800">Orisinalitas Dokumen:</strong> Segala unggahan bukti kerja, sertifikasi, atau dokumen PDF harus merupakan milik sah pengguna atau mencantumkan atribusi yang sesuai.
                </li>
                <li>
                  <strong className="text-slate-800">Integritas Rekruter:</strong> Rekruter korporat dilarang keras menyebarluaskan kontak kandidat kepada pihak ketiga tanpa izin tertulis dari kandidat yang bersangkutan.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4: Verifikasi Kampus */}
          <section id="verifikasi" className="scroll-mt-20 space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <GraduationCap className="size-5 text-[#7C3AED] shrink-0" />
              4. Verifikasi Kampus &amp; Kemitraan Career Center
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                Kandidat yang mencantumkan almamater dari universitas mitra ProofyLink (termasuk Universitas Indonesia, ITB, UGM, ITS, Telkom University, Binus, Unpad, Unair, Undip, Brawijaya) memberikan wewenang kepada tim Career Center kampus terkait untuk memvalidasi status kelulusan dan kemahasiswaan sebelum badge verifikasi resmi disematkan pada profil.
              </p>
              <p>
                Pihak universitas tidak memiliki wewenang untuk mengubah preferensi gaji atau data privasi kandidat di luar status verifikasi akademik.
              </p>
            </div>
          </section>

          {/* Section 5: Model 1 Token & Akses Kontak */}
          <section id="token-transaksi" className="scroll-mt-20 space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <WalletCards className="size-5 text-[#7C3AED] shrink-0" />
              5. Model 1 Token &amp; Transaksi Pembukaan Kontak
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                ProofyLink menerapkan mekanisme konsumsi token transparan tanpa langganan wajib:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>Eksplorasi direktori talenta dan peninjauan sinyal pilar kompetensi bersifat terbuka tanpa biaya token.</li>
                <li>1 Token hanya didebit saat rekruter mengajukan pembukaan kontak langsung resmi kepada kandidat terverifikasi.</li>
                <li>Jika kandidat menolak permohonan kontak atau tidak merespons dalam batas waktu 72 jam, token yang telah dialokasikan akan dikembalikan sepenuhnya ke saldo rekruter.</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Penegakan Hukum & Pembatasan Akun */}
          <section id="sanksi" className="scroll-mt-20 space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <ShieldCheck className="size-5 text-[#7C3AED] shrink-0" />
              6. Penegakan Kebijakan &amp; Sanksi Pelanggaran
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Segala bentuk manipulasi data profil, pemalsuan sertifikat, penyalahgunaan kontak untuk aktivitas penipuan (*scamming/spamming*), atau pelanggaran hak kekayaan intelektual akan mengakibatkan pemblokiran akun permanen, pencabutan status verifikasi, dan pelaporan kepada pihak berwenang sesuai hukum Republik Indonesia.
            </p>
          </section>

          {/* Bottom Action Strip */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-800 hover:bg-slate-50 cursor-pointer" asChild>
                <Link href="/register" className="gap-1.5">
                  <ArrowLeft className="size-4" /> Kembali ke Pendaftaran
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="rounded-xl text-[#7C3AED] hover:bg-purple-50 hover:text-[#6D28D9] cursor-pointer" asChild>
                <Link href="/privacy">Baca Kebijakan Privasi →</Link>
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
    </div>
  );
}
