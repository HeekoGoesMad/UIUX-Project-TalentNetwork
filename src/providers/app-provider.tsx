"use client";

import { createContext, startTransition, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AppState, CareerStatus, ConsentState, ContactRequest, CvProfile, DemoUser, ProvisioningStatus, ScreeningResult, UserRole, asCareerStatus, CONSENT_STATE_BY_DB_STATUS } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { UUID_RE } from "@/lib/utils";
import { DEMO_CANDIDATE_USER, DEMO_CANDIDATE_CV } from "@/lib/demo-seed";

const storageKey = "talent-network-state-v1";
const sessionKey = "proofylink-demo-session-v1";
const initial: AppState = { tokens: 25, scans: [], shortlisted: [], notes: {}, recentlyViewed: [], screeningTokens: 1, previewsUsed: 0, screeningConsents: {}, screeningResults: {}, contactRequests: {}, cvProfile: null, careerStatus: "open-to-work" };
const demoNotifications: BootstrapNotification[] = [
  { id: "demo-notification-1", type: "system", title: "Selamat datang di ProofyLink", body: "Lengkapi profil Anda untuk membuka lebih banyak peluang di jaringan talent.", data: {}, readAt: null, createdAt: "2026-08-14T08:00:00Z" },
  { id: "demo-notification-2", type: "message_received", title: "Pesan baru tersedia", body: "Anda memiliki percakapan demo yang siap ditinjau.", data: {}, readAt: "2026-08-13T08:00:00Z", createdAt: "2026-08-13T08:00:00Z" },
];
export type RemoteShortlistItem = { id: string; candidateProfileId: string; status: string; notes: string | null; candidate?: { name: string | null; role: string | null; location: string | null } };
export type RemoteConsentRequest = { itemId: string; candidateProfileId: string; consentState: ConsentState; recruiterName: string | null; recruiterEmail: string | null; organizationName: string | null; purpose: string; createdAt: string; respondedAt: string | null; history: { type: string; createdAt: string }[] };

