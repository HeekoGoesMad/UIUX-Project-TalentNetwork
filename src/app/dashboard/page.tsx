"use client";

import Link from "next/link";
import { ArrowRight, ScanLine, Search, ShieldCheck, Users, WalletCards } from "lucide-react";
import { candidates } from "@/data/candidates";
import { useApp } from "@/providers/app-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const { tokens, scans, shortlisted, recentlyViewed } = useApp();
  const recent = recentlyViewed
    .map((id) => candidates.find((candidate) => candidate.id === id))
    .filter(Boolean)
    .slice(0, 3);
  const scanned = scans
    .slice()
    .reverse()
    .map((scan) => candidates.find((candidate) => candidate.id === scan.candidateId))
    .filter(Boolean)
    .slice(0, 3);
  const shortlist = candidates
    .filter((candidate) => shortlisted.includes(candidate.id))
    .slice(0, 3);

  return (
    <ProtectedRoute role="recruiter">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-500">
              <ShieldCheck className="size-4" /> Recruiter workspace
            </p>
            <h1 className="mt-3 text-3xl font-bold text-[#1A1A2E]">Selamat datang kembali, Alex.</h1>
            <p className="mt-2 text-muted-foreground">Pick up the thread with the right talent.</p>
          </div>
          <Button asChild>
            <Link href="/search">
              <Search className="size-4" /> Search talent
            </Link>
          </Button>
        </div>

        {tokens <= 5 && (
          <div className="mt-6 flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-amber-950">Token balance hampir habis</p>
              <p className="mt-1 text-amber-900/80">Tersisa {tokens} token untuk unlock profile.</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/pricing">
                Add tokens <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Token balance</p>
              <p className="mt-2 flex items-center gap-2 font-mono text-4xl font-bold">
                <WalletCards className="size-7 text-slate-700" />
                {tokens}
              </p>
              <Link href="/pricing" className="mt-4 inline-flex text-sm font-semibold text-slate-900 hover:underline">
                Get more tokens <ArrowRight className="ml-1 size-4" />
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Profiles unlocked</p>
              <p className="mt-2 text-4xl font-bold">{scans.length}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <ScanLine className="size-3" /> full context unlocked
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Shortlisted</p>
              <p className="mt-2 text-4xl font-bold">{shortlisted.length}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3" /> people to revisit
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Continue where you left off</CardTitle>
            </CardHeader>
            <CardContent>
              {recent.length ? (
                <div className="flex flex-col gap-3">
                  {recent.map(
                    (candidate) =>
                      candidate && (
                        <Link
                          key={candidate.id}
                          href={`/talent/${candidate.id}`}
                          className="flex items-center justify-between rounded-xl border p-3 hover:bg-slate-50"
                        >
                          <span>
                            <span className="font-medium">{candidate.name}</span>
                            <span className="block text-sm text-muted-foreground">
                              {candidate.role} · {candidate.location}
                            </span>
                          </span>
                          <ArrowRight className="size-4 text-muted-foreground" />
                        </Link>
                      )
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="font-medium">Your workspace is ready.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Search the network to find candidates, then come back here to continue.
                  </p>
                  <Button className="mt-4" size="sm" asChild>
                    <Link href="/search">Start searching</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent scans</CardTitle>
            </CardHeader>
            <CardContent>
              {scanned.length ? (
                <div className="space-y-3">
                  {scanned.map(
                    (candidate) =>
                      candidate && (
                        <Link
                          key={candidate.id}
                          href={`/talent/${candidate.id}`}
                          className="block text-sm hover:text-slate-900"
                        >
                          <span className="font-medium">{candidate.name}</span>
                          <span className="block text-muted-foreground">{candidate.role}</span>
                        </Link>
                      )
                  )}
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-muted-foreground">
                  No scans yet. A preview is free; scan only when you need the full context.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Recent shortlist</CardTitle>
            </CardHeader>
            <CardContent>
              {shortlist.length ? (
                <div className="grid gap-3 md:grid-cols-3">
                  {shortlist.map((candidate) => (
                    <Link
                      key={candidate.id}
                      href={`/talent/${candidate.id}`}
                      className="rounded-xl border p-3 hover:bg-slate-50"
                    >
                      <p className="font-medium">{candidate.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{candidate.role}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-muted-foreground">
                  Nothing shortlisted yet. Save a promising preview or unlocked profile to build your working set.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </ProtectedRoute>
  );
}
