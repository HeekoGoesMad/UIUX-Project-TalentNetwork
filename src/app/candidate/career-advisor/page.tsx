import { ProtectedRoute } from "@/components/auth/protected-route";
import { CareerAdvisorWorkspace } from "@/components/candidate/career-advisor-workspace";

export default function CareerAdvisorPage() {
  return (
    <ProtectedRoute role="candidate">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            AI Career Advisor &amp; Evaluasi Profil
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-3xl">
            Optimalkan profil dan CV kamu dengan analisis 3 pilar: Review CV ATS, Analisis Kesenjangan Skill (Gap Analysis), dan Roadmap Karier Berkelanjutan.
          </p>
        </div>
        <CareerAdvisorWorkspace initialFocus="cv_review" />
      </div>
    </ProtectedRoute>
  );
}
