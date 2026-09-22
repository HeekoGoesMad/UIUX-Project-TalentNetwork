import { ProtectedRoute } from "@/components/auth/protected-route";
import { CareerAdvisorWorkspace } from "@/components/candidate/career-advisor-workspace";

export default function CareerAdvisorPage() {
  return (
    <ProtectedRoute role="candidate">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            AI Career Hub
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Evaluasi profil profesional Anda untuk menemukan area yang dapat ditingkatkan agar lebih menarik bagi recruiter dan sistem ATS.
          </p>
        </div>
        <CareerAdvisorWorkspace initialFocus="cv_review" />
      </div>
    </ProtectedRoute>
  );
}
