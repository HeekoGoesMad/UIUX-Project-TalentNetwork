"use client";

import { useSearchParams } from "next/navigation";
import { useApp } from "@/providers/app-provider";

export interface LegalBackNavInfo {
  backHref: string;
  backLabel: string;
  isWorkspace: boolean;
  source: "candidate" | "recruiter" | "partner" | "landing" | "register" | "direct";
  preserveQuery: string;
}

export function useLegalBackNav(): LegalBackNavInfo {
  const searchParams = useSearchParams();
  const { user, hydrated } = useApp();

  const from = searchParams.get("from");
  const role = searchParams.get("role");
  const roleParam = role ? `&role=${role}` : "";

  // Determine effective origin
  if (from === "candidate" || (!from && hydrated && user?.role === "candidate")) {
    return {
      backHref: "/candidate",
      backLabel: "Kembali ke Workspace",
      isWorkspace: true,
      source: "candidate",
      preserveQuery: `?from=candidate${roleParam}`,
    };
  }

  if (from === "recruiter" || (!from && hydrated && user?.role === "recruiter")) {
    return {
      backHref: "/dashboard",
      backLabel: "Kembali ke Workspace Rekruter",
      isWorkspace: true,
      source: "recruiter",
      preserveQuery: `?from=recruiter${roleParam}`,
    };
  }

  if (from === "partner" || (!from && hydrated && user?.role === "partner")) {
    return {
      backHref: "/partner",
      backLabel: "Kembali ke Dashboard Mitra",
      isWorkspace: true,
      source: "partner",
      preserveQuery: "?from=partner",
    };
  }

  if (from === "register") {
    return {
      backHref: "/register",
      backLabel: "Kembali ke Pendaftaran",
      isWorkspace: false,
      source: "register",
      preserveQuery: "?from=register",
    };
  }

  // Default fallback for landing page visitors / unauthenticated users
  return {
    backHref: "/",
    backLabel: "Kembali ke Beranda",
    isWorkspace: false,
    source: from === "landing" ? "landing" : "direct",
    preserveQuery: from ? `?from=${from}` : "",
  };
}
