"use client";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/providers/app-provider";
import { UserRole } from "@/types";
export function ProtectedRoute({ children, role }: { children: ReactNode; role: UserRole }) {
  const { hydrated, user } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!hydrated) return;
    if (user && user.role === "recruiter" && role === "recruiter" && user.provisioningStatus !== "active") router.replace("/recruiter/pending");
    else if (user && user.role !== role) router.replace(user.role === "candidate" ? "/candidate/onboarding" : "/dashboard");
    else if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, user, role, router, pathname]);
  if (!hydrated || !user || user.role !== role || (role === "recruiter" && user.provisioningStatus !== "active")) return <div className="mx-auto max-w-md px-4 py-24 text-center"><div className="mx-auto size-8 animate-pulse rounded-full bg-[#d7f5e8]" /><p className="mt-4 text-sm text-muted-foreground">Menyiapkan workspace...</p></div>;
  return <>{children}</>;
}