type Context = AppState & {
  hydrated: boolean;
  dbMode: boolean;
  devBypass: boolean;
  bootstrapped: boolean;
  user: DemoUser | null;
  profile: BootstrapProfile | null;
  tokenAccount: BootstrapTokenAccount;
  notifications: BootstrapNotification[];
  shortlists: BootstrapShortlist[];
  consentRequests: Record<string, unknown>[];
  databaseError: string | null;
  configError?: boolean;
  markNotificationRead: (id: string) => Promise<boolean>;
  markAllNotificationsRead: () => Promise<boolean>;
  login: (role: UserRole, email: string, password: string) => Promise<AuthResult>;
  loginAsDemoCandidate: () => void;
  register: (name: string, role: UserRole, email: string, password: string, companyName?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  scan: (id: string) => boolean;
  toggleShortlist: (id: string) => void;
  saveNote: (id: string, note: string) => void;
  viewed: (id: string) => void;
  saveCvProfile: (profile: CvProfile) => Promise<void>;
  saveCareerStatus: (status: CareerStatus) => Promise<void>;
  saveScreeningResult: (candidateId: string, result: ScreeningResult) => void;
  requestConsent: (candidateId: string) => Promise<boolean>;
  requestConsentBatch: (candidateIds: string[]) => Promise<boolean>;
  respondToConsent: (candidateId: string, state: Extract<ConsentState, "consented" | "declined">) => Promise<boolean>;
  approvePendingRequests: () => Promise<boolean>;
  startScreening: (candidateId: string) => Promise<boolean>;
  previewCandidate: (candidateId: string) => boolean;
};

type AuthResult = { error?: string; needsConfirmation?: boolean; role?: UserRole; provisioningStatus?: ProvisioningStatus };

type BootstrapProfile = {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

type BootstrapTokenAccount = { accountId: string | null; balance: number; updatedAt: string | null };
type BootstrapNotification = { id: string; type: string; title: string; body: string | null; data: Record<string, unknown>; readAt: string | null; createdAt: string };
type BootstrapShortlist = { id: string; name: string; description: string | null; createdAt: string; updatedAt: string; items: Array<{ id: string; candidateProfileId: string; status: string; notes: string | null; createdAt: string; candidate?: { name: string | null; role: string | null; location: string | null } }> };
type BootstrapSection = { type: string; content: Record<string, unknown> };

function remoteCvProfile(payload: { identity?: { email?: string }; profile?: BootstrapProfile | null; candidateProfile?: { id: string; headline: string | null; targetRole: string | null; location: string | null; summary: string | null; updatedAt?: string } | null; candidateSections?: BootstrapSection[] }): CvProfile | null {
  const candidate = payload.candidateProfile;
  const base = payload.profile;
  if (!candidate && !base) return null;
  const section = (type: string) => payload.candidateSections?.find((item) => item.type === type)?.content ?? {};
  const items = <T,>(type: string): T[] => {
    const value = section(type).items;
    return Array.isArray(value) ? value as T[] : [];
  };
  const preferences = section("preferences");
  const status = asCareerStatus(preferences.careerStatus);
  return {
    id: candidate?.id ?? base?.id ?? "remote-profile",
    fullName: base?.displayName ?? "",
    headline: candidate?.headline ?? "",
    about: candidate?.summary ?? "",
    location: candidate?.location ?? "",
    email: payload.identity?.email ?? "",
    phone: base?.phone ?? "",
    skills: items<string>("skills"),
    tools: items<string>("tools"),
    industries: [],
    experience: items<CvProfile["experience"][number]>("experience"),
    education: items<CvProfile["education"][number]>("education"),
    certifications: [],
    portfolio: items<string>("portfolio"),
    targetRole: candidate?.targetRole ?? "",
    workArrangement: preferences.workArrangement === "remote" || preferences.workArrangement === "onsite" ? preferences.workArrangement : "hybrid",
    openToWork: status !== "not-available",
    careerStatus: status,
    updatedAt: candidate?.updatedAt ?? base?.updatedAt ?? new Date().toISOString(),
  };
}

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
      contactRequests: parsed.contactRequests && typeof parsed.contactRequests === "object" ? parsed.contactRequests : {},
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
  const [bootstrapped, setBootstrapped] = useState(false);
  const [profile, setProfile] = useState<BootstrapProfile | null>(null);
  const [tokenAccount, setTokenAccount] = useState<BootstrapTokenAccount>({ accountId: null, balance: 0, updatedAt: null });
  const [notifications, setNotifications] = useState<BootstrapNotification[]>([]);
  const [shortlists, setShortlists] = useState<BootstrapShortlist[]>([]);
  const [consentRequests, setConsentRequests] = useState<Record<string, unknown>[]>([]);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const screeningStarts = useRef(new Set<string>());
  const screeningRunIds = useRef(new Map<string, string>());
  const pendingRole = useRef<UserRole | null>(null);
  const devBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && !devBypass;
  const configError = process.env.NODE_ENV === "production" && !supabaseConfigured;

  const setSupabaseUser = (authUser: { email?: string; user_metadata?: Record<string, unknown> } | null) => {
    if (!authUser) {
      setUser(null);
      return;
    }
    const metadata = authUser.user_metadata ?? {};
    const role = metadata.role === "candidate" || metadata.role === "recruiter" ? metadata.role : pendingRole.current;
    if (!role) {
      setUser(null);
      return;
    }
    const provisioningStatus: ProvisioningStatus = role === "candidate" ? "active" : metadata.provisioningStatus === "active" || metadata.provisioningStatus === "rejected" ? metadata.provisioningStatus : "pending";
    setUser({
      role,
      provisioningStatus,
      email: authUser.email ?? "",
      name: typeof metadata.name === "string" && metadata.name.trim() ? metadata.name : authUser.email ?? "Pengguna",
      companyName: typeof metadata.companyName === "string" && metadata.companyName.trim() ? metadata.companyName : undefined,
    });
  };

  const loadBootstrap = async () => {
    setBootstrapped(false);
    setDatabaseError(null);
    try {
      const response = await fetch("/api/app/bootstrap", { cache: "no-store" });
      const payload = await response.json() as {
         identity?: { role?: UserRole; email?: string; provisioningStatus?: ProvisioningStatus };
         profile?: BootstrapProfile | null;
         candidateProfile?: { id: string; headline: string | null; targetRole: string | null; location: string | null; summary: string | null; updatedAt?: string } | null;
         candidateSections?: BootstrapSection[];
        token?: BootstrapTokenAccount;
        notifications?: BootstrapNotification[];
        shortlists?: BootstrapShortlist[];
        consentRequests?: Record<string, unknown>[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Gagal memuat data aplikasi.");

      if (payload.identity?.provisioningStatus) {
        setUser((current) => current?.role === "recruiter" ? { ...current, provisioningStatus: payload.identity!.provisioningStatus! } : current);
      }

      const consentResponse = await fetch("/api/consent-requests", { cache: "no-store" });
      const consentPayload = await consentResponse.json() as { requests?: Record<string, unknown>[]; error?: string };
      if (!consentResponse.ok) throw new Error(consentPayload.error || "Gagal memuat permintaan consent.");

      setProfile(payload.profile ?? null);
      setTokenAccount(payload.token ?? { accountId: null, balance: 0, updatedAt: null });
       setNotifications(payload.notifications ?? []);
      setShortlists(payload.shortlists ?? []);
       setConsentRequests(consentPayload.requests ?? payload.consentRequests ?? []);
       const remoteProfile = remoteCvProfile(payload);
       setState((current) => ({
         ...current,
         cvProfile: remoteProfile,
         careerStatus: remoteProfile?.careerStatus ?? current.careerStatus,
        tokens: payload.token?.balance ?? 0,
        shortlisted: (payload.shortlists ?? []).flatMap((shortlist) => shortlist.items.filter((item) => item.status === "active").map((item) => item.candidateProfileId)),
         screeningConsents: Object.fromEntries((consentPayload.requests ?? payload.consentRequests ?? []).flatMap((request) => {
          const candidateId = typeof request.candidateProfileId === "string" ? request.candidateProfileId : null;
          const status = request.status;
          if (!candidateId || typeof status !== "string") return [];
          const consent = CONSENT_STATE_BY_DB_STATUS[status];
          return consent ? [[candidateId, consent]] : [];
        })),
      }));
      setBootstrapped(true);
    } catch (error) {
      setState({ ...initial, tokens: 0 });
      setProfile(null);
      setTokenAccount({ accountId: null, balance: 0, updatedAt: null });
       setNotifications([]);
      setShortlists([]);
      setConsentRequests([]);
      setDatabaseError(error instanceof Error ? error.message : "Data database tidak dapat dimuat.");
      toast.error("Gagal menyiapkan workspace", { description: error instanceof Error ? error.message : "Data database tidak dapat dimuat." });
    }
  };

  useEffect(() => {
    let active = true;
    if (supabaseConfigured) {
      const supabase = createClient();
      void supabase.auth.getUser().then(({ data }) => {
        if (active) {
          setSupabaseUser(data.user);
          if (data.user) void loadBootstrap();
          else setBootstrapped(true);
          setHydrated(true);
        }
      });
      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
        if (active) {
          setSupabaseUser(session?.user ?? null);
          if (session?.user) void loadBootstrap();
          else setBootstrapped(true);
        }
      });
      return () => {
        active = false;
        subscription.subscription.unsubscribe();
      };
    }

    startTransition(() => {
      setState(parseState(window.localStorage.getItem(storageKey)));
      try {
        const savedUser = window.localStorage.getItem(sessionKey);
        if (savedUser) setUser(JSON.parse(savedUser) as DemoUser);
      } catch {
        window.localStorage.removeItem(sessionKey);
      }
      setHydrated(true);
      setBootstrapped(true);
    });
    return () => { active = false; };
  }, [supabaseConfigured]);

  useEffect(() => {
    if (!hydrated) return;
    if (!supabaseConfigured) window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [hydrated, state, supabaseConfigured]);

  useEffect(() => {
    if (!hydrated) return;
    if (!supabaseConfigured) {
      if (user) window.localStorage.setItem(sessionKey, JSON.stringify(user));
      else window.localStorage.removeItem(sessionKey);
    }
  }, [hydrated, user, supabaseConfigured]);

  const markNotificationRead = async (id: string) => {
    if (!supabaseConfigured) {
      setNotifications((current) => (current.length ? current : demoNotifications).map((notification) => notification.id === id ? { ...notification, readAt: new Date().toISOString() } : notification));
      return true;
    }
    const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) });
    if (!response.ok) return false;
    setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, readAt: new Date().toISOString() } : notification));
    return true;
  };

  const markAllNotificationsRead = async () => {
    if (!supabaseConfigured) {
      setNotifications((current) => (current.length ? current : demoNotifications).map((notification) => ({ ...notification, readAt: notification.readAt ?? new Date().toISOString() })));
      return true;
    }
    const response = await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    if (!response.ok) return false;
    setNotifications((current) => current.map((notification) => ({ ...notification, readAt: notification.readAt ?? new Date().toISOString() })));
    return true;
  };

  const login = async (role: UserRole, email: string, password?: string): Promise<AuthResult> => {
    if (!supabaseConfigured) {
      const isDemoCandidate = role === "candidate";
      const defaultName = isDemoCandidate ? DEMO_CANDIDATE_USER.name : role === "partner" ? "Mitra Kampus / Lembaga" : "Alex Morgan";
      setUser({ role, provisioningStatus: "active", email: email || (isDemoCandidate ? DEMO_CANDIDATE_USER.email : "demo@proofylink.id"), name: email && email !== DEMO_CANDIDATE_USER.email ? email.split("@")[0] : defaultName });
      if (isDemoCandidate && (!state.cvProfile || state.cvProfile.fullName === "")) {
        setState((current) => ({ ...current, cvProfile: DEMO_CANDIDATE_CV, careerStatus: "open-to-work" }));
      }
      return { role, provisioningStatus: "active" };
    }
    pendingRole.current = role;
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: password || "" });
    if (error) return { error: error.message };
    const metadataRole = data.user?.user_metadata?.role;
    const actualRole = metadataRole === "candidate" || metadataRole === "recruiter" || metadataRole === "partner" ? metadataRole : undefined;
    return { role: actualRole };
  };

  const loginAsDemoCandidate = () => {
    setUser(DEMO_CANDIDATE_USER);
    setState((current) => ({
      ...current,
      cvProfile: DEMO_CANDIDATE_CV,
      careerStatus: "open-to-work",
    }));
    toast.success("Masuk sebagai Kandidat Demo (Nadia)", {
      description: "Profil lengkap dengan riwayat Tokopedia & OVO berhasil dimuat.",
    });
  };

  const register = async (name: string, role: UserRole, email: string, password: string, companyName = ""): Promise<AuthResult> => {
    if (!supabaseConfigured) {
      const provisioningStatus: ProvisioningStatus = role === "candidate" || role === "partner" || devBypass ? "active" : "pending";
      setUser({ role, provisioningStatus, email, name, companyName: companyName || undefined });
      return { role, provisioningStatus };
    }
    pendingRole.current = role;
    const supabase = createClient();
    const provisioningStatus: ProvisioningStatus = role === "candidate" ? "active" : "pending";
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(role === "candidate" ? "/candidate/onboarding" : "/recruiter/pending")}`;
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo, data: { name, role, companyName, provisioningStatus } } });
    if (error) return { error: error.message };
    if (data.session) setSupabaseUser(data.user);
    return { needsConfirmation: !data.session, role, provisioningStatus };
  };

  const logout = async () => {
    if (supabaseConfigured) {
      const { error } = await createClient().auth.signOut();
      if (error) toast.error("Gagal keluar", { description: error.message });
    }
    setUser(null);
  };

  const scan = (id: string) => {
    if (state.scans.some((item) => item.candidateId === id)) return true;
    if (devBypass) {
      setState((current) => ({ ...current, scans: [...current.scans, { candidateId: id, scannedAt: new Date().toISOString() }] }));
      toast.success("Profil talent dibuka", { description: "Mode development: token scan tidak digunakan." });
      return true;
    }
    if (state.tokens <= 0) {
      toast.error("Token Anda habis", { description: "Tambah token untuk membuka profil lainnya." });
      return false;
    }
    setState((current) => ({
      ...current,
      tokens: Math.max(0, current.tokens - 1),
      scans: [...current.scans, { candidateId: id, scannedAt: new Date().toISOString() }],
    }));
    toast.success("Profil berhasil dibuka", { description: "1 token telah digunakan." });
    return true;
  };

  const toggleShortlist = (id: string) => {
    if (supabaseConfigured && UUID_RE.test(id)) {
      const existing = shortlists.flatMap((shortlist) => shortlist.items).find((item) => item.candidateProfileId === id);
      void fetch("/api/shortlists", { method: existing ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(existing ? { itemId: existing.id } : { candidateProfileId: id }) }).then(async (response) => {
        if (!response.ok) throw new Error(((await response.json()) as { error?: string }).error ?? "Shortlist gagal diperbarui.");
        await loadBootstrap();
        toast.success(existing ? "Dihapus dari shortlist" : "Ditambahkan ke shortlist");
      }).catch((error: unknown) => toast.error("Shortlist gagal diperbarui", { description: error instanceof Error ? error.message : "Coba lagi." }));
      return;
    }
    const exists = state.shortlisted.includes(id);
    setState((current) => ({ ...current, shortlisted: exists ? current.shortlisted.filter((item) => item !== id) : [...current.shortlisted, id] }));
    toast.success(exists ? "Dihapus dari shortlist" : "Ditambahkan ke shortlist");
  };

  const saveNote = (id: string, note: string) => {
    const item = shortlists.flatMap((shortlist) => shortlist.items).find((candidate) => candidate.candidateProfileId === id);
    if (supabaseConfigured && item) {
      void fetch("/api/shortlists", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: item.id, notes: note }) }).then((response) => { if (!response.ok) throw new Error(); }).catch(() => toast.error("Catatan shortlist gagal disimpan."));
      return;
    }
    setState((current) => ({ ...current, notes: { ...current.notes, [id]: note } }));
  };
  const viewed = (id: string) => setState((current) => ({ ...current, recentlyViewed: [id, ...current.recentlyViewed.filter((item) => item !== id)].slice(0, 5) }));
  const syncProfile = async (profile: CvProfile) => {
    const response = await fetch("/api/profile/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: profile.fullName || null, phone: profile.phone || null,
        headline: profile.headline || null, targetRole: profile.targetRole || null,
        location: profile.location || null, summary: profile.about || null,
        isPublished: true,
        completeness: Math.min(100, [profile.fullName, profile.headline, profile.about, profile.location, profile.targetRole, profile.skills.length, profile.tools.length, profile.experience.length, profile.education.length].filter(Boolean).length * 10),
        sections: [
          { type: "experience", content: { items: profile.experience } },
          { type: "education", content: { items: profile.education } },
          { type: "skills", content: { items: profile.skills } },
          { type: "tools", content: { items: profile.tools } },
          { type: "portfolio", content: { items: profile.portfolio } },
          { type: "preferences", content: { careerStatus: profile.careerStatus, workArrangement: profile.workArrangement } },
        ],
      }),
    });
    if (!response.ok) throw new Error(((await response.json()) as { error?: string }).error ?? "Profil belum dapat disinkronkan.");
  };
  const saveCvProfile = async (profile: CvProfile) => {
    const saved = { ...profile, updatedAt: new Date().toISOString() };
    setState((current) => ({ ...current, cvProfile: saved, careerStatus: saved.careerStatus }));
    if (supabaseConfigured) {
      try { await syncProfile(saved); } catch (error) { toast.error("Profil tersimpan sementara", { description: error instanceof Error ? error.message : "Database belum diperbarui." }); return; }
    }
    toast.success("Profil CV tersimpan");
  };
  const saveCareerStatus = async (status: CareerStatus) => {
    setState((current) => ({ ...current, careerStatus: status, cvProfile: current.cvProfile ? { ...current.cvProfile, careerStatus: status, openToWork: status !== "not-available" } : null }));
    if (supabaseConfigured) {
      const currentProfile = state.cvProfile ?? remoteCvProfile({ identity: { email: user?.email }, profile, candidateProfile: null });
      if (currentProfile) {
        try { await syncProfile({ ...currentProfile, careerStatus: status, openToWork: status !== "not-available" }); } catch (error) { toast.error("Status tersimpan sementara", { description: error instanceof Error ? error.message : "Database belum diperbarui." }); return; }
      }
    }
    toast.success("Status karier diperbarui");
  };
  const saveScreeningResult = (candidateId: string, result: ScreeningResult) => setState((current) => ({ ...current, screeningResults: { ...current.screeningResults, [candidateId]: result } }));
  const requestConsentBatch = async (candidateIds: string[]) => {
    const uniqueIds = [...new Set(candidateIds)];
    if (!uniqueIds.length) return false;
    if (supabaseConfigured && uniqueIds.every((candidateId) => UUID_RE.test(candidateId))) {
      const response = await fetch("/api/consent-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ candidateProfileIds: uniqueIds, purpose: "Screening kandidat" }) });
      if (!response.ok) { toast.error("Permintaan consent gagal dikirim", { description: ((await response.json()) as { error?: string }).error ?? "Coba lagi." }); return false; }
      await loadBootstrap();
      toast.success(`Permintaan consent dikirim ke ${uniqueIds.length} kandidat`);
      return true;
    }
    uniqueIds.forEach((id) => setState((current) => {
      const now = new Date().toISOString();
      const existing = (current.contactRequests ?? {})[id];
      const request: ContactRequest = existing ?? { candidateId: id, recruiterName: user?.name, company: user?.companyName || "Perusahaan recruiter", email: user?.email, requestedAt: now, history: [] };
      return { ...current, screeningConsents: { ...current.screeningConsents, [id]: "pending-candidate-consent" }, contactRequests: { ...(current.contactRequests ?? {}), [id]: { ...request, history: [...(request.history ?? []), { state: "pending-candidate-consent", at: now }] } } };
    }));
    return true;
  };

  const requestConsent = async (candidateId: string) => {
    if (supabaseConfigured && UUID_RE.test(candidateId)) {
      return requestConsentBatch([candidateId]);
    }
    setState((current) => {
    const now = new Date().toISOString();
    const existing = (current.contactRequests ?? {})[candidateId];
    const request: ContactRequest = existing ?? {
      candidateId,
      recruiterName: user?.name,
      company: user?.companyName || "Perusahaan recruiter",
      email: user?.email,
      requestedAt: now,
      history: [],
    };
    return {
      ...current,
      screeningConsents: { ...current.screeningConsents, [candidateId]: "pending-candidate-consent" },
      contactRequests: { ...(current.contactRequests ?? {}), [candidateId]: { ...request, history: [...(request.history ?? []), { state: "pending-candidate-consent", at: now }] } },
    };
    });
    return true;
  };
  const respondToConsent = async (candidateId: string, consent: Extract<ConsentState, "consented" | "declined">) => {
    const request = consentRequests.find((item) => item.candidateProfileId === candidateId);
    if (supabaseConfigured && request && typeof request.itemId === "string") {
      const response = await fetch(`/api/consent-requests/${request.itemId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision: consent === "consented" ? "approved" : "declined" }) });
      if (!response.ok) { toast.error("Respons consent gagal disimpan", { description: ((await response.json()) as { error?: string }).error ?? "Coba lagi." }); return false; }
      await loadBootstrap();
      return true;
    }
    setState((current) => {
    const now = new Date().toISOString();
    const request = (current.contactRequests ?? {})[candidateId];
    return {
      ...current,
      screeningConsents: { ...current.screeningConsents, [candidateId]: consent },
      contactRequests: request ? { ...(current.contactRequests ?? {}), [candidateId]: { ...request, history: [...(request.history ?? []), { state: consent, at: now }] } } : (current.contactRequests ?? {}),
    };
    });
    return true;
  };
  const approvePendingRequests = async () => {
    if (supabaseConfigured) {
      const pending = consentRequests.filter((item) => item.status === "pending" && typeof item.candidateProfileId === "string");
      const results = await Promise.all(pending.map((item) => respondToConsent(item.candidateProfileId as string, "consented")));
      return results.every(Boolean);
    }
    setState((current) => {
    const now = new Date().toISOString();
    const pendingIds = Object.entries(current.screeningConsents).filter(([, consent]) => consent === "pending-candidate-consent").map(([candidateId]) => candidateId);
    if (!pendingIds.length) return current;
    const contactRequests = { ...current.contactRequests };
    pendingIds.forEach((candidateId) => {
      const request = contactRequests[candidateId];
      if (request) contactRequests[candidateId] = { ...request, history: [...(request.history ?? []), { state: "consented", at: now }] };
    });
    toast.success(`${pendingIds.length} permintaan disetujui`);
    return { ...current, screeningConsents: { ...current.screeningConsents, ...Object.fromEntries(pendingIds.map((id) => [id, "consented"])) }, contactRequests };
    });
    return true;
  };
  const startScreening = async (candidateId: string) => {
    if (supabaseConfigured && UUID_RE.test(candidateId)) {
      try {
        const consentResponse = await fetch("/api/consent-requests");
        const consentData = (await consentResponse.json()) as { requests?: { itemId: string; candidateProfileId: string; consentState?: ConsentState }[] };
        const consent = consentData.requests?.find((item) => item.candidateProfileId === candidateId && item.consentState === "consented");
        if (!consent) {
          toast.error("Consent kandidat diperlukan", { description: "Consent belum disetujui atau sudah kedaluwarsa." });
          return false;
        }
        const response = await fetch("/api/screening-runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateProfileId: candidateId, consentRequestItemId: consent.itemId, idempotencyKey: `screening:${user?.email ?? "recruiter"}:${candidateId}` }),
        });
        const data = (await response.json()) as { runId?: string; error?: string };
        if (!response.ok || !data.runId) throw new Error(data.error ?? "Screening belum dapat dimulai.");
        screeningRunIds.current.set(candidateId, data.runId);
        const resultResponse = await fetch(`/api/screening-runs/${data.runId}/result`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skills: [] }),
        });
        const resultData = (await resultResponse.json()) as { error?: string };
        if (!resultResponse.ok) throw new Error(resultData.error ?? "Hasil screening belum dapat disimpan.");
        setState((current) => ({ ...current, screeningConsents: { ...current.screeningConsents, [candidateId]: "screening-completed" } }));
         toast.success("Screening selesai", { description: "Token dan skor tersimpan di database." });
        return true;
      } catch (error) {
        toast.error("Screening belum dapat dimulai", { description: error instanceof Error ? error.message : "Coba lagi." });
        return false;
      }
    }
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
    if (state.previewsUsed >= 5) { toast.error("Pratinjau gratis trial habis", { description: "Screening tetap membutuhkan consent dan token." }); return false; }
    setState((current) => ({ ...current, previewsUsed: current.previewsUsed + 1 }));
    return true;
  };

  if (configError) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50 p-6">
        <div className="max-w-sm rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-base font-bold text-slate-900">Kesalahan Konfigurasi</h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">Aplikasi tidak dapat dijalankan karena konfigurasi autentikasi belum lengkap. Silakan hubungi administrator.</p>
        </div>
      </div>
    );
  }

  return <AppContext.Provider value={{ ...state, hydrated, dbMode: supabaseConfigured, devBypass, bootstrapped, user, profile, tokenAccount, notifications: supabaseConfigured ? notifications : (notifications.length ? notifications : demoNotifications), shortlists, consentRequests, databaseError, configError, markNotificationRead, markAllNotificationsRead, login, loginAsDemoCandidate, register, logout, scan, toggleShortlist, saveNote, viewed, saveCvProfile, saveCareerStatus, saveScreeningResult, requestConsent, requestConsentBatch, respondToConsent, approvePendingRequests, startScreening, previewCandidate }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
