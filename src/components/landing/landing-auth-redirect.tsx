"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/providers/app-provider";

export function LandingAuthRedirect() {
  const { user, hydrated } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && user) {
      router.replace(user.role === "candidate" ? "/candidate" : "/dashboard");
    }
  }, [hydrated, user, router]);

  return null;
}
