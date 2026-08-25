import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-md px-4 py-20 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-[#7C3AED]">404 / Profil Tidak Ditemukan</p>
      <h1 className="mt-3 text-3xl font-bold">Profil ini sudah tidak tersedia.</h1>
      <p className="mt-3 text-muted-foreground">Coba cari kandidat lain di jaringan talent.</p>
      <Button className="mt-6" asChild>
        <Link href="/search">Kembali ke pencarian</Link>
      </Button>
    </div>
  );
}
