"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { toast } from "sonner";
import { AppState, CareerStatus, ConsentState, CvProfile, DemoUser, ProvisioningStatus, ScreeningResult, UserRole, asCareerStatus, CONSENT_STATE_BY_DB_STATUS, CampusVerification, PARTNER_CAMPUSES } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { UUID_RE } from "@/lib/utils";
import { DEMO_CANDIDATE_USER, DEMO_CANDIDATE_CV } from "@/lib/demo-seed";
import { candidates } from "@/data/candidates";

const storageKey = "talent-network-state-v1";
const sessionKey = "proofylink-demo-session-v1";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Layanan autentikasi tidak merespons.")), timeoutMs)),
  ]);
}

const defaultPartnerVerifications: Record<string, CampusVerification> = Object.fromEntries(
  candidates.filter((c) => c.campusVerification).map((c) => [c.id, c.campusVerification!])
);

const initial: AppState = {
  tokens: 25,
  scans: [],
  shortlisted: [],
  notes: {},
  recentlyViewed: [],
  screeningTokens: 1,
  previewsUsed: 0,
  screeningConsents: {},
  screeningResults: {},
  contactRequests: {},
  cvProfile: null,
  careerStatus: "open-to-work",
  partnerVerifications: defaultPartnerVerifications,
};

const demoNotifications: BootstrapNotification[] = [
  { id: "demo-notification-1", type: "system", title: "Selamat datang di ProofyLink", body: "Lengkapi profil Anda untuk membuka lebih banyak peluang di jaringan talent.", data: {}, readAt: null, createdAt: "2026-08-14T08:00:00Z" },
  { id: "demo-notification-2", type: "message_received", title: "Pesan baru tersedia", body: "Anda memiliki percakapan demo yang siap ditinjau.", data: {}, readAt: "2026-08-13T08:00:00Z", createdAt: "2026-08-13T08:00:00Z" },
];

export type RemoteShortlistItem = { id: string; candidateProfileId: string; status: string; notes: string | null; candidate?: { name: string | null; role: string | null; location: string | null } };
export type RemoteConsentRequest = { itemId: string; candidateProfileId: string; consentState: ConsentState; recruiterName: string | null; recruiterEmail: string | null; organizationName: string | null; purpose: string; createdAt: string; respondedAt: string | null; history: { type: string; createdAt: string }[] };

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
type AuthResult = { error?: string; needsConfirmation?: boolean; role?: UserRole; provisioningStatus?: ProvisioningStatus };

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
  activePartnerInstitution: string;
  setActivePartnerInstitution: (institution: string) => void;
  verifyCandidateByPartner: (candidateId: string, status: "verified" | "rejected") => Promise<boolean>;
  verifyAllCandidatesForInstitution: (institution: string) => Promise<number>;
  markNotificationRead: (id: string) => Promise<boolean>;
  markAllNotificationsRead: () => Promise<boolean>;
  login: (role: UserRole, email: string, password: string) => Promise<AuthResult>;
  loginAsDemoCandidate: () => void;
  loginAsFreshCandidate: () => void;
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
  reloadBootstrap: () => Promise<void>;
  setProvisioningStatus: (status: ProvisioningStatus, reason?: string | null) => void;
};

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
    avatarUrl: ((candidate as Record<string, unknown> | null)?.avatarUrl as string | undefined) ?? "",
    bannerUrl: ((candidate as Record<string, unknown> | null)?.bannerUrl as string | undefined) ?? "",
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
      partnerVerifications: parsed.partnerVerifications && typeof parsed.partnerVerifications === "object"
        ? { ...defaultPartnerVerifications, ...parsed.partnerVerifications }
        : defaultPartnerVerifications,
    };
  } catch {
    return initial;
  }
}

const emptySubscribe = () => () => {};

