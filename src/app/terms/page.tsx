import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, FileText, Lock, ShieldCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | ProofyLink",
  description: "Syarat dan ketentuan penggunaan platform ProofyLink Talent Network.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 font-mono text-xs font-bold text-[#7C3AED] border border-purple-200">
            <ShieldCheck className="size-3.5" />
            Ketentuan Layanan Resmi
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Syarat &amp; Ketentuan Penggunaan
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Terakhir diperbarui: 28 Agustus 2026 · Berlaku untuk seluruh pengguna Talent Network
          </p>
        </div>

        {/* Highlight Banner: Feature 8 Data Access Consent */}
        <div className="rounded-2xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-white to-purple-50/50 p-6 sm:p-7 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#7C3AED] font-bold text-base">
            <Sparkles className="size-5 shrink-0" />
            <span>Persetujuan Akses Data (Data Access Consent)</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Saat melakukan registrasi akun di ProofyLink, kandidat menyatakan dan menyetujui secara sadar bahwa:
          </p>
          <blockquote className="border-l-4 border-[#7C3AED] pl-4 py-2 text-slate-900 italic bg-purple-100/50 rounded-r-xl font-medium text-sm sm:text-base leading-relaxed">
            &ldquo;Data yang dimasukkan ke dalam platform dapat diakses oleh DJoin dan recruiter yang telah terverifikasi sesuai Kebijakan Privasi dan Ketentuan Penggunaan yang berlaku.&rdquo;
          </blockquote>
          <p className="text-xs text-slate-600">
            Klausul ini menjamin bahwa profil talenta, framework kompetensi (Hard Competencies, Tools, Soft Skills), serta riwayat pendidikan dan portofolio Anda hanya dapat ditinjau oleh pihak rekruter yang telah melalui verifikasi kepatuhan legalitas (*Verified Recruiter*).
          </p>
        </div>

        {/* Section 1 */}
        <div className="rounded-2xl border bg-card p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText className="size-5 text-[#7C3AED]" />
            1. Definisi &amp; Ruang Lingkup Layanan
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ProofyLink adalah platform jaringan talenta profesional yang mengintegrasikan ekosistem verifikasi universitas, sistem manajemen lowongan cerdas, dan asesmen kepatuhan rekruter. Layanan ini mencakup pembuatan CV cerdas, asesmen kesiapan ATS, analitik pencocokan pekerjaan, serta fasilitas perpesanan langsung antara kandidat dan rekruter.
          </p>
        </div>

        {/* Section 2 */}
        <div className="rounded-2xl border bg-card p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Lock className="size-5 text-[#7C3AED]" />
            2. Kewajiban &amp; Akurasi Informasi Kandidat
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <li>Kandidat wajib memberikan informasi riwayat pendidikan, riwayat pekerjaan, dan keahlian yang jujur serta sesuai fakta.</li>
            <li>Kandidat bertanggung jawab penuh atas keaslian dokumen portofolio dan sertifikasi yang diunggah.</li>
            <li>Segala bentuk manipulasi data profil atau sertifikat palsu dapat berakibat pada penonaktifan akun dan pembatalan status verifikasi kampus.</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="rounded-2xl border bg-card p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="size-5 text-[#7C3AED]" />
            3. Verifikasi Kampus &amp; Kemitraan Career Center
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Kandidat yang mencantumkan almamater dari universitas mitra ProofyLink (seperti Universitas Indonesia, ITB, UGM, ITS, Telkom University, Binus, Unpad, Unair, Undip, Brawijaya) memberikan wewenang kepada tim Career Center kampus terkait untuk memverifikasi keabsahan data kelulusan sebelum badge verifikasi resmi diterbitkan.
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
            <Link href="/privacy">Baca Kebijakan Privasi</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
