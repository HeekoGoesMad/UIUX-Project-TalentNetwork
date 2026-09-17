import { ProtectedRoute } from "@/components/auth/protected-route";
import { CareerAdvisorWorkspace } from "@/components/candidate/career-advisor-workspace";

export default function Page() {
  return (
    <ProtectedRoute role="candidate">
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground">Penasihat Profil Karier</h1>
        <p className="mt-2 mb-8 text-sm leading-relaxed text-muted-foreground max-w-3xl">
          Evaluasi 3 pilar untuk memperkuat profil dan CV agar siap seleksi recruiter dan ATS.
        </p>
        <CareerAdvisorWorkspace />
      </main>
    </ProtectedRoute>
  );
}
