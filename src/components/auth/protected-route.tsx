"use client";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/providers/app-provider";
import { UserRole } from "@/types";
export function ProtectedRoute({ children, role }: { children: ReactNode; role: UserRole }) {
  const { hydrated, bootstrapped, dbMode, user, cvProfile } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated || (dbMode && !bootstrapped)) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (user.role === "recruiter" && user.provisioningStatus !== "active") {
      // Allow recruiter to access onboarding to fill company data, or stay at pending page
      if (pathname !== "/recruiter/pending" && pathname !== "/recruiter/onboarding") {
        router.replace("/recruiter/pending");
      }
      return;
    }
    if (user.role === "candidate" && (!cvProfile || !cvProfile.fullName?.trim())) {
      // Require candidate to complete minimum onboarding profile before accessing workspace
      if (pathname !== "/candidate/onboarding") {
        router.replace("/candidate/onboarding");
      }
      return;
    }
    if (user.role !== role) {
      const target = user.role === "candidate" ? "/candidate" : user.role === "partner" ? "/partner" : "/dashboard";
      if (pathname !== target) {
        router.replace(target);
      }
    }
  }, [hydrated, bootstrapped, dbMode, user, cvProfile, role, router, pathname]);

  if (
    !hydrated ||
    (dbMode && !bootstrapped) ||
    !user ||
    user.role !== role ||
    (role === "recruiter" && user.provisioningStatus !== "active" && pathname !== "/recruiter/onboarding") ||
    (role === "candidate" && (!cvProfile || !cvProfile.fullName?.trim()) && pathname !== "/candidate/onboarding")
  ) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto size-8 animate-pulse rounded-full bg-[#d7f5e8]" />
        <p className="mt-4 text-sm text-muted-foreground">Menyiapkan workspace...</p>
      </div>
    );
  }

  return <>{children}</>;
}
