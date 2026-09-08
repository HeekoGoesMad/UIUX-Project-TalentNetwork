"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  Lock,
  Mail,
  MapPin,
  Save,
  Shield,
  Sliders,
  Sparkles,
  Trash2,
  User,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccessibilitySettings } from "@/components/settings/accessibility-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { DeleteAccountModal } from "@/components/candidate/delete-account-modal";
import { useApp } from "@/providers/app-provider";

export type SettingsTab = "overview" | "notifications" | "security" | "accessibility" | "danger";

export type CandidateProfileData = {
  user: {
    id: string;
    email: string;
    role: string;
  };
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
    phone: string | null;
    createdAt?: string;
  } | null;
  candidateProfile: {
    id: string;
    headline: string | null;
    targetRole: string | null;
    location: string | null;
    summary: string | null;
    isPublished: boolean;
    completeness: number;
  } | null;
};

export type NotificationPrefs = {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  quietHours: {
    start?: string;
    end?: string;
  };
};

type CandidateSettingsViewProps = {
  initialProfile?: CandidateProfileData | null;
  initialPreferences?: NotificationPrefs | null;
};

const NAV_ITEMS = [
  {
    id: "overview" as const,
    label: "Profil & Akun",
    description: "Ringkasan data & peran",
    icon: User,
  },
  {
    id: "notifications" as const,
    label: "Notifikasi & Privasi",
    description: "Email & jam tenang",
    icon: Bell,
  },
  {
    id: "security" as const,
    label: "Keamanan & Sandi",
    description: "Kata sandi & sesi login",
    icon: Lock,
  },
  {
    id: "accessibility" as const,
    label: "Aksesibilitas",
    description: "Tampilan & kontras warna",
    icon: Sliders,
  },
  {
    id: "danger" as const,
    label: "Zona Berbahaya",
    description: "Hapus akun permanen",
    icon: AlertTriangle,
    isDanger: true,
  },
];

