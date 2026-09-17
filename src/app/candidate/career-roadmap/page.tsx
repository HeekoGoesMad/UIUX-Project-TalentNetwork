import { ProtectedRoute } from "@/components/auth/protected-route";
import { CareerAdvisorWorkspace } from "@/components/candidate/career-advisor-workspace";

export default function CareerRoadmapPage() {
  return (
    <ProtectedRoute role="candidate">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Peta Jalan Karier Strategis (Career Roadmap)
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-3xl">
            Rencana tahapan belajar, sertifikasi yang direkomendasikan, dan bukti portofolio konkret untuk mencapai level karier berikutnya.
          </p>
        </div>
        <CareerAdvisorWorkspace initialFocus="career_roadmap" />
      </div>
    </ProtectedRoute>
  );
}

