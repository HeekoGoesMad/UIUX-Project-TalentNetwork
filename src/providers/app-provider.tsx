"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AppState } from "@/types";

const storageKey = "talent-network-state-v1";
const initial: AppState = { tokens: 25, scans: [], shortlisted: [], notes: {}, recentlyViewed: [] };
type Context = AppState & {
  scan: (id: string) => boolean;
  toggleShortlist: (id: string) => void;
  saveNote: (id: string, note: string) => void;
  viewed: (id: string) => void;
};
const AppContext = createContext<Context | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return initial;
      const parsed = JSON.parse(saved) as Partial<AppState>;
      return {
        ...initial,
        ...parsed,
        tokens: typeof parsed.tokens === "number" && parsed.tokens >= 0 ? parsed.tokens : initial.tokens,
        scans: Array.isArray(parsed.scans) ? parsed.scans : [],
        shortlisted: Array.isArray(parsed.shortlisted) ? parsed.shortlisted : [],
        notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {},
        recentlyViewed: Array.isArray(parsed.recentlyViewed) ? parsed.recentlyViewed : [],
      };
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const scan = (id: string) => {
    if (state.scans.some((item) => item.candidateId === id)) return true;
    if (state.tokens <= 0) {
      toast.error("You are out of tokens", { description: "Add tokens to scan another profile." });
      return false;
    }
    setState((current) => ({
      ...current,
      tokens: Math.max(0, current.tokens - 1),
      scans: [...current.scans, { candidateId: id, scannedAt: new Date().toISOString() }],
    }));
    toast.success("Profile unlocked", { description: "One token was used." });
    return true;
  };

  const toggleShortlist = (id: string) => setState((current) => {
    const exists = current.shortlisted.includes(id);
    toast.success(exists ? "Removed from shortlist" : "Added to shortlist");
    return { ...current, shortlisted: exists ? current.shortlisted.filter((item) => item !== id) : [...current.shortlisted, id] };
  });

  const saveNote = (id: string, note: string) => setState((current) => ({ ...current, notes: { ...current.notes, [id]: note } }));
  const viewed = (id: string) => setState((current) => ({ ...current, recentlyViewed: [id, ...current.recentlyViewed.filter((item) => item !== id)].slice(0, 5) }));

  return <AppContext.Provider value={{ ...state, scan, toggleShortlist, saveNote, viewed }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
