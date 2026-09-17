import { ProtectedRoute } from "@/components/auth/protected-route";
import { CvDocumentsPanel } from "@/components/candidate/cv-documents-panel";
import { CvWorkspace } from "@/components/candidate/cv-workspace";


export default function CandidateCvPage() {
  return (
    <ProtectedRoute role="candidate">
      <div className="space-y-6">
        <div className="border-b border-border/60 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            CV Studio &amp; Profil ATS
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Lengkapi riwayat profesional, sinkronkan rekomendasi AI, dan unduh CV berstandar ATS berakurasi tinggi.
          </p>
        </div>

        {/* Collapsible Uploaded Documents Panel */}
        <CvDocumentsPanel />

        {/* 2-Column Side-by-Side Workspace */}
        <CvWorkspace />
      </div>
    </ProtectedRoute>
  );
}

