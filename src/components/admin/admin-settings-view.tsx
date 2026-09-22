"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sliders,
  SlidersHorizontal,
  ChevronRight,
  RefreshCw,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AccessibilitySettings } from "@/components/settings/accessibility-settings";
import { cn } from "@/lib/utils";

export type AdminSettingsTab = "accessibility" | "console";

const TAB_PARAM_MAP: Record<AdminSettingsTab, string> = {
  accessibility: "a11y",
  console: "console",
};

function parseTab(param: string | null): AdminSettingsTab {
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
          {/* TAB 2: PREFERENSI OPERASIONAL KONSOL                              */}
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
