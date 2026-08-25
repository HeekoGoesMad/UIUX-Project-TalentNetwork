import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | ProofyLink",
  description: "Syarat dan ketentuan penggunaan ProofyLink.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Legal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Syarat &amp; Ketentuan</h1>
        </div>
        <p className="leading-7 text-muted-foreground">
          ProofyLink saat ini merupakan produk demo. Halaman ini belum berisi dokumen hukum yang mengikat, seluruh data yang tampil adalah data contoh, dan fitur seperti autentikasi, token, serta screening hanya untuk keperluan pratinjau.
        </p>
        <p className="leading-7 text-muted-foreground">
          Dokumen Syarat &amp; Ketentuan lengkap sedang disiapkan dan akan diterbitkan sebelum produk dirilis secara resmi. Sampai dokumen tersebut tersedia, mohon gunakan platform ini hanya untuk mencoba fitur demo.
        </p>
        <p className="leading-7 text-muted-foreground">
          Jika ada pertanyaan mengenai ketentuan penggunaan, silakan hubungi tim ProofyLink melalui fitur Pesan di dalam aplikasi.
        </p>
        <Button variant="outline" asChild>
          <Link href="/">Kembali ke beranda</Link>
        </Button>
      </div>
    </div>
  );
}
