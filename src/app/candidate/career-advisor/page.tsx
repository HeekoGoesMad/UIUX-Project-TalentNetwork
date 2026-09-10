import { ProtectedRoute } from "@/components/auth/protected-route";
import { CareerAdvisorWorkspace } from "@/components/candidate/career-advisor-workspace";
import { Sparkles } from "lucide-react";

export default function Page() {
  return (
    <ProtectedRoute role="candidate">
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#7C3AED]">
          <Sparkles className="size-4 text-[#7C3AED]" /> Workspace Kandidat
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">Penasihat Profil Karier AI</h1>
        <p className="mt-2 mb-8 text-sm leading-relaxed text-muted-foreground max-w-3xl">
          Panduan interaktif &amp; evaluasi cerdas 3 pilar untuk memperkuat profil dan CV kamu agar siap lolos seleksi recruiter serta sistem ATS.
        </p>
        <CareerAdvisorWorkspace />
      </main>
    </ProtectedRoute>
  );
}
