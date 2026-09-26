"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Clock,
  Edit3,
  FileText,
  Lock,
  Save,
  Sliders,
  Trash2,
  User,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccessibilitySettings } from "@/components/settings/accessibility-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { DeleteAccountModal } from "@/components/candidate/delete-account-modal";
import { useApp } from "@/providers/app-provider";
import { cn } from "@/lib/utils";

export type SettingsTab = "overview" | "notifications" | "security" | "accessibility" | "danger";

const SETTINGS_TAB_PARAMS: Record<SettingsTab, string> = {
  overview: "overview",
  notifications: "notif",
  security: "security",
  accessibility: "a11y",
  danger: "danger",
};

function parseSettingsTab(value: string | null): SettingsTab {
  if (value === "notif" || value === "notifications") return "notifications";
  if (value === "security") return "security";
  if (value === "a11y" || value === "accessibility") return "accessibility";
  if (value === "danger") return "danger";
  return "overview";
}

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
    description: "Ringkasan data profil",
    icon: User,
  },
  {
    id: "notifications" as const,
    label: "Notifikasi & Privasi",
    description: "Saluran pesan & jam tenang",
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

// ─── Accessible Custom Switch Toggle ──────────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
  label,
  id,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export function CandidateSettingsView({
  initialProfile,
  initialPreferences,
}: CandidateSettingsViewProps) {
  const { user, cvProfile, profile } = useApp();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => parseSettingsTab(searchParams.get("tab")));

  useEffect(() => {
    const onPopState = () => {
      setActiveTab(parseSettingsTab(new URLSearchParams(window.location.search).get("tab")));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const [profileData, setProfileData] = useState<CandidateProfileData | null>(
    initialProfile ?? null
  );

  const changeTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `?tab=${SETTINGS_TAB_PARAMS[tab]}`);
  };

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(
    initialPreferences ?? {
      inAppEnabled: true,
      emailEnabled: true,
      quietHours: { start: "", end: "" },
    }
  );
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  // Delete Account Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Fallback client fetch only if server did not provide preloaded initial data
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
    setPrefsError(null);
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
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan preferensi notifikasi.";
      setPrefsError(message);
      toast.error(message);
    } finally {
      setSavingPrefs(false);
    }
  };

  const displayName =
    cvProfile?.fullName ||
    profile?.displayName ||
    profileData?.profile?.displayName ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "Kandidat";
  const email = cvProfile?.email || profileData?.user?.email || user?.email || "";
  const phone = cvProfile?.phone || profileData?.profile?.phone || "-";
  const headline =
    cvProfile?.headline ||
    profileData?.candidateProfile?.headline ||
    "Talenta Profesional ProofyLink";
  const targetRole =
    cvProfile?.targetRole || profileData?.candidateProfile?.targetRole || "-";
  const location =
    cvProfile?.location ||
    profileData?.candidateProfile?.location ||
    "Indonesia";

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header: Focused, Distilled & Clean (No duplicate giant card) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Pengaturan Akun
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola preferensi akun, saluran notifikasi, dan keamanan login.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" asChild className="gap-1.5 text-xs font-medium">
            <Link href="/candidate/cv">
              <FileText className="size-3.5" />
              <span>Buka Studio CV</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Mobile Segmented Tab Bar (< md) */}
      <div className="flex md:hidden overflow-x-auto gap-1.5 border-b border-border/80 pb-2 -mx-4 px-4 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          let mobileStyle = "text-muted-foreground bg-card border border-border/70";
          if (active) {
            mobileStyle = item.isDanger
              ? "bg-destructive/10 text-destructive border-destructive/30 font-semibold shadow-xs"
              : "bg-primary/10 text-primary border-primary/25 font-semibold shadow-xs";
          } else if (item.isDanger) {
            mobileStyle = "text-destructive/80 hover:bg-destructive/5 hover:text-destructive";
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => changeTab(item.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs whitespace-nowrap transition-colors",
                mobileStyle
              )}
            >
              <Icon className="size-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. 2-Column Responsive Workspace Grid (Left Tab Rail + Content Area) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Sidebar Navigation Rail (Desktop >= md) */}
        <aside className="hidden md:block md:col-span-4 lg:col-span-4 sticky top-24">
          <nav aria-label="Menu Pengaturan" className="rounded-2xl border border-border/80 bg-card p-2 shadow-xs space-y-1">
            <div className="px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Kategori Pengaturan
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
                      onClick={() => changeTab(item.id)}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all border",
                        active
                          ? "bg-destructive/10 border-destructive/30 text-destructive shadow-xs font-semibold"
                          : "border-transparent text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex size-8 items-center justify-center rounded-lg transition-colors",
                            active ? "bg-destructive text-white" : "bg-muted text-muted-foreground group-hover:bg-destructive/10 group-hover:text-destructive"
                          )}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm">{item.label}</p>
                          <p className="text-[11px] opacity-75">{item.description}</p>
                        </div>
                      </div>
                      <ChevronRight
                        className={cn(
                          "size-4 transition-transform",
                          active ? "text-destructive translate-x-0.5" : "text-muted-foreground/40 group-hover:text-destructive group-hover:translate-x-0.5"
                        )}
                      />
                    </button>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => changeTab(item.id)}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all border",
                    active
                      ? "bg-card border-border/80 text-foreground font-semibold shadow-xs ring-1 ring-primary/20"
                      : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg transition-colors",
                        active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm">{item.label}</p>
                      <p className={cn("text-[11px]", active ? "text-muted-foreground" : "text-muted-foreground/75")}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      "size-4 transition-transform",
                      active ? "text-primary translate-x-0.5" : "text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5"
                    )}
                  />
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Settings Content Area */}
        <main className="md:col-span-8 lg:col-span-8">
          {/* TAB 1: PROFIL & AKUN */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  Profil &amp; Akun
                </h2>
                <p className="text-xs text-muted-foreground">
                  Informasi data akun yang digunakan untuk korespondensi dan akses di jaringan ProofyLink.
                </p>
              </div>

              {/* Card 1: Identitas Akun (No card nesting - semantic definition list) */}
              <Card className="border-border/80 bg-card shadow-xs">
                <CardHeader className="border-b border-border/60 pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <User className="size-4 text-primary" />
                        Identitas &amp; Data Akun
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Data akun utama yang terhubung dengan kredensial login Anda.
                      </CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs shrink-0">
                      <Link href="/candidate/profile/edit">
                        <Edit3 className="size-3.5" />
                        <span>Edit Profil Lengkap</span>
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <dt className="text-xs font-medium text-muted-foreground">Nama Lengkap</dt>
                      <dd className="text-sm font-semibold text-foreground">{displayName}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs font-medium text-muted-foreground">Alamat Email</dt>
                      <dd className="text-sm font-semibold text-foreground break-all">{email}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs font-medium text-muted-foreground">Nomor Telepon</dt>
                      <dd className="text-sm font-semibold text-foreground">{phone}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs font-medium text-muted-foreground">Lokasi Domisili</dt>
                      <dd className="text-sm font-semibold text-foreground">{location}</dd>
                    </div>
                    <div className="sm:col-span-2 space-y-1 pt-2 border-t border-border/60">
                      <dt className="text-xs font-medium text-muted-foreground">Posisi Sasaran Karier</dt>
                      <dd className="text-sm font-semibold text-foreground">{targetRole}</dd>
                    </div>
                    <div className="sm:col-span-2 space-y-1 pt-2 border-t border-border/60">
                      <dt className="text-xs font-medium text-muted-foreground">Headline Profil</dt>
                      <dd className="text-sm text-foreground leading-relaxed">{headline}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: NOTIFIKASI & PRIVASI */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  Notifikasi &amp; Privasi
                </h2>
                <p className="text-xs text-muted-foreground">
                  Kelola preferensi pemberitahuan tawaran screening, pesan rekruter, dan rentang jam tenang.
                </p>
              </div>

              <form onSubmit={handleSaveNotifPrefs} className="space-y-6">
                {/* Saluran Pemberitahuan */}
                <Card className="border-border/80 bg-card shadow-xs">
                  <CardHeader className="border-b border-border/60 pb-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Bell className="size-4 text-primary" />
                      Saluran Pemberitahuan
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Pilih kanal di mana Anda ingin menerima pembaruan status dan pesan.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    {/* In-App Toggle */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <label
                          htmlFor="toggle-in-app"
                          className="text-sm font-semibold text-foreground cursor-pointer"
                        >
                          Notifikasi Dalam Aplikasi (In-App)
                        </label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Tampilkan lencana dan notifikasi lonceng di bilah navigasi atas saat ada tawaran atau kabar baru.
                        </p>
                      </div>
                      <ToggleSwitch
                        id="toggle-in-app"
                        label="Notifikasi dalam aplikasi"
                        checked={notifPrefs.inAppEnabled}
                        onChange={(checked) =>
                          setNotifPrefs({ ...notifPrefs, inAppEnabled: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Jam Tenang */}
                <Card className="border-border/80 bg-card shadow-xs">
                  <CardHeader className="border-b border-border/60 pb-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="size-4 text-primary" />
                      Jam Tenang (Quiet Hours)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Tunda notifikasi instan pada jam istirahat Anda agar tidak mengganggu (format 24 jam).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
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
                          className="h-9 w-full rounded-lg border border-border/80 bg-background px-3 text-sm font-mono shadow-xs outline-none transition focus-visible:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-primary/20"
                        />
                        <p className="text-[11px] text-muted-foreground/80">Contoh: 22:00 WIB</p>
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
                          className="h-9 w-full rounded-lg border border-border/80 bg-background px-3 text-sm font-mono shadow-xs outline-none transition focus-visible:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-primary/20"
                        />
                        <p className="text-[11px] text-muted-foreground/80">Contoh: 07:00 WIB</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col items-end justify-end gap-2 pt-1">
                  {prefsError ? (
                    <p role="alert" className="text-xs text-destructive">
                      {prefsError}
                    </p>
                  ) : null}
                  <Button type="submit" disabled={savingPrefs} size="sm" className="gap-2 text-xs font-medium">
                    {savingPrefs ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    <span>{savingPrefs ? "Menyimpan..." : "Simpan Preferensi Notifikasi"}</span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: KEAMANAN & SANDI */}
          {activeTab === "security" && (
            <div>
              <SecuritySettings />
            </div>
          )}

          {/* TAB 4: AKSESIBILITAS */}
          {activeTab === "accessibility" && (
            <div>
              <AccessibilitySettings />
            </div>
          )}

          {/* TAB 5: ZONA BERBAHAYA */}
          {activeTab === "danger" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-destructive sm:text-xl flex items-center gap-2">
                  <AlertTriangle className="size-5 text-destructive" />
                  Zona Berbahaya
                </h2>
                <p className="text-xs text-muted-foreground">
                  Tindakan di halaman ini bersifat destruktif dan menghapus akun kandidat Anda secara permanen.
                </p>
              </div>

              <Card className="border-destructive/30 bg-card shadow-xs">
                <CardHeader className="border-b border-destructive/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive shrink-0">
                      <Trash2 className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        Hapus Akun Kandidat Permanen
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Musnahkan profil publik, seluruh dokumen CV, riwayat lamaran, dan kredensial login.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-1.5">
                    <p className="text-xs font-semibold text-destructive">
                      Perhatian: Tindakan ini tidak dapat dibatalkan
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Setelah akun Anda dihapus, semua berkas PDF CV, foto profil, dan riwayat lamaran kerja Anda akan segera dihapus permanen dari server. Rekruter tidak akan lagi dapat menemukan atau menghubungi Anda.
                    </p>
                  </div>

                  <div className="flex items-center justify-start pt-1">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteModalOpen(true)}
                      className="gap-2 text-xs font-medium"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Hapus Akun Saya</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* 4. Delete Account Confirmation Modal */}
      <DeleteAccountModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        userEmail={email}
      />
    </div>
  );
}
