import { ProtectedRoute } from "@/components/auth/protected-route";
import { CvDocumentsPanel } from "@/components/candidate/cv-documents-panel";
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
            Kelola profil profesional kamu, kurasi riwayat karir, dan unduh dokumen CV berstandar ATS.
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


