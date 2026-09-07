"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { ADMIN_CHECK_MIN_MS, settleAdminCheck } from "./admin-denied";

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
  const mountedAt = useRef(0);
  const failedRef = useRef(false);
  const failTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    mountedAt.current = startedAt;
    void (async () => {
      await settleAdminCheck(startedAt);
      // Never override a denial recorded by a page-level 401/403.
      if (!cancelled && !failedRef.current) {
        setPhase((current) => (current === "checking" ? "passed" : current));
      }
    })();
    return () => {
      cancelled = true;
      if (failTimer.current !== null) window.clearTimeout(failTimer.current);
    };
  }, []);

  const fail = useCallback((nextCode: 401 | 403) => {
    failedRef.current = true;
    setCode(nextCode);
    // Hold the verifying animation for the full ceremony even when the 401/403
    // arrives early; late failures (e.g. expired session on refresh) deny at once.
    const elapsed = mountedAt.current ? Date.now() - mountedAt.current : 0;
    const wait = ADMIN_CHECK_MIN_MS - elapsed;
    if (wait <= 0) {
      setPhase("denied");
    } else {
      if (failTimer.current !== null) window.clearTimeout(failTimer.current);
      failTimer.current = window.setTimeout(() => setPhase("denied"), wait);
    }
  }, []);

  return <AdminGateContext.Provider value={{ phase, code, fail }}>{children}</AdminGateContext.Provider>;
}
