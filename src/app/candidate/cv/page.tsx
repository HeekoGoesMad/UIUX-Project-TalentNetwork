import { ProtectedRoute } from "@/components/auth/protected-route";
import { CvDocumentsPanel } from "@/components/candidate/cv-documents-panel";
import { CvWorkspace } from "@/components/candidate/cv-workspace";

export default function CandidateCvPage() {
  return (
    <ProtectedRoute role="candidate">
      <main className="container mx-auto max-w-[1600px] w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="border-b border-border/60 pb-5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            CV &amp; Profil
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Lengkapi data profil dan unduh CV.
          </p>
        </div>

        {/* Collapsible Uploaded Documents Panel */}
        <CvDocumentsPanel />

        {/* 2-Column Side-by-Side Workspace */}
        <CvWorkspace />
      </main>
    </ProtectedRoute>
  );
}
