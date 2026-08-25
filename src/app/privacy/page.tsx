import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | ProofyLink",
  description: "Kebijakan privasi ProofyLink.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Legal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Kebijakan Privasi</h1>
        </div>
        <p className="leading-7 text-muted-foreground">
          ProofyLink saat ini merupakan produk demo. Kami tidak menjual atau membagikan data apa pun karena seluruh profil, pesan, dan aktivitas pada platform ini berasal dari data contoh yang tidak merepresentasikan orang sungguhan.
        </p>
        <p className="leading-7 text-muted-foreground">
          Dokumen Kebijakan Privasi lengkap sedang disiapkan, termasuk penjelasan tentang data yang dikumpulkan, dasar pemrosesan, dan hak Anda sebagai pengguna. Dokumen tersebut akan diterbitkan sebelum produk dirilis secara resmi.
        </p>
        <p className="leading-7 text-muted-foreground">
          Jika Anda memiliki pertanyaan tentang penanganan data, silakan hubungi tim ProofyLink melalui fitur Pesan di dalam aplikasi.
        </p>
        <Button variant="outline" asChild>
          <Link href="/">Kembali ke beranda</Link>
        </Button>
      </div>
    </div>
  );
}
