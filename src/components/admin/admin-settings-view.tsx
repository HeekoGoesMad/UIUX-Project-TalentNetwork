"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sliders,
  User,
  Bell,
  SlidersHorizontal,
  ShieldCheck,
  Save,
  Loader2,
  Clock,
  CheckCircle2,
  ChevronRight,
  Info,
  RefreshCw,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AccessibilitySettings } from "@/components/settings/accessibility-settings";
import { useApp } from "@/providers/app-provider";
import { cn } from "@/lib/utils";

export type AdminSettingsTab = "accessibility" | "profile" | "notifications" | "console";

const TAB_PARAM_MAP: Record<AdminSettingsTab, string> = {
  accessibility: "a11y",
  profile: "profile",
  notifications: "notif",
  console: "console",
};

function parseTab(param: string | null): AdminSettingsTab {
  if (param === "profile") return "profile";
  if (param === "notif" || param === "notifications") return "notifications";
  if (param === "console" || param === "system") return "console";
  return "accessibility";
}

const NAV_ITEMS = [
  {
    id: "accessibility" as const,
    label: "Aksesibilitas & Tampilan",
    description: "Ukuran teks, kontras & gerakan",
    icon: Sliders,
  },
  {
    id: "profile" as const,
    label: "Profil & Identitas Admin",
    description: "Nama, kontak & otoritas sesi",
    icon: User,
  },
  {
    id: "notifications" as const,
    label: "Notifikasi & Peringatan",
    description: "Saluran pesan & jam tenang",
    icon: Bell,
  },
  {
    id: "console" as const,
    label: "Preferensi Konsol",
    description: "Auto-refresh & perilaku tabel",
    icon: SlidersHorizontal,
  },
];

