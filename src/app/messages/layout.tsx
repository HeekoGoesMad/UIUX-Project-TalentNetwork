import { requireAppUser } from "@/lib/guards";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireAppUser();
  return <>{children}</>;
}
