"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";

const PREVIEW_QUOTA = 5;

export default function Page() {
  const { previewsUsed } = useApp();
  const remaining = Math.max(0, PREVIEW_QUOTA - previewsUsed);

  return (
    <ProtectedRoute role="recruiter">
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <p className="font-mono text-xs uppercase tracking-widest text-[#7C3AED]">Workspace Recruiter</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Portal Rekruter</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
          Portal ini merangkum alur kerja rekruter di ProofyLink: pratinjau profil kandidat secara gratis, buka profil
          penuh dengan token saat membutuhkan konteks lengkap, lalu ajukan screening yang selalu dimulai dari consent
          kandidat.
        </p>

        <Card className="mt-8">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Kuota pratinjau gratis trial</p>
            <p className="mt-2 font-mono text-4xl font-bold">
              {remaining}
              <span className="text-lg font-medium text-muted-foreground"> / {PREVIEW_QUOTA}</span>
            </p>
            <div className="mt-3 h-2 rounded-full bg-[#7C3AED]/20" role="presentation">
              <div
                className="h-2 rounded-full bg-[#7C3AED]"
                style={{ width: `${(remaining / PREVIEW_QUOTA) * 100}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Pratinjau menampilkan profil yang sudah di-masking tanpa data kontak. Screening membutuhkan consent
              kandidat dan satu token — hasilnya tidak pernah menjadi keputusan hire/reject otomatis.
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild>
            <Link href="/recruiter/screenings/new">
              <FileText className="size-4" /> Buat permintaan screening
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="size-4" /> Kembali ke Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/search">
              <Search className="size-4" /> Cari Talent <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </main>
    </ProtectedRoute>
  );
}
