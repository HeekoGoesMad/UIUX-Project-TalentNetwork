"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { settleAdminCheck } from "./admin-denied";

type GatePhase = "checking" | "passed" | "denied";

type AdminGate = {
  phase: GatePhase;
  code: 401 | 403 | null;
  fail: (code: 401 | 403) => void;
};

const AdminGateContext = createContext<AdminGate>({
  phase: "checking",
  code: null,
  fail: () => {},
});

export function useAdminGate() {
  return useContext(AdminGateContext);
}

// Mounted once by src/app/admin/layout.tsx, so the verify ceremony plays a
// single time per portal visit and persists across intra-portal navigation.
// Page-level APIs still enforce 401/403 on every call.
export function AdminGateProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<GatePhase>("checking");
  const [code, setCode] = useState<401 | 403 | null>(null);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    void (async () => {
      await settleAdminCheck(startedAt);
      if (!cancelled) setPhase("passed");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fail = useCallback((nextCode: 401 | 403) => {
    setCode(nextCode);
    setPhase("denied");
  }, []);

  return <AdminGateContext.Provider value={{ phase, code, fail }}>{children}</AdminGateContext.Provider>;
}