// Accessible Toggle Switch Component
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
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-[#7C3AED]" : "bg-slate-200"
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

export type AdminConsolePrefs = {
  dashboardAutoRefresh: number; // in seconds (0 = manual)
  defaultPageSize: number;
  confirmCriticalActions: boolean;
  timezone: "WIB" | "WITA" | "WIT";
  alertSoundEnabled: boolean;
};

const DEFAULT_CONSOLE_PREFS: AdminConsolePrefs = {
  dashboardAutoRefresh: 60,
  defaultPageSize: 25,
  confirmCriticalActions: true,
  timezone: "WIB",
  alertSoundEnabled: false,
};

const ADMIN_CONSOLE_STORAGE_KEY = "proofylink-admin-console-prefs";

export function AdminSettingsView() {
  const { user } = useApp();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>(() =>
    parseTab(searchParams.get("tab"))
  );

  useEffect(() => {
    const onPopState = () => {
      setActiveTab(parseTab(new URLSearchParams(window.location.search).get("tab")));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const changeTab = (tab: AdminSettingsTab) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `?tab=${TAB_PARAM_MAP[tab]}`);
  };

  // ── Profile State ──────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    phone: "",
    department: "Platform Governance & Compliance",
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data?.profile) {
          setProfileForm((prev) => ({
            ...prev,
            displayName: data.profile.displayName || user?.name || "Super Administrator",
            phone: data.profile.phone || "",
          }));
        } else if (isMounted && user) {
          setProfileForm((prev) => ({
            ...prev,
            displayName: user.name || "Super Administrator",
            phone: "",
          }));
        }
      } catch (err) {
        console.warn("Gagal memuat profil admin:", err);
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    }
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: profileForm.displayName.trim() || undefined,
          phone: profileForm.phone.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui data identitas admin.");
      }
      toast.success("Profil administrator berhasil diperbarui.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Notifications Preferences State ─────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    inAppEnabled: true,
    emailEnabled: true,
    quietHours: { start: "", end: "" },
  });
  const [adminAlertSubscriptions, setAdminAlertSubscriptions] = useState({
    verificationAlert: true,
    lowTokenAlert: true,
    securityAnomalies: true,
  });
  const [savingNotif, setSavingNotif] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadNotifPrefs() {
      try {
        const res = await fetch("/api/notification-preferences");
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data?.preferences) {
          setNotifPrefs({
            inAppEnabled: data.preferences.inAppEnabled ?? true,
            emailEnabled: data.preferences.emailEnabled ?? true,
            quietHours: {
              start: data.preferences.quietHours?.start || "",
              end: data.preferences.quietHours?.end || "",
            },
          });
        }
      } catch {
        // use defaults
      }
    }
    loadNotifPrefs();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveNotifPrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotif(true);
    try {
      const payload: Record<string, unknown> = {
        inAppEnabled: notifPrefs.inAppEnabled,
        emailEnabled: notifPrefs.emailEnabled,
        quietHours:
          notifPrefs.quietHours.start && notifPrefs.quietHours.end
            ? { start: notifPrefs.quietHours.start, end: notifPrefs.quietHours.end }
            : {},
      };

      const res = await fetch("/api/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Gagal menyimpan preferensi notifikasi.");
      }

      toast.success("Saluran peringatan & notifikasi admin berhasil disimpan.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan preferensi."
      );
    } finally {
      setSavingNotif(false);
    }
  };

  // ── Console Preferences State ───────────────────────────────────────────────
  const [consolePrefs, setConsolePrefs] = useState<AdminConsolePrefs>(() => {
    if (typeof window === "undefined") return DEFAULT_CONSOLE_PREFS;
    try {
      const stored = localStorage.getItem(ADMIN_CONSOLE_STORAGE_KEY);
      if (stored) return { ...DEFAULT_CONSOLE_PREFS, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_CONSOLE_PREFS;
  });

  const updateConsolePref = <K extends keyof AdminConsolePrefs>(
    key: K,
    value: AdminConsolePrefs[K]
  ) => {
    const next = { ...consolePrefs, [key]: value };
    setConsolePrefs(next);
    try {
      localStorage.setItem(ADMIN_CONSOLE_STORAGE_KEY, JSON.stringify(next));
      toast.success("Preferensi konsol operasional diperbarui.");
    } catch {
      toast.error("Gagal menyimpan preferensi konsol ke peramban.");
    }
  };

  const adminEmail = user?.email || "superadmin@talentnetwork.id";

  return (
    <div className="space-y-6 pb-12">
      {/* ── Mobile Segmented Tab Bar (< md) ── */}
      <div className="flex md:hidden overflow-x-auto gap-1.5 border-b border-slate-200 pb-2 -mx-4 px-4 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => changeTab(item.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors",
                active
                  ? "bg-purple-50 text-[#7C3AED] border border-purple-200 shadow-2xs"
                  : "text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
              )}
            >
              <Icon className="size-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Desktop 2-Column Responsive Layout ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Navigation Rail (Desktop >= md) */}
        <aside className="hidden md:block md:col-span-4 lg:col-span-4 sticky top-24">
          <nav
            aria-label="Menu Pengaturan Admin"
            className="rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs space-y-1"
          >
            <div className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Kategori Pengaturan
            </div>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => changeTab(item.id)}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all border",
                    active
                      ? "bg-purple-50/80 border-purple-200 text-[#7C3AED] font-bold shadow-2xs"
                      : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg transition-colors",
                        active
                          ? "bg-[#7C3AED] text-white shadow-2xs"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800"
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{item.label}</p>
                      <p
                        className={cn(
                          "text-[11px]",
                          active ? "text-purple-600/80" : "text-slate-400"
                        )}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      "size-4 transition-transform",
                      active
                        ? "text-[#7C3AED] translate-x-0.5"
                        : "text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5"
                    )}
                  />
                </button>
              );
            })}
          </nav>

          {/* Quick System Status Card */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>Otoritas Keamanan Aktif</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Semua tindakan administratif yang dilakukan di dalam konsol ini tercatat secara otomatis pada log audit sistem tak terhapus.
            </p>
          </div>
        </aside>

        {/* Right Settings Content Area */}
        <main className="md:col-span-8 lg:col-span-8 space-y-6">
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: AKSESIBILITAS & TAMPILAN                                   */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "accessibility" && (
            <div className="space-y-6">
              <AccessibilitySettings
                titleClassName="text-slate-900"
                descriptionClassName="text-slate-500"
                cardTitleClassName="text-slate-900"
              />
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: PROFIL & IDENTITAS ADMIN                                   */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  Profil &amp; Identitas Administrator
                </h2>
                <p className="text-xs text-slate-500">
                  Data pengenal akun administrator yang digunakan dalam korespondensi resmi dan audit sistem.
                </p>
              </div>

              {/* Form Data Admin */}
              <Card className="border-slate-200 bg-white shadow-2xs">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                        <User className="size-4 text-[#7C3AED]" />
                        Identitas Administrator
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Informasi pribadi perwakilan akun administrator.
                      </CardDescription>
                    </div>
                    <Badge className="bg-purple-100 text-[#7C3AED] hover:bg-purple-100 border-purple-200">
                      Level 3 · Full Privileges
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Nama Tampilan */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="admin-name"
                          className="text-xs font-semibold text-slate-800"
                        >
                          Nama Lengkap Administrator
                        </label>
                        <Input
                          id="admin-name"
                          type="text"
                          value={profileForm.displayName}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, displayName: e.target.value })
                          }
                          placeholder="Contoh: Ariel Superadmin"
                          className="h-9 text-xs"
                          disabled={loadingProfile}
                          required
                        />
                      </div>

                      {/* Nomor Telepon / Kontak */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="admin-phone"
                          className="text-xs font-semibold text-slate-800"
                        >
                          Nomor Telepon Operasional
                        </label>
                        <Input
                          id="admin-phone"
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, phone: e.target.value })
                          }
                          placeholder="Contoh: +62 812-3456-7890"
                          className="h-9 text-xs"
                          disabled={loadingProfile}
                        />
                      </div>

                      {/* Email (Readonly) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-800">
                          Alamat Email Resmi (Sesi Login)
                        </label>
                        <div className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600">
                          <span className="truncate">{adminEmail}</span>
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            Terverifikasi
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Alamat email dikaitkan secara ketat dengan kredensial sistem.
                        </p>
                      </div>

                      {/* Departemen / Bidang Kerja */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="admin-dept"
                          className="text-xs font-semibold text-slate-800"
                        >
                          Divisi &amp; Tanggung Jawab
                        </label>
                        <Input
                          id="admin-dept"
                          type="text"
                          value={profileForm.department}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, department: e.target.value })
                          }
                          placeholder="Divisi Operasional & Kepatuhan"
                          className="h-9 text-xs"
                          disabled={loadingProfile}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <Button
                        type="submit"
                        disabled={savingProfile || loadingProfile}
                        size="sm"
                        className="gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-xs text-white"
                      >
                        {savingProfile ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Save className="size-3.5" />
                        )}
                        <span>{savingProfile ? "Menyimpan..." : "Simpan Profil Admin"}</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Detail Otoritas & Sesi Keamanan */}
              <Card className="border-slate-200 bg-white shadow-2xs">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                    <ShieldCheck className="size-4 text-emerald-600" />
                    Otoritas &amp; Hak Akses Konsol
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tingkat hak istimewa yang diberikan pada sesi Anda saat ini.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-1">
                      <p className="font-semibold text-slate-800">Peran Sistem</p>
                      <p className="text-slate-600 font-mono text-[11px]">ADMINISTRATOR (Super)</p>
                      <p className="text-[11px] text-slate-400">Akses tak terbatas ke seluruh modul audit, verifikasi & finansial.</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-1">
                      <p className="font-semibold text-slate-800">Status Gerbang Keamanan</p>
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        <span>Admin Gate Passed</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Verifikasi otentikasi level command center berhasil.</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3.5 text-xs text-slate-700 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-[#7C3AED]">
                      <Info className="size-4" />
                      <span>Kepatuhan Audit &amp; Keamanan Data</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Sesuai protokol integritas platform Talent Network, tindakan destruktif akun pengguna superadmin dilindungi oleh kebijakan tata kelola server dan tidak dapat dimusnahkan secara mandiri dari konsol.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: NOTIFIKASI & PERINGATAN SISTEM                              */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  Notifikasi &amp; Peringatan Operasional
                </h2>
                <p className="text-xs text-slate-500">
                  Kelola saluran pemberitahuan peristiwa penting platform dan atur jadwal jam tenang.
                </p>
              </div>

              <form onSubmit={handleSaveNotifPrefs} className="space-y-6">
                {/* Saluran Pengiriman */}
                <Card className="border-slate-200 bg-white shadow-2xs">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                      <Bell className="size-4 text-[#7C3AED]" />
                      Saluran Pemberitahuan Admin
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Pilih kanal di mana Anda ingin menerima pemberitahuan operasional.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    {/* In-App Toggle */}
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="space-y-0.5">
                        <label
                          htmlFor="admin-toggle-in-app"
                          className="text-xs font-semibold text-slate-800 cursor-pointer"
                        >
                          Notifikasi Dalam Aplikasi (In-App Lonceng)
                        </label>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Tampilkan badge merah dan daftar notifikasi saat ada pengajuan verifikasi baru atau tiket penyesuaian kuota token.
                        </p>
                      </div>
                      <ToggleSwitch
                        id="admin-toggle-in-app"
                        label="Notifikasi dalam aplikasi"
                        checked={notifPrefs.inAppEnabled}
                        onChange={(checked) =>
                          setNotifPrefs({ ...notifPrefs, inAppEnabled: checked })
                        }
                      />
                    </div>

                    {/* Email Toggle */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <label
                          htmlFor="admin-toggle-email"
                          className="text-xs font-semibold text-slate-800 cursor-pointer"
                        >
                          Pemberitahuan Email Kritis
                        </label>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Kirimkan email darurat ke <span className="font-semibold text-slate-700">{adminEmail}</span> ketika terjadi anomali sistem atau ringkasan mingguan.
                        </p>
                      </div>
                      <ToggleSwitch
                        id="admin-toggle-email"
                        label="Notifikasi email"
                        checked={notifPrefs.emailEnabled}
                        onChange={(checked) =>
                          setNotifPrefs({ ...notifPrefs, emailEnabled: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Kategori Peringatan Khusus */}
                <Card className="border-slate-200 bg-white shadow-2xs">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                      <SlidersHorizontal className="size-4 text-[#7C3AED]" />
                      Jenis Kejadian yang Dipantau
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Pilih kategori peringatan penting yang memicu alarm pemberitahuan.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    <div className="flex items-start justify-between gap-4 pb-3.5 border-b border-slate-100">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-800">
                          Pengajuan Dokumen Verifikasi Baru
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Peringatkan segera saat ada entitas bisnis mengunggah berkas legalitas NIB/NPWP.
                        </p>
                      </div>
                      <ToggleSwitch
                        id="sub-verification"
                        label="Peringatan verifikasi"
                        checked={adminAlertSubscriptions.verificationAlert}
                        onChange={(val) =>
                          setAdminAlertSubscriptions((prev) => ({
                            ...prev,
                            verificationAlert: val,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4 pb-3.5 border-b border-slate-100">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-800">
                          Batas Kuota Token Menipis
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Beri tahu saat saldo token suatu perusahaan bernilai kurang dari 5 token.
                        </p>
                      </div>
                      <ToggleSwitch
                        id="sub-tokens"
                        label="Peringatan kuota token"
                        checked={adminAlertSubscriptions.lowTokenAlert}
                        onChange={(val) =>
                          setAdminAlertSubscriptions((prev) => ({
                            ...prev,
                            lowTokenAlert: val,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-800">
                          Anomali Log Audit &amp; Keamanan
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Deteksi upaya akses tidak wajar atau kegagalan autentikasi berulang.
                        </p>
                      </div>
                      <ToggleSwitch
                        id="sub-security"
                        label="Peringatan anomali keamanan"
                        checked={adminAlertSubscriptions.securityAnomalies}
                        onChange={(val) =>
                          setAdminAlertSubscriptions((prev) => ({
                            ...prev,
                            securityAnomalies: val,
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Jam Tenang (Quiet Hours) */}
                <Card className="border-slate-200 bg-white shadow-2xs">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                      <Clock className="size-4 text-[#7C3AED]" />
                      Jam Tenang (Quiet Hours)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Tunda notifikasi non-darurat pada jam istirahat agar tidak mengganggu (format 24 jam).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="admin-quiet-start"
                          className="text-xs font-semibold text-slate-800"
                        >
                          Mulai Jam Tenang
                        </label>
                        <input
                          id="admin-quiet-start"
                          type="time"
                          value={notifPrefs.quietHours.start}
                          onChange={(e) =>
                            setNotifPrefs({
                              ...notifPrefs,
                              quietHours: { ...notifPrefs.quietHours, start: e.target.value },
                            })
                          }
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono shadow-2xs outline-none transition focus-visible:border-[#7C3AED] focus-visible:ring-2 focus-visible:ring-purple-200"
                        />
                        <p className="text-[11px] text-slate-400">Contoh: 22:00 WIB</p>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="admin-quiet-end"
                          className="text-xs font-semibold text-slate-800"
                        >
                          Selesai Jam Tenang
                        </label>
                        <input
                          id="admin-quiet-end"
                          type="time"
                          value={notifPrefs.quietHours.end}
                          onChange={(e) =>
                            setNotifPrefs({
                              ...notifPrefs,
                              quietHours: { ...notifPrefs.quietHours, end: e.target.value },
                            })
                          }
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono shadow-2xs outline-none transition focus-visible:border-[#7C3AED] focus-visible:ring-2 focus-visible:ring-purple-200"
                        />
                        <p className="text-[11px] text-slate-400">Contoh: 07:00 WIB</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    disabled={savingNotif}
                    size="sm"
                    className="gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-xs text-white"
                  >
                    {savingNotif ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    <span>{savingNotif ? "Menyimpan..." : "Simpan Preferensi Notifikasi"}</span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: PREFERENSI OPERASIONAL KONSOL                              */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "console" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  Preferensi Konsol &amp; Operasional
                </h2>
                <p className="text-xs text-slate-500">
                  Sesuaikan perilaku pembaruan data otomatis, ukuran tabel bawaan, dan perlindungan tindakan kritis.
                </p>
              </div>

              {/* Interval Auto-Refresh */}
              <Card className="border-slate-200 bg-white shadow-2xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 text-[#7C3AED]">
                      <RefreshCw className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900">
                        Interval Pembaruan Data Otomatis (Auto-Refresh)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Pilih seberapa sering dashboard dan halaman pemantauan memuat ulang data terbaru.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { id: 0, label: "Manual Saja", desc: "Pembaruan tombol klik" },
                      { id: 30, label: "30 Detik", desc: "Sangat responsif" },
                      { id: 60, label: "1 Menit", desc: "Disarankan (Normal)" },
                      { id: 300, label: "5 Menit", desc: "Hemat lalu lintas data" },
                    ].map((opt) => {
                      const active = consolePrefs.dashboardAutoRefresh === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updateConsolePref("dashboardAutoRefresh", opt.id)}
                          className={cn(
                            "flex flex-col items-start rounded-xl border p-3 text-left transition-all",
                            active
                              ? "border-[#7C3AED] bg-purple-50/60 ring-2 ring-purple-200"
                              : "border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                            {active && <Check className="size-3.5 text-[#7C3AED]" />}
                          </div>
                          <span className="mt-1 text-[11px] text-slate-500">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Ukuran Tabel & Konfirmasi Kritis */}
              <Card className="border-slate-200 bg-white shadow-2xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <SlidersHorizontal className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900">
                        Perilaku Tabel &amp; Proteksi Tindakan
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Pengaturan jumlah data per halaman dan dialog konfirmasi aksi sensitif.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="divide-y divide-slate-100">
                  {/* Default Pagination */}
                  <div className="flex items-center justify-between py-3.5">
                    <div className="space-y-0.5 pr-4">
                      <p className="text-xs font-semibold text-slate-800">
                        Jumlah Baris Data Bawaan (Default Table Page Size)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Batas entri log audit dan daftar perusahaan yang dimuat sekaligus.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[10, 25, 50, 100].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => updateConsolePref("defaultPageSize", size)}
                          className={cn(
                            "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all border",
                            consolePrefs.defaultPageSize === size
                              ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-2xs"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Confirm Critical Actions */}
                  <div className="flex items-center justify-between py-3.5">
                    <div className="space-y-0.5 pr-4">
                      <p className="text-xs font-semibold text-slate-800">
                        Dialog Konfirmasi Tindakan Kritis (Action Guard)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Wajibkan konfirmasi modal sebelum menyetujui, menolak perusahaan, atau menyesuaikan kuota token.
                      </p>
                    </div>
                    <ToggleSwitch
                      id="pref-confirm"
                      label="Konfirmasi tindakan kritis"
                      checked={consolePrefs.confirmCriticalActions}
                      onChange={(val) => updateConsolePref("confirmCriticalActions", val)}
                    />
                  </div>

                  {/* Zona Waktu Display */}
                  <div className="flex items-center justify-between py-3.5">
                    <div className="space-y-0.5 pr-4">
                      <p className="text-xs font-semibold text-slate-800">
                        Zona Waktu Referensi Sistem
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Format cap waktu yang digunakan pada bilah atas konsol dan tabel log audit.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(["WIB", "WITA", "WIT"] as const).map((tz) => (
                        <button
                          key={tz}
                          type="button"
                          onClick={() => updateConsolePref("timezone", tz)}
                          className={cn(
                            "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all border",
                            consolePrefs.timezone === tz
                              ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-2xs"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {tz}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
