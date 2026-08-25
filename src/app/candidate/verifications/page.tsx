import { ProtectedRoute } from "@/components/auth/protected-route";
import { VerificationList } from "@/components/candidate/verification-list";

export default function CandidateVerificationsPage() { return <ProtectedRoute role="candidate"><main className="container mx-auto max-w-4xl px-4 py-8"><p className="font-mono text-xs uppercase tracking-widest text-primary">Candidate workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Pemeriksaan kandidat</h1><p className="mb-8 mt-2 text-muted-foreground">Lihat status pemeriksaan berdasarkan jenis bukti. Tidak ada badge generik; setiap status ditampilkan per jenis.</p><VerificationList /></main></ProtectedRoute>; }
