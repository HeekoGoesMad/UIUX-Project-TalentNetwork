"use client";

import Link from "next/link";
import { ArrowRight, Database, Search, ShieldCheck, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { candidates as demoCandidates } from "@/data/candidates";
import { maskName } from "@/lib/candidate-display";
import { useApp } from "@/providers/app-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Candidate } from "@/types";

export default function Dashboard() {
  const { tokens, scans, shortlisted, recentlyViewed, user, dbMode, bootstrapped, databaseError } = useApp();
  const [remoteCandidates, setRemoteCandidates] = useState<Candidate[]>([]);
  const [remoteLoaded, setRemoteLoaded] = useState(false);

  useEffect(() => {
    if (!dbMode || !bootstrapped) return;
    void fetch("/api/candidates?limit=12", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { candidates?: Candidate[] };
        if (response.ok) setRemoteCandidates(payload.candidates ?? []);
      })
      .catch(() => setRemoteCandidates([]))
      .finally(() => setRemoteLoaded(true));
  }, [dbMode, bootstrapped, user?.email]);

  const candidatesList = dbMode && remoteCandidates.length > 0 ? remoteCandidates : demoCandidates;
  const databaseEmpty = dbMode && bootstrapped && !databaseError && remoteLoaded && remoteCandidates.length === 0;

  const displayNameFor = (candidate: Candidate) =>
    scans.some((scan) => scan.candidateId === candidate.id) ? candidate.name : maskName(candidate.name);

  const recent = recentlyViewed
    .map((id) => candidatesList.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is Candidate => Boolean(candidate))
    .slice(0, 3);
  const scanned = scans
    .slice()
    .reverse()
    .map((scan) => candidatesList.find((candidate) => candidate.id === scan.candidateId))
    .filter((candidate): candidate is Candidate => Boolean(candidate))
    .slice(0, 3);
  const shortlist = candidatesList
    .filter((candidate) => shortlisted.includes(candidate.id))
    .slice(0, 3);

  return (
    <ProtectedRoute role="recruiter">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-500">
              <ShieldCheck className="size-4" /> Workspace Recruiter
            </p>
            <h1 className="mt-3 text-3xl font-bold text-[#1A1A2E]">
              Selamat datang kembali, {user?.name || "Recruiter"}.
            </h1>
            <p className="mt-2 text-muted-foreground">Lanjutkan pencarian dengan talent yang tepat.</p>
          </div>
          <Button asChild>
            <Link href="/search">
              <Search className="size-4" /> Cari Talent
            </Link>
          </Button>
        </div>

        {tokens === 0 ? (
          <div className="mt-6 flex flex-col justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-red-950">Token habis</p>
              <p className="mt-1 text-red-900/80">Anda tidak punya token untuk membuka profil kandidat baru. Beli token untuk melanjutkan.</p>
            </div>
            <Button asChild>
              <Link href="/pricing">
                Beli token sekarang <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        ) : tokens <= 5 && (
          <div className="mt-6 flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-amber-950">Saldo token hampir habis</p>
              <p className="mt-1 text-amber-900/80">Tersisa {tokens} token untuk membuka profil.</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/pricing">
                Beli token <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        )}

        {dbMode && !bootstrapped ? (
          <div className="mt-8 rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground" role="status">
            Memuat data database...
          </div>
        ) : dbMode && databaseError ? (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700" role="alert">
            Data dashboard belum dapat dimuat. {databaseError}
          </div>
        ) : databaseEmpty ? (
          <EmptyState
            icon={Database}
            title="Belum ada kandidat di database."
            description="Mode database aktif dan daftar kandidat masih kosong, sehingga dashboard tidak mencampur data demo ke dalam sesi ini. Untuk melihat alur dengan data contoh, coba mode demo."
            action={
              <Button asChild>
                <Link href="/search">Coba cari talent</Link>
              </Button>
            }
            className="mt-8"
          />
        ) : (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Saldo Token</p>
                  <p className="mt-2 flex items-center gap-2 font-mono text-4xl font-bold">
                    <WalletCards className="size-7 text-[#7C3AED]" />
                    {tokens}
                  </p>
                  <Link href="/pricing" className="mt-4 inline-flex text-sm font-semibold text-slate-900 hover:underline">
                    Beli lebih banyak token <ArrowRight className="ml-1 size-4" />
                  </Link>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Profil Dibuka</p>
                  <p className="mt-2 text-4xl font-bold">{scans.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Dalam Shortlist</p>
                  <p className="mt-2 text-4xl font-bold">{shortlisted.length}</p>
                </CardContent>
              </Card>
            </div>

            <section className="mt-8" aria-label="Aksi cepat">
              <div className="grid gap-4 md:grid-cols-2">
                <Link
                  href="/search"
                  className="card-interactive flex items-start justify-between gap-4 rounded-lg border bg-card p-5 shadow-sm"
                >
                  <span>
                    <span className="flex items-center gap-2 font-semibold text-foreground">
                      <Search className="size-4 text-[#7C3AED]" /> Cari Talent
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Jelajahi jaringan talent dan simpan kandidat potensial ke shortlist.
                    </span>
                  </span>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </Link>
                <Link
                  href="/recruiter"
                  className="card-interactive flex items-start justify-between gap-4 rounded-lg border bg-card p-5 shadow-sm"
                >
                  <span>
                    <span className="flex items-center gap-2 font-semibold text-foreground">
                      <ShieldCheck className="size-4 text-[#7C3AED]" /> Portal rekruter
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Pantau kuota pratinjau gratis dan buat permintaan screening berbasis consent.
                    </span>
                  </span>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </Link>
              </div>
            </section>

            <section className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_.8fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Lanjutkan Aktivitas Terakhir</CardTitle>
                </CardHeader>
                <CardContent>
                  {recent.length ? (
                    <div className="flex flex-col gap-3">
                      {recent.map((candidate) => (
                        <Link
                          key={candidate.id}
                          href={`/recruiter/discover/${candidate.id}`}
                          className="flex items-center justify-between rounded-xl border p-3 hover:bg-slate-50"
                        >
                          <span>
                            <span className="font-medium">{displayNameFor(candidate)}</span>
                            <span className="block text-sm text-muted-foreground">
                              {candidate.role} · {candidate.location}
                            </span>
                          </span>
                          <ArrowRight className="size-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50 p-5">
                      <p className="font-medium">Workspace Anda sudah siap.</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Cari kandidat di jaringan talent, lalu kembali ke sini untuk melanjutkan.
                      </p>
                      <Button className="mt-4" size="sm" asChild>
                        <Link href="/search">Mulai mencari</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Buka Profil</CardTitle>
                </CardHeader>
                <CardContent>
                  {scanned.length ? (
                    <div className="space-y-3">
                      {scanned.map((candidate) => (
                        <Link key={candidate.id} href={`/talent/${candidate.id}`} className="block text-sm hover:text-slate-900">
                          <span className="font-medium">{displayNameFor(candidate)}</span>
                          <span className="block text-muted-foreground">{candidate.role}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-muted-foreground">
                      Belum ada profil yang dibuka. Pratinjau gratis; buka profil saat Anda membutuhkan konteks lengkap.
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="mt-5">
              <Card>
                <CardHeader>
                  <CardTitle>Shortlist Terbaru</CardTitle>
                </CardHeader>
                <CardContent>
                  {shortlist.length ? (
                    <div className="grid gap-3 md:grid-cols-3">
                      {shortlist.map((candidate) => (
                        <Link key={candidate.id} href={`/talent/${candidate.id}`} className="rounded-xl border p-3 hover:bg-slate-50">
                          <p className="font-medium">{displayNameFor(candidate)}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{candidate.role}</p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-muted-foreground">
                      Belum ada kandidat di shortlist. Simpan pratinjau profil potensial untuk memudahkan proses rekrutmen.
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
