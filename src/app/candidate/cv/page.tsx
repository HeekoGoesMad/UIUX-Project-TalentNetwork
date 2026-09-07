import { ProtectedRoute } from "@/components/auth/protected-route";
import { CvDocumentsPanel } from "@/components/candidate/cv-documents-panel";
import { CvWorkspace } from "@/components/candidate/cv-workspace";

export default function CandidateCvPage() {
  return (
    <ProtectedRoute role="candidate">
      <main className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-[#7C3AED]">
            Workspace Kandidat
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#111827]">
            CV & Profile
          </h1>
          <p className="mt-2 text-muted-foreground">
            Unggah dokumen PDF CV, review saran kurasi AI, dan kelola profil profesional Anda.
          </p>
        </div>

        <CvDocumentsPanel />

        <CvWorkspace />
      </main>
    </ProtectedRoute>
  );
}
