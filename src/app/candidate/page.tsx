"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProfileCompletionCard } from "@/components/candidate/profile-completion-card";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, FileText, MessageCircle, Sparkles, User } from "lucide-react";
import Link from "next/link";

const items = [
  ["/candidate/cv", "CV & Profil", "Lengkapi atau impor CV dan tinjau profil profesional", FileText],
  ["/candidate/career-advisor", "Penasihat Profil Karier AI", "Evaluasi ATS, racik headline, dan poles pencapaian", Sparkles],
  ["/candidate/contact-requests", "Permintaan Kontak", "Kelola izin kontak dan percakapan dengan recruiter", MessageCircle],
] as const;

export default function CandidateHome() {
  return (
    <ProtectedRoute role="candidate">
      <main className="container mx-auto max-w-5xl px-4 py-12">
        <p className="font-mono text-xs uppercase tracking-widest text-[#7C3AED]">Workspace Kandidat</p>
        <h1 className="mt-3 text-4xl font-bold text-[#111827]">Mulai dari cerita kariermu.</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Buat profil yang kamu kontrol, lalu gunakan AI sebagai partner review, bukan pengganti keputusanmu.
        </p>

        <div className="mt-8">
          <ProfileCompletionCard />
        </div>

        {/* Back to Profile button */}
        <div className="mt-8">
          <Link href="/candidate/profile">
            <Card className="card-interactive border-slate-200 bg-slate-50 transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                  <User className="size-5 text-[#7C3AED]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#7C3AED]">Lihat Profil Kamu</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Tinjau tampilan profil seperti yang dilihat recruiter
                  </p>
                </div>
                <span className="inline-flex items-center text-sm font-semibold text-[#7C3AED]">
                  Buka <ArrowRight className="ml-1 size-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map(([href, title, desc, Icon], idx) => {
            const isFullWidth = idx === 2;
            return (
              <Link key={href} href={href} className={isFullWidth ? "sm:col-span-2" : ""}>
                <Card className="card-interactive h-full transition-all hover:border-[#7C3AED]/40 hover:shadow-md">
                  <CardContent className={`p-6 flex ${isFullWidth ? "flex-col sm:flex-row sm:items-center sm:justify-between" : "flex-col justify-between"} h-full gap-4`}>
                    <div className={isFullWidth ? "flex items-start sm:items-center gap-4" : ""}>
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED]">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h2 className={`font-semibold text-[#111827] ${isFullWidth ? "text-lg" : "mt-4 text-lg"}`}>{title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center text-xs font-semibold text-[#7C3AED] shrink-0">
                      Akses <ArrowRight className="ml-1 size-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </ProtectedRoute>
  );
}
