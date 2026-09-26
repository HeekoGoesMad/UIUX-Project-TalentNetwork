import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CvWorkspace } from "@/components/candidate/cv-workspace";

export default function CandidateCvPage() {
  return (
    <ProtectedRoute role="candidate">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            CV &amp; Profil Studio
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Kelola profil profesional Anda, kurasi riwayat karier, dan unduh dokumen CV berstandar ATS.
          </p>
        </div>

        {/* 2-Column Side-by-Side Workspace */}
        <Suspense fallback={null}>
          <CvWorkspace />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}


