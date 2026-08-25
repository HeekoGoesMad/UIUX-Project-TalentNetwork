import { SessionError } from "@/components/auth/session-error";
import { requireRole } from "@/lib/guards";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const guard = await requireRole(["candidate"]);
  if (!guard.ok) return <SessionError />;
  return <>{children}</>;
}
