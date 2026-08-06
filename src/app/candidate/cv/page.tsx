import { ProtectedRoute } from "@/components/auth/protected-route";
import { CvWorkspace } from "@/components/candidate/cv-workspace";
export default function CandidateCvPage() { return <ProtectedRoute role="candidate"><main className="container mx-auto max-w-4xl px-4 py-8"><p className="font-mono text-xs uppercase tracking-widest text-[#08744f]">Candidate workspace</p><h1 className="mt-2 text-3xl font-bold">CV & Profile</h1><p className="mt-2 mb-8 text-muted-foreground">Import PDF, review saran, dan pilih informasi yang siap dibagikan.</p><CvWorkspace /></main></ProtectedRoute>; }
