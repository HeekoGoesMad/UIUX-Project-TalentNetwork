"use client";

import { createContext, startTransition, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AppState, CareerStatus, ConsentState, CvProfile, DemoUser, ScreeningResult, UserRole } from "@/types";

const storageKey = "talent-network-state-v1";
const sessionKey = "proofylink-demo-session-v1";
const initial: AppState = { tokens: 25, scans: [], shortlisted: [], notes: {}, recentlyViewed: [], screeningTokens: 1, previewsUsed: 0, screeningConsents: {}, screeningResults: {}, cvProfile: null, careerStatus: "open-to-work" };

type Context = AppState & {
  hydrated: boolean;
  user: DemoUser | null;
  login: (role: UserRole, email?: string) => void;
  logout: () => void;
  scan: (id: string) => boolean;
  toggleShortlist: (id: string) => void;
  saveNote: (id: string, note: string) => void;
  viewed: (id: string) => void;
  saveCvProfile: (profile: CvProfile) => void;
  saveCareerStatus: (status: CareerStatus) => void;
  saveScreeningResult: (candidateId: string, result: ScreeningResult) => void;
  requestConsent: (candidateId: string) => void;
  respondToConsent: (candidateId: string, state: Extract<ConsentState, "consented" | "declined">) => void;
  startScreening: (candidateId: string) => boolean;
  previewCandidate: (candidateId: string) => boolean;
};

const AppContext = createContext<Context | null>(null);

function parseState(value: string | null): AppState {
  if (!value) return initial;
  try {
    const parsed = JSON.parse(value) as Partial<AppState>;
    return {
      ...initial,
      ...parsed,
      tokens: typeof parsed.tokens === "number" && parsed.tokens >= 0 ? parsed.tokens : initial.tokens,
      scans: Array.isArray(parsed.scans) ? parsed.scans : [],
      shortlisted: Array.isArray(parsed.shortlisted) ? parsed.shortlisted : [],
      notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {},
      recentlyViewed: Array.isArray(parsed.recentlyViewed) ? parsed.recentlyViewed : [],
      screeningTokens: typeof parsed.screeningTokens === "number" && parsed.screeningTokens >= 0 ? parsed.screeningTokens : initial.screeningTokens,
      previewsUsed: typeof parsed.previewsUsed === "number" && parsed.previewsUsed >= 0 ? parsed.previewsUsed : initial.previewsUsed,
      screeningConsents: parsed.screeningConsents && typeof parsed.screeningConsents === "object" ? parsed.screeningConsents : {},
      screeningResults: parsed.screeningResults && typeof parsed.screeningResults === "object" ? parsed.screeningResults : {},
      cvProfile: parsed.cvProfile && typeof parsed.cvProfile === "object" ? parsed.cvProfile : null,
      careerStatus: parsed.careerStatus ?? "open-to-work",
    };
  } catch {
    return initial;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initial);
  const [user, setUser] = useState<DemoUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const screeningStarts = useRef(new Set<string>());

  useEffect(() => {
    startTransition(() => {
      setState(parseState(window.localStorage.getItem(storageKey)));
      try {
        const savedUser = window.localStorage.getItem(sessionKey);
        if (savedUser) setUser(JSON.parse(savedUser) as DemoUser);
      } catch {
        window.localStorage.removeItem(sessionKey);
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) return;
    if (user) window.localStorage.setItem(sessionKey, JSON.stringify(user));
    else window.localStorage.removeItem(sessionKey);
  }, [hydrated, user]);

  const login = (role: UserRole, email = "demo@proofylink.id") =>
    setUser({
      role,
      email,
      name:
        role === "candidate"
          ? "Nadia Putri"
          : role === "partner"
          ? "Mitra Kampus / Lembaga"
          : "Alex Morgan",
    });
  const logout = () => setUser(null);

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
  const saveCvProfile = (profile: CvProfile) => { setState((current) => ({ ...current, cvProfile: { ...profile, updatedAt: new Date().toISOString() } })); toast.success("Profile CV tersimpan"); };
  const saveCareerStatus = (status: CareerStatus) => { setState((current) => ({ ...current, careerStatus: status })); toast.success("Status karier diperbarui"); };
  const saveScreeningResult = (candidateId: string, result: ScreeningResult) => setState((current) => ({ ...current, screeningResults: { ...current.screeningResults, [candidateId]: result } }));
  const requestConsent = (candidateId: string) => setState((current) => ({ ...current, screeningConsents: { ...current.screeningConsents, [candidateId]: "pending-candidate-consent" } }));
  const respondToConsent = (candidateId: string, consent: Extract<ConsentState, "consented" | "declined">) => setState((current) => ({ ...current, screeningConsents: { ...current.screeningConsents, [candidateId]: consent } }));
  const startScreening = (candidateId: string) => {
    if (screeningStarts.current.has(candidateId)) return true;
    if (state.screeningConsents[candidateId] === "screening-completed" || state.screeningConsents[candidateId] === "screening-in-progress") return true;
    if (state.screeningConsents[candidateId] !== "consented") { toast.error("Consent kandidat diperlukan"); return false; }
    if (state.screeningTokens <= 0) { toast.error("Screening token habis"); return false; }
    screeningStarts.current.add(candidateId);
    setState((current) => ({ ...current, screeningTokens: current.screeningTokens - 1, screeningConsents: { ...current.screeningConsents, [candidateId]: "screening-completed" } }));
    toast.success("Screening dimulai", { description: "Tepat satu token digunakan." });
    return true;
  };
  const previewCandidate = (candidateId: string) => {
    if (state.scans.some((scan) => scan.candidateId === candidateId)) return true;
    if (state.previewsUsed >= 5) { toast.error("Free preview trial habis", { description: "Screening tetap membutuhkan consent dan token." }); return false; }
    setState((current) => ({ ...current, previewsUsed: current.previewsUsed + 1 }));
    return true;
  };

  return <AppContext.Provider value={{ ...state, hydrated, user, login, logout, scan, toggleShortlist, saveNote, viewed, saveCvProfile, saveCareerStatus, saveScreeningResult, requestConsent, respondToConsent, startScreening, previewCandidate }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
