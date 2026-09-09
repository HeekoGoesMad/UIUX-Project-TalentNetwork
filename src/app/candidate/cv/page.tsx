import { ProtectedRoute } from "@/components/auth/protected-route";
import { CvDocumentsPanel } from "@/components/candidate/cv-documents-panel";
import { CvWorkspace } from "@/components/candidate/cv-workspace";

export default function CandidateCvPage() {
  return (
    <ProtectedRoute role="candidate">
      <main className="container mx-auto max-w-[1600px] w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#7C3AED] border border-purple-200">
                Workspace Kandidat
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                CV Builder &amp; Profil Live
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              CV &amp; Profil Profesional
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Lengkapi data profil Anda, pratinjau tampilan dokumen secara instan (real-time), dan unduh CV dengan format standar ATS atau desain modern.
            </p>
          </div>
        </div>

        {/* Collapsible Uploaded Documents Panel */}
        <CvDocumentsPanel />

        {/* 2-Column Side-by-Side Workspace */}
        <CvWorkspace />
      </main>
    </ProtectedRoute>
  );
}
