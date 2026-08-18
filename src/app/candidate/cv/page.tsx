import { ProtectedRoute } from "@/components/auth/protected-route";
import { CvWorkspace } from "@/components/candidate/cv-workspace";
import { CvDocumentsPanel } from "@/components/candidate/cv-documents-panel";
export default function CandidateCvPage() { return <ProtectedRoute role="candidate"><main className="container mx-auto max-w-4xl px-4 py-8"><p className="font-mono text-xs uppercase tracking-widest text-[#7C3AED]">Candidate workspace</p><h1 className="mt-2 text-3xl font-bold text-[#111827]">CV & Profile</h1><p className="mt-2 mb-8 text-muted-foreground">Import PDF sebagai saran editable, kelola dokumen, dan lihat status verifikasi per jenis bukti.</p><div className="mb-6"><CvDocumentsPanel /></div><CvWorkspace /></main></ProtectedRoute>; }
