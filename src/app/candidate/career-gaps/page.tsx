import { ProtectedRoute } from "@/components/auth/protected-route";
import { CareerAdvisorWorkspace } from "@/components/candidate/career-advisor-workspace";

export default function CareerGapsPage() {
  return (
    <ProtectedRoute role="candidate">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Analisis Kesenjangan Karier (Career Gaps)
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-3xl">
            Identifikasi kesenjangan skill teknis, bukti pencapaian, dan kompetensi yang dapat dialihkan (transferable) terhadap target peran impianmu.
          </p>
        </div>
        <CareerAdvisorWorkspace initialFocus="gap_analysis" />
      </div>
    </ProtectedRoute>
  );
}

