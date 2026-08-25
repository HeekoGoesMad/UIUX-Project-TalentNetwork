import { requireRole } from "@/lib/guards";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireRole(["candidate"]);
  return <>{children}</>;
}
