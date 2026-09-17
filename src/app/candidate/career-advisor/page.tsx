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
            Evaluasi CV menyeluruh, analisis kesenjangan skill terhadap target posisi, dan rancang konsultasi langkah karir strategis berbasis AI. Hasil bersifat draf rekomendasi untuk ditinjau.
          </p>
        </div>
        <CareerAdvisorWorkspace initialFocus="cv_review" />
      </div>
    </ProtectedRoute>
  );
}
