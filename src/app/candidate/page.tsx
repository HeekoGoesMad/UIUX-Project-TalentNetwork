import Link from "next/link";
import { ArrowRight, FileText, Map, MessageCircle, Sparkles, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/protected-route";

const items = [
  ["/candidate/cv", "CV & Profil", "Impor PDF dan tinjau profil", FileText],
  ["/candidate/career-advisor", "Career Advisor", "Saran cerdas berbasis profil", Sparkles],
  ["/candidate/career-roadmap", "Career Roadmap", "Langkah terarah yang bisa kamu sesuaikan", Map],
  ["/candidate/contact-requests", "Permintaan Kontak", "Kelola percakapan dengan recruiter", MessageCircle],
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

        {/* Back to Profile button */}
        <div className="mt-8">
          <Link href="/profile">
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

        {/* Workspace menu items */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {items.map(([href, title, text, Icon]) => (
            <Link key={href} href={href}>
              <Card className="card-interactive h-full">
                <CardContent className="p-5">
                  <Icon className="size-5 text-[#7C3AED]" />
                  <h2 className="mt-5 font-semibold text-[#111827]">{title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{text}</p>
                  <span className="mt-5 inline-flex items-center text-sm font-semibold text-[#7C3AED]">
                    Buka <ArrowRight className="ml-1 size-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </ProtectedRoute>
  );
}
