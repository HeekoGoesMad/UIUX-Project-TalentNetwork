"use client";

import Link from "next/link";
import { ArrowRight, Bell, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function ContactRequestsPage() {
  return (
    <ProtectedRoute role="candidate">
      <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <div className="text-center">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 shadow-sm ring-1 ring-purple-100">
            <Bell className="size-7" />
          </div>
          <p className="mt-4 font-mono text-xs font-semibold uppercase tracking-wider text-purple-600">
            Pembaruan Sistem Privasi
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Permintaan Kontak Kini Terpusat di Notifikasi
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Untuk pengalaman yang lebih cepat dan terpadu, semua permintaan kontak dari recruiter
            maupun partner sekarang dapat ditinjau dan disetujui hanya dengan <strong>1-klik</strong> langsung
            dari Pusat Notifikasi kamu.
          </p>
        </div>

        <Card className="mt-8 border-purple-100 bg-linear-to-b from-purple-50/50 to-white shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">1-Click Consent & Response</h2>
                  <p className="text-xs text-muted-foreground">
                    Terima atau tolak izin akses kontak tanpa perlu berpindah-pindah menu atau form panjang.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Kontrol Penuh & Data Terenkripsi</h2>
                  <p className="text-xs text-muted-foreground">
                    Informasi kontak privat kamu (email & nomor telepon) hanya akan dibagikan ke recruiter yang telah kamu setujui.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Terintegrasi Pesan Langsung</h2>
                  <p className="text-xs text-muted-foreground">
                    Setelah disetujui, kamu dan recruiter dapat langsung melanjutkan komunikasi di ruang pesan.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end border-t pt-6">
              <Button variant="outline" asChild>
                <Link href="/candidate">Kembali ke Dashboard</Link>
              </Button>
              <Button className="bg-purple-600 text-white hover:bg-purple-700 shadow-sm" asChild>
                <Link href="/notifications?tab=contact-requests">
                  Buka Permintaan di Notifikasi
                  <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </ProtectedRoute>
  );
}

