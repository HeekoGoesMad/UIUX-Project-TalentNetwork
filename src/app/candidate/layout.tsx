import { SessionError } from "@/components/auth/session-error";
import { CandidateShell } from "@/components/candidate/candidate-shell";
import { requireRole } from "@/lib/guards";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const guard = await requireRole(["candidate"]);
  if (!guard.ok) return <SessionError />;
  return <CandidateShell>{children}</CandidateShell>;
}