export function AppProvider({ children }: { children: ReactNode }) {
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const devBypass = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !supabaseConfigured;
  const configError = false;
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === "undefined") return initial;
    return parseState(localStorage.getItem(storageKey));
  });
  const [user, setUser] = useState<DemoUser | null>(() => {
    if (typeof window === "undefined") return null;
    const session = localStorage.getItem(sessionKey);
    if (!session) return null;
    try {
      return JSON.parse(session) as DemoUser;
    } catch {
      return null;
    }
  });
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [bootstrapped, setBootstrapped] = useState(() => !supabaseConfigured);
  const [profile, setProfile] = useState<BootstrapProfile | null>(null);
  const [tokenAccount, setTokenAccount] = useState<BootstrapTokenAccount>({ accountId: null, balance: 0, updatedAt: null });
  const [notifications, setNotifications] = useState<BootstrapNotification[]>([]);
  const [shortlists, setShortlists] = useState<BootstrapShortlist[]>([]);
  const [consentRequests, setConsentRequests] = useState<Record<string, unknown>[]>([]);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [activePartnerInstitution, setActivePartnerInstitution] = useState<string>(() => {
    if (typeof window === "undefined") return "Universitas Indonesia";
    const session = localStorage.getItem(sessionKey);
    if (session) {
      try {
        const parsed = JSON.parse(session) as DemoUser;
        if (parsed.companyName) return parsed.companyName;
      } catch {}
    }
    return "Universitas Indonesia";
  });
  const screeningStarts = useRef(new Set<string>());
  const screeningRunIds = useRef(new Map<string, string>());
  const pendingRole = useRef<UserRole | null>(null);
  const bootstrapUserKey = useRef<string | null>(null);
  // Database is the source of truth for role/provisioning. Metadata freezes
  // at signup and goes stale the moment an admin approves or SQL changes land.
  const dbIdentity = useRef<{ role?: UserRole; provisioningStatus?: ProvisioningStatus; provisioningReason?: string | null }>({});

  const setSupabaseUser = (authUser: { email?: string; user_metadata?: Record<string, unknown> } | null) => {
    if (!authUser) {
      setUser(null);
      return;
    }
    const metadata = authUser.user_metadata ?? {};
    const role = dbIdentity.current.role ?? (metadata.role === "candidate" || metadata.role === "recruiter" || metadata.role === "partner" ? metadata.role : pendingRole.current);
    if (!role) {
      setUser(null);
      return;
    }
    setUser((current) => {
      const provisioningStatus: ProvisioningStatus =
        role === "candidate" || role === "partner"
          ? "active"
          : dbIdentity.current.provisioningStatus ??
            (current?.provisioningStatus === "active"
              ? "active"
              : metadata.provisioningStatus === "active" || metadata.provisioningStatus === "rejected" || metadata.provisioningStatus === "revision_required"
              ? (metadata.provisioningStatus as ProvisioningStatus)
              : "pending");

      return {
        role,
        provisioningStatus,
        provisioningReason: dbIdentity.current.provisioningReason ?? current?.provisioningReason ?? null,
        email: authUser.email ?? "",
        name: typeof metadata.name === "string" && metadata.name.trim()
          ? metadata.name
          : current?.name && current.name !== current.email?.split("@")[0]
            ? current.name
            : authUser.email?.split("@")[0] ?? "Pengguna",
        companyName: typeof metadata.companyName === "string" && metadata.companyName.trim() ? metadata.companyName : current?.companyName,
      };
    });
    if (typeof metadata.companyName === "string" && metadata.companyName.trim()) {
      setActivePartnerInstitution(metadata.companyName);
    }
  };

  const loadBootstrap = async () => {
    setBootstrapped(false);
    setDatabaseError(null);
    try {
      const response = await fetch("/api/app/bootstrap", { cache: "no-store" });
      const payload = (await response.json()) as {
        identity?: { role?: UserRole; email?: string; name?: string; provisioningStatus?: ProvisioningStatus; provisioningReason?: string | null };
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

      if (payload.identity?.role) {
        dbIdentity.current = { role: payload.identity.role, provisioningStatus: payload.identity.provisioningStatus };
        const role = payload.identity.role;
        const status: ProvisioningStatus = payload.identity.provisioningStatus ?? (role === "recruiter" ? "pending" : "active");
        const resolvedName = payload.profile?.displayName?.trim() || payload.identity?.name?.trim() || payload.identity?.email?.split("@")[0] || "Pengguna";
        setUser((current) => ({
          email: payload.identity?.email ?? current?.email ?? "",
          name: payload.profile?.displayName?.trim() || payload.identity?.name?.trim() || (current?.name && current.name !== current.email?.split("@")[0] ? current.name : null) || resolvedName,
          role,
          provisioningStatus: status,
          provisioningReason: payload.identity?.provisioningReason ?? current?.provisioningReason ?? null,
          companyName: current?.companyName,
        }));
      }

      const consentResponse = await fetch("/api/consent-requests", { cache: "no-store" });
      const consentPayload = (await consentResponse.json()) as { requests?: Record<string, unknown>[]; error?: string };

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
      setBootstrapped(true);
    }
  };

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }: { data: { session: { user: { email?: string; user_metadata?: Record<string, unknown>; id?: string } } | null } }) => {
      setSupabaseUser(data.session?.user ?? null);
      const userId = data.session?.user?.id ?? null;
      if (!userId) {
        setBootstrapped(true);
        return;
      }
      if (bootstrapUserKey.current !== userId) {
        bootstrapUserKey.current = userId;
        void loadBootstrap();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: { user: { email?: string; user_metadata?: Record<string, unknown>; id?: string } } | null) => {
      setSupabaseUser(session?.user ?? null);
      const userId = session?.user?.id ?? null;
      if (!userId) {
        bootstrapUserKey.current = null;
        setBootstrapped(true);
        setProfile(null);
        setNotifications([]);
        setShortlists([]);
        return;
      }
      if (bootstrapUserKey.current !== userId) {
        bootstrapUserKey.current = userId;
        void loadBootstrap();
      }
    });
    return () => { listener.subscription.unsubscribe(); };
  }, [supabaseConfigured]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (user) {
      localStorage.setItem(sessionKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(sessionKey);
    }
  }, [user, hydrated]);

  const verifyCandidateByPartner = async (candidateId: string, status: "verified" | "rejected") => {
    const existing = state.partnerVerifications?.[candidateId];
    const institution = existing?.institution || activePartnerInstitution;
    const now = new Date().toISOString();
    const updated: CampusVerification = {
      institution,
      program: existing?.program,
      year: existing?.year,
      status,
      verifiedAt: status === "verified" ? now : undefined,
      verifiedBy: status === "verified" ? `${institution} Career Center` : undefined,
    };

    setState((current) => {
      const nextVerifications = { ...(current.partnerVerifications ?? {}), [candidateId]: updated };
      const nextCv = current.cvProfile && (current.cvProfile.id === candidateId || candidateId === "my-candidate")
        ? { ...current.cvProfile, campusVerification: updated }
        : current.cvProfile;
      return {
        ...current,
        partnerVerifications: nextVerifications,
        cvProfile: nextCv,
      };
    });

    if (status === "verified") {
      setNotifications((current) => [
        {
          id: `verify-notif-${Date.now()}`,
          type: "system",
          title: "Verifikasi Kampus Berhasil",
          body: `Profil kandidat ${candidateId} telah diverifikasi oleh ${institution} Career Center.`,
          data: { candidateId, institution },
          readAt: null,
          createdAt: now,
        },
        ...current,
      ]);
      toast.success("Talent berhasil diverifikasi!", {
        description: `Tag unik 'Campus Verified · ${institution}' aktif untuk kandidat.`,
      });
    } else {
      toast.info("Verifikasi ditolak");
    }
    return true;
  };

  const verifyAllCandidatesForInstitution = async (institution: string) => {
    const now = new Date().toISOString();
    let count = 0;
    setState((current) => {
      const next = { ...(current.partnerVerifications ?? {}) };
      Object.entries(next).forEach(([id, verif]) => {
        if (verif.institution.toLowerCase() === institution.toLowerCase() && verif.status === "pending") {
          next[id] = { ...verif, status: "verified", verifiedAt: now, verifiedBy: `${institution} Career Center` };
          count++;
        }
      });
      return { ...current, partnerVerifications: next };
    });
    toast.success(`${count} talent berhasil diverifikasi massal!`);
    return count;
  };

  const markNotificationRead = async (id: string) => {
    if (supabaseConfigured) {
      const response = await fetch(`/api/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id, read: true }),
      });
      if (!response.ok) return false;
    }
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    return true;
  };

  const markAllNotificationsRead = async () => {
    if (supabaseConfigured) {
      const unreadIds = notifications.filter((item) => !item.readAt).map((item) => item.id);
      await Promise.all(unreadIds.map((id) => markNotificationRead(id)));
    }
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    return true;
  };

  const login = async (role: UserRole, email: string, password: string): Promise<AuthResult> => {
    pendingRole.current = role;
    if (supabaseConfigured) {
      const supabase = createClient();
      try {
        const { data, error } = await withTimeout(supabase.auth.signInWithPassword({ email, password }), 10000);
        if (error) return { error: error.message };

        // Sync with expected role to check role match against database
        const syncResponse = await fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, name: email.split("@")[0] }),
        });

        if (!syncResponse.ok) {
          const syncData = await syncResponse.json().catch(() => ({}));
          // If role mismatch or other sync error, sign out immediately
          await supabase.auth.signOut().catch(() => {});
          setUser(null);
          localStorage.removeItem(sessionKey);
          return {
            error: syncData.error || "Gagal memverifikasi peran akun.",
          };
        }

        const synced = await syncResponse.json() as { role: UserRole; provisioningStatus: ProvisioningStatus };
        const actualRole = synced.role ?? role;
        const provisioningStatus: ProvisioningStatus = synced.provisioningStatus ?? (actualRole === "candidate" || actualRole === "partner" ? "active" : "pending");
        dbIdentity.current = { role: actualRole, provisioningStatus };

        const metadata = data.user.user_metadata ?? {};
        setUser({
          role: actualRole,
          provisioningStatus,
          email,
          name: typeof metadata.name === "string" && metadata.name.trim() ? metadata.name : email.split("@")[0],
          companyName: typeof metadata.companyName === "string" && metadata.companyName.trim() ? metadata.companyName : undefined,
        });
        return { role: actualRole, provisioningStatus };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Gagal masuk." };
      }
    }
    const fallbackStatus: ProvisioningStatus = role === "recruiter" ? "pending" : "active";
    const nextUser: DemoUser = { name: email.split("@")[0] || "User Demo", email, role, provisioningStatus: fallbackStatus, companyName: role === "partner" ? "Universitas Indonesia" : undefined };
    setUser(nextUser);
    return { role, provisioningStatus: fallbackStatus };
  };

  const loginAsDemoCandidate = () => {
    setUser(DEMO_CANDIDATE_USER);
    setState((current) => ({
      ...current,
      cvProfile: DEMO_CANDIDATE_CV,
      careerStatus: "open-to-work",
      talentCategory: "djoin-verified",
    }));
    try {
      localStorage.removeItem("proofylink-onboarding-draft");
      localStorage.setItem(sessionKey, JSON.stringify(DEMO_CANDIDATE_USER));
    } catch {}
    toast.success("Masuk sebagai Candidate Demo (Nadia)");
  };

  const loginAsFreshCandidate = () => {
    const freshUser: DemoUser = {
      name: "Kandidat Baru",
      email: `kandidat.baru+${Date.now()}@example.com`,
      role: "candidate",
      provisioningStatus: "active",
    };
    setUser(freshUser);
    setState((current) => ({
      ...current,
      cvProfile: null,
      careerStatus: "open-to-work",
      talentCategory: "public",
    }));
    try {
      localStorage.removeItem("proofylink-onboarding-draft");
      localStorage.setItem(sessionKey, JSON.stringify(freshUser));
    } catch {}
    toast.success("Masuk sebagai Kandidat Baru (Mulai Step 0)");
  };

  const register = async (name: string, role: UserRole, email: string, password: string, companyName?: string): Promise<AuthResult> => {
    pendingRole.current = role;
    if (supabaseConfigured) {
      const supabase = createClient();
      try {
        const { data, error } = await withTimeout(supabase.auth.signUp({ email, password, options: { data: { name, role, companyName, provisioningStatus: role === "candidate" || role === "partner" ? "active" : "pending" } } }), 10000);
        if (error) {
          const msg = /already registered|already exists/i.test(error.message)
            ? "Email sudah terdaftar. Silakan masuk dengan akun tersebut, atau gunakan email lain."
            : error.message;
          return { error: msg };
        }
        if (!data.session) return { needsConfirmation: true, role };
        setUser({ role, provisioningStatus: role === "candidate" || role === "partner" ? "active" : "pending", email, name, companyName });
        return { role, provisioningStatus: role === "candidate" || role === "partner" ? "active" : "pending" };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Gagal mendaftar." };
      }
    }
    const fallbackStatus: ProvisioningStatus = role === "recruiter" ? "pending" : "active";
    setUser({ name, role, email, provisioningStatus: fallbackStatus, companyName });
    return { role, provisioningStatus: fallbackStatus };
  };

  const logout = async () => {
    if (supabaseConfigured) {
      const supabase = createClient();
      try { await supabase.auth.signOut(); } catch {}
    }
    dbIdentity.current = {};
    bootstrapUserKey.current = null;
    setUser(null);
    localStorage.removeItem(sessionKey);
  };

  const scan = (id: string) => {
    if (state.scans.some((item) => item.candidateId === id)) return true;
    if (state.tokens <= 0) {
      toast.error("Token Anda habis", { description: "Tambah token untuk membuka profil lainnya." });
      return false;
    }
    setState((current) => ({
      ...current,
      tokens: current.tokens - 1,
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
    setState((current) => ({ ...current, notes: { ...current.notes, [id]: note } }));
    toast.success("Catatan disimpan");
  };

  const viewed = (id: string) => {
    setState((current) => ({
      ...current,
      recentlyViewed: [id, ...current.recentlyViewed.filter((item) => item !== id)].slice(0, 10),
    }));
  };

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
    let campusVerification = profile.campusVerification;
    const edu = profile.education?.[0];
    if (edu?.school) {
      const match = PARTNER_CAMPUSES.find((c) => edu.school.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(edu.school.toLowerCase()));
      if (match) {
        campusVerification = {
          institution: match,
          program: edu.program || "Umum",
          year: edu.dates || "2024",
          status: campusVerification?.institution === match && campusVerification?.status === "verified" ? "verified" : "pending",
          verifiedAt: campusVerification?.institution === match && campusVerification?.status === "verified" ? campusVerification.verifiedAt : undefined,
          verifiedBy: campusVerification?.institution === match && campusVerification?.status === "verified" ? campusVerification.verifiedBy : undefined,
        };
      }
    }
    const saved = { ...profile, campusVerification, updatedAt: new Date().toISOString() };
    if (saved.fullName?.trim()) {
      setUser((current) => current ? { ...current, name: saved.fullName } : null);
    }
    setState((current) => ({
      ...current,
      cvProfile: saved,
      careerStatus: saved.careerStatus,
      talentCategory: saved.talentCategory,
      partnerVerifications: campusVerification
        ? { ...current.partnerVerifications, [profile.id || "my-candidate"]: campusVerification }
        : current.partnerVerifications,
    }));
    if (supabaseConfigured) {
      try { await syncProfile(saved); } catch (error) { toast.error("Profil tersimpan sementara", { description: error instanceof Error ? error.message : "Database belum diperbarui." }); return; }
    }
    toast.success("Profil CV tersimpan", {
      description: campusVerification ? `Terhubung ke Career Center ${campusVerification.institution}` : undefined,
    });
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
      return {
        ...current,
        screeningConsents: { ...current.screeningConsents, [id]: "pending-candidate-consent" },
        contactRequests: { ...(current.contactRequests ?? {}), [id]: { candidateId: id, recruiterName: user?.name ?? "Recruiter Demo", company: user?.companyName ?? "Perusahaan Demo", email: user?.email ?? "recruiter@example.com", requestedAt: now, history: [{ state: "pending-candidate-consent", at: now }] } },
      };
    }));
    toast.success(`Permintaan consent dikirim ke ${uniqueIds.length} kandidat`);
    return true;
  };

  const requestConsent = async (candidateId: string) => {
    if (supabaseConfigured && UUID_RE.test(candidateId)) {
      return requestConsentBatch([candidateId]);
    }
    setState((current) => {
      const now = new Date().toISOString();
      return {
        ...current,
        screeningConsents: { ...current.screeningConsents, [candidateId]: "pending-candidate-consent" },
        contactRequests: { ...(current.contactRequests ?? {}), [candidateId]: { candidateId, recruiterName: user?.name ?? "Recruiter Demo", company: user?.companyName ?? "Perusahaan Demo", email: user?.email ?? "recruiter@example.com", requestedAt: now, history: [{ state: "pending-candidate-consent", at: now }] } },
      };
    });
    toast.success("Permintaan consent terkirim", { description: "Kandidat perlu menyetujui sebelum screening dimulai." });
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

  const reloadBootstrap = async () => {
    await loadBootstrap();
  };

  const setProvisioningStatus = (status: ProvisioningStatus, reason?: string | null) => {
    dbIdentity.current.provisioningStatus = status;
    dbIdentity.current.provisioningReason = reason ?? null;
    setUser((curr) => curr ? { ...curr, provisioningStatus: status, provisioningReason: reason ?? null } : null);
    try {
      const session = localStorage.getItem(sessionKey);
      if (session) {
        const parsed = JSON.parse(session);
        parsed.provisioningStatus = status;
        parsed.provisioningReason = reason ?? null;
        localStorage.setItem(sessionKey, JSON.stringify(parsed));
      }
      localStorage.setItem("proofylink_session", JSON.stringify({
        role: "recruiter",
        provisioningStatus: status,
        provisioningReason: reason ?? null,
      }));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  return <AppContext.Provider value={{ ...state, hydrated, dbMode: supabaseConfigured, devBypass, bootstrapped, user, profile, tokenAccount, notifications: supabaseConfigured ? notifications : (notifications.length ? notifications : demoNotifications), shortlists, consentRequests, databaseError, configError, activePartnerInstitution, setActivePartnerInstitution, verifyCandidateByPartner, verifyAllCandidatesForInstitution, markNotificationRead, markAllNotificationsRead, login, loginAsDemoCandidate, loginAsFreshCandidate, register, logout, scan, toggleShortlist, saveNote, viewed, saveCvProfile, saveCareerStatus, saveScreeningResult, requestConsent, requestConsentBatch, respondToConsent, approvePendingRequests, startScreening, previewCandidate, reloadBootstrap, setProvisioningStatus }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