export function CandidateSettingsView({
  initialProfile,
  initialPreferences,
}: CandidateSettingsViewProps) {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>("overview");
  const [profileData, setProfileData] = useState<CandidateProfileData | null>(
    initialProfile ?? null
  );

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(
    initialPreferences ?? {
      inAppEnabled: true,
      emailEnabled: true,
      quietHours: { start: "", end: "" },
    }
  );
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Delete Account Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Fallback client fetch only if server did not provide preloaded initial data (e.g. dev mock mode)
  useEffect(() => {
    if (initialProfile && initialPreferences) return;

    let isMounted = true;
    async function loadFallbackData() {
      try {
        const [profileRes, prefsRes] = await Promise.all([
          !initialProfile ? fetch("/api/profile") : Promise.resolve(null),
          !initialPreferences ? fetch("/api/notification-preferences") : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        if (profileRes && profileRes.ok) {
          const data = await profileRes.json();
          setProfileData(data);
        }

        if (prefsRes && prefsRes.ok) {
          const prefsData = await prefsRes.json();
          if (prefsData?.preferences) {
            setNotifPrefs({
              inAppEnabled: prefsData.preferences.inAppEnabled ?? true,
              emailEnabled: prefsData.preferences.emailEnabled ?? true,
              quietHours: {
                start: prefsData.preferences.quietHours?.start || "",
                end: prefsData.preferences.quietHours?.end || "",
              },
            });
          }
        }
      } catch (err) {
        console.warn("Gagal memuat fallback data pengaturan kandidat:", err);
      }
    }

    loadFallbackData();
    return () => {
      isMounted = false;
    };
  }, [initialProfile, initialPreferences]);

  const handleSaveNotifPrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      const payload: Record<string, unknown> = {
        inAppEnabled: notifPrefs.inAppEnabled,
        emailEnabled: notifPrefs.emailEnabled,
      };

      if (notifPrefs.quietHours.start && notifPrefs.quietHours.end) {
        payload.quietHours = {
          start: notifPrefs.quietHours.start,
          end: notifPrefs.quietHours.end,
        };
      } else {
        payload.quietHours = {};
      }

      const res = await fetch("/api/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Gagal menyimpan preferensi notifikasi.");
      }

      toast.success("Preferensi notifikasi berhasil diperbarui.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan preferensi notifikasi."
      );
    } finally {
      setSavingPrefs(false);
    }
  };

  const displayName =
    profileData?.profile?.displayName || user?.name || user?.email?.split("@")[0] || "Kandidat";
  const email = profileData?.user?.email || user?.email || "";
  const avatarUrl = profileData?.profile?.avatarUrl;
  const headline = profileData?.candidateProfile?.headline || "Talenta Profesional";
  const targetRole = profileData?.candidateProfile?.targetRole;
  const location = profileData?.candidateProfile?.location || "Indonesia";
  const isPublished = profileData?.candidateProfile?.isPublished ?? false;
  const completeness = profileData?.candidateProfile?.completeness ?? 60;
  const candidateId = profileData?.candidateProfile?.id;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-10 space-y-8">
      {/* 1. Page Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Workspace Kandidat
        </span>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Pengaturan Akun
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola profil, visibilitas rekruter, preferensi notifikasi, keamanan sandi, dan data akun Anda.
        </p>
      </div>

      {/* 2. Profile Summary Card (Server-Rendered for Instant Paint) */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-white p-6 shadow-xs sm:p-7 transition-all">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar or Initial Badge */}
            <div className="relative size-16 sm:size-20 shrink-0 overflow-hidden rounded-full border-2 border-primary/20 bg-primary/5 shadow-xs">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary to-purple-800 text-xl sm:text-2xl font-bold text-white uppercase">
                  {displayName.charAt(0)}
                </div>
              )}
            </div>

            {/* Candidate Details */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {displayName}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  <Shield className="size-3" />
                  Kandidat Aktif
                </span>
                {isPublished ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    Profil Publik
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    Draft
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                {headline}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5 text-slate-400" />
                  {email}
                </span>
                {location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-slate-400" />
                    {location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5 border-t border-border/70 pt-4 md:border-t-0 md:pt-0">
            <Button variant="outline" size="sm" asChild className="gap-1.5 shadow-xs">
              <Link href="/candidate/profile/edit">
                <Edit3 className="size-3.5" />
                <span>Edit Profil</span>
              </Link>
            </Button>
            {candidateId ? (
              <Button variant="outline" size="sm" asChild className="gap-1.5 shadow-xs">
                <Link href={`/talent/${candidateId}`} target="_blank">
                  <ExternalLink className="size-3.5" />
                  <span>Lihat Publik</span>
                </Link>
              </Button>
            ) : null}
            <Button size="sm" asChild className="gap-1.5 shadow-xs">
              <Link href="/candidate/cv">
                <FileText className="size-3.5" />
                <span>Kelola CV</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Profile Completeness Bar */}
        <div className="mt-6 border-t border-border/70 pt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              Kelengkapan Profil Kandidat
            </span>
            <span className="font-bold text-primary">{completeness}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-purple-600 transition-all duration-500"
              style={{ width: `${Math.max(completeness, 8)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Mobile Tab Bar (< md) */}
      <div className="flex md:hidden overflow-x-auto gap-2 border-b border-border/80 pb-2 -mx-4 px-4 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          let mobileStyle = "text-muted-foreground bg-white border border-border/70";
          if (active) {
            mobileStyle = item.isDanger
              ? "bg-red-600 text-white border-red-600 shadow-xs"
              : "bg-primary text-white border-primary shadow-xs";
          } else if (item.isDanger) {
            mobileStyle = "text-red-600 bg-red-50/50 border-red-200/80";
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${mobileStyle}`}
            >
              <Icon className="size-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 4. Desktop 2-Column Layout (Left Navigation Sidebar + Content Area) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Sidebar Navigation (Desktop only) */}
        <aside className="hidden md:block md:col-span-4 lg:col-span-4 sticky top-24">
          <div className="rounded-2xl border border-border/80 bg-white p-2.5 shadow-xs space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Menu Pengaturan
            </div>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;

              if (item.isDanger) {
                return (
                  <div key={item.id} className="pt-2">
                    <div className="border-t border-border/70 my-1" />
                    <button
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition-all ${
                        active
                          ? "bg-red-600 text-white shadow-xs"
                          : "text-red-600 hover:bg-red-50/80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-8 items-center justify-center rounded-lg ${
                            active ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
                          }`}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p
                            className={`text-[11px] ${
                              active ? "text-red-100" : "text-red-500/80"
                            }`}
                          >
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`size-4 transition-transform ${
                          active ? "text-white translate-x-0.5" : "text-red-400 group-hover:translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition-all ${
                    active
                      ? "bg-primary text-white shadow-xs"
                      : "text-foreground hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-8 items-center justify-center rounded-lg ${
                        active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p
                        className={`text-[11px] ${
                          active ? "text-purple-100" : "text-muted-foreground"
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`size-4 transition-transform ${
                      active
                        ? "text-white translate-x-0.5"
                        : "text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Settings Content Area */}
        <main className="md:col-span-8 lg:col-span-8">
          {/* TAB 1: PROFIL & AKUN */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-up">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Profil &amp; Akun
                </h2>
                <p className="text-sm text-muted-foreground">
                  Informasi data akun yang digunakan untuk korespondensi dan akses ProofyLink.
                </p>
              </div>

              <Card className="border-border/80 shadow-xs">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="size-4 text-primary" />
                    Detail Identitas Akun
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Informasi utama yang terhubung dengan akun login Anda.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border bg-slate-50/60 p-3.5 space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Nama Lengkap
                      </span>
                      <p className="font-semibold text-foreground">{displayName}</p>
                    </div>
                    <div className="rounded-lg border bg-slate-50/60 p-3.5 space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Alamat Email Akun
                      </span>
                      <p className="font-semibold text-foreground break-all">{email}</p>
                    </div>
                    <div className="rounded-lg border bg-slate-50/60 p-3.5 space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Posisi Sasaran Karier
                      </span>
                      <p className="font-semibold text-foreground">
                        {targetRole || "Belum ditentukan"}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-slate-50/60 p-3.5 space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Lokasi Domisili
                      </span>
                      <p className="font-semibold text-foreground">{location}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-slate-50/60 p-3.5 space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Headline Profil
                    </span>
                    <p className="text-foreground leading-relaxed">{headline}</p>
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
                      <Link href="/candidate/profile/edit">
                        <Edit3 className="size-3.5" />
                        Perbarui Data Profil Lengkap
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Account Status Card */}
              <Card className="border-border/80 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Briefcase className="size-4 text-primary" />
                    Kebijakan Visibilitas &amp; Privasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span>Status Publikasi Portofolio:</span>
                    <span className="font-bold text-foreground">
                      {isPublished ? "Aktif di Pencarian Rekruter" : "Draft (Tersimpan Privat)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span>Peran Akun:</span>
                    <span className="font-bold text-foreground capitalize">
                      {user?.role || "Kandidat"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Kebijakan Screening:</span>
                    <span className="font-bold text-emerald-600">Consent-First Berizin</span>
                  </div>
                  <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Data pribadi Anda (nomor kontak, detail CV lengkap) terlindungi dan hanya dapat
                    diakses oleh rekruter setelah Anda menyetujui permintaan screening resmi.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: NOTIFIKASI & PRIVASI */}
          {activeTab === "notifications" && (
            <div className="space-y-6 animate-fade-up">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Notifikasi &amp; Privasi
                </h2>
                <p className="text-sm text-muted-foreground">
                  Kelola preferensi pemberitahuan tawaran screening, pesan rekruter, dan jam tenang.
                </p>
              </div>

              <form onSubmit={handleSaveNotifPrefs} className="space-y-6">
                <Card className="border-border/80 shadow-xs">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bell className="size-4 text-primary" />
                      Saluran Pemberitahuan
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Pilih bagaimana Anda ingin menerima update penting.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label className="flex items-start justify-between gap-4 rounded-lg border p-4 cursor-pointer hover:bg-slate-50/60 transition">
                      <div className="space-y-0.5">
                        <span className="text-sm font-semibold text-foreground">
                          Notifikasi Dalam Aplikasi (In-App)
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Tampilkan lencana dan notifikasi lonceng di bilah atas aplikasi saat login.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifPrefs.inAppEnabled}
                        onChange={(e) =>
                          setNotifPrefs({ ...notifPrefs, inAppEnabled: e.target.checked })
                        }
                        className="mt-1 size-4 rounded text-primary focus:ring-primary/20 accent-primary"
                      />
                    </label>

                    <label className="flex items-start justify-between gap-4 rounded-lg border p-4 cursor-pointer hover:bg-slate-50/60 transition">
                      <div className="space-y-0.5">
                        <span className="text-sm font-semibold text-foreground">
                          Notifikasi Email
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Kirimkan email ke <span className="font-semibold">{email}</span> saat ada
                          tawaran screening atau pesan rekruter.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifPrefs.emailEnabled}
                        onChange={(e) =>
                          setNotifPrefs({ ...notifPrefs, emailEnabled: e.target.checked })
                        }
                        className="mt-1 size-4 rounded text-primary focus:ring-primary/20 accent-primary"
                      />
                    </label>
                  </CardContent>
                </Card>

                <Card className="border-border/80 shadow-xs">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="size-4 text-primary" />
                      Jam Tenang (Quiet Hours)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Tunda notifikasi instan pada rentang jam istirahat Anda (format 24 jam).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="quiet-start"
                          className="text-xs font-semibold text-foreground"
                        >
                          Mulai Jam Tenang
                        </label>
                        <input
                          id="quiet-start"
                          type="time"
                          value={notifPrefs.quietHours.start || ""}
                          onChange={(e) =>
                            setNotifPrefs({
                              ...notifPrefs,
                              quietHours: { ...notifPrefs.quietHours, start: e.target.value },
                            })
                          }
                          className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="quiet-end"
                          className="text-xs font-semibold text-foreground"
                        >
                          Selesai Jam Tenang
                        </label>
                        <input
                          id="quiet-end"
                          type="time"
                          value={notifPrefs.quietHours.end || ""}
                          onChange={(e) =>
                            setNotifPrefs({
                              ...notifPrefs,
                              quietHours: { ...notifPrefs.quietHours, end: e.target.value },
                            })
                          }
                          className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-end pt-2">
                  <Button type="submit" disabled={savingPrefs} className="gap-2">
                    <Save className="size-4" />
                    {savingPrefs ? "Menyimpan..." : "Simpan Preferensi Notifikasi"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: KEAMANAN & SANDI */}
          {activeTab === "security" && (
            <div className="animate-fade-up">
              <SecuritySettings />
            </div>
          )}

          {/* TAB 4: AKSESIBILITAS */}
          {activeTab === "accessibility" && (
            <div className="animate-fade-up">
              <AccessibilitySettings />
            </div>
          )}

          {/* TAB 5: ZONA BERBAHAYA */}
          {activeTab === "danger" && (
            <div className="space-y-6 animate-fade-up">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-red-600 sm:text-2xl flex items-center gap-2">
                  <AlertTriangle className="size-6 text-red-600" />
                  Zona Berbahaya
                </h2>
                <p className="text-sm text-muted-foreground">
                  Aksi di bagian ini bersifat permanen dan menghapus seluruh akun kandidat Anda.
                </p>
              </div>

              <Card className="border-red-200/90 bg-red-50/20 shadow-xs">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-red-100 text-red-600">
                      <Trash2 className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-red-950">
                        Hapus Akun Kandidat Permanen
                      </CardTitle>
                      <CardDescription className="text-xs text-red-800">
                        Musnahkan profil, seluruh dokumen CV, riwayat lamaran, pesan, dan kredensial login.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Setelah akun Anda dihapus, semua berkas PDF CV, foto profil di penyimpanan awan,
                    dan riwayat lamaran pekerjaan akan segera dihapus permanen dari server. Rekruter
                    tidak akan lagi dapat melihat data atau menghubungi Anda.
                  </p>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setDeleteModalOpen(true)}
                      className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-xs"
                    >
                      <Trash2 className="size-4" />
                      Hapus Akun Saya
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* 5. Delete Account Confirmation Modal */}
      <DeleteAccountModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        userEmail={email}
      />
    </div>
  );
}
