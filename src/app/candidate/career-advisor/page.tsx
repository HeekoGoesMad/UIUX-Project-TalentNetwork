import { ProtectedRoute } from "@/components/auth/protected-route";
import { CareerAdvisorWorkspace } from "@/components/candidate/career-advisor-workspace";
import { CandidateAiNav } from "@/components/candidate/candidate-ai-nav";
import { Sparkles } from "lucide-react";

export default function Page() {
  return (
    <ProtectedRoute role="candidate">
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#08744f]">
          <Sparkles className="size-4" />Workspace Kandidat
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#0f2040]">Career Profile Advisor</h1>
        <p className="mt-2 mb-6 text-muted-foreground">
          Panduan interaktif & evaluasi 5 pilar untuk membangun serta memperkuat profil kariermu sesuai standar HR & ATS.
        </p>
        <CandidateAiNav />
        <CareerAdvisorWorkspace />
      </main>
    </ProtectedRoute>
  );
}
