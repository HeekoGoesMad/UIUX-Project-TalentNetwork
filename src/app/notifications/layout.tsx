import { SessionError } from "@/components/auth/session-error";
import { requireAppUser } from "@/lib/guards";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const guard = await requireAppUser();
  if (!guard.ok) return <SessionError />;
  return <>{children}</>;
}
