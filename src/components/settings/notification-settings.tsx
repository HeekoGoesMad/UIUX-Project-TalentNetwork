"use client";

import { useEffect, useState } from "react";
import { Bell, Clock, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NotificationPrefs = {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  quietHours: {
    start?: string;
    end?: string;
  };
};

type NotificationSettingsProps = {
  initialPreferences?: NotificationPrefs | null;
  role?: "candidate" | "recruiter";
};

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

export function NotificationSettings({
  initialPreferences,
  role = "candidate",
}: NotificationSettingsProps) {
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(
    initialPreferences ?? {
      inAppEnabled: true,
      emailEnabled: true,
      quietHours: { start: "", end: "" },
    }
  );
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  // Client-side fallback fetch only if initial data was not provided during SSR
  useEffect(() => {
    if (initialPreferences) return;

    let isMounted = true;
    async function loadFallbackData() {
      try {
        const res = await fetch("/api/notification-preferences");
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          if (data?.preferences) {
            setNotifPrefs({
              inAppEnabled: data.preferences.inAppEnabled ?? true,
              emailEnabled: data.preferences.emailEnabled ?? true,
              quietHours: {
                start: data.preferences.quietHours?.start || "",
                end: data.preferences.quietHours?.end || "",
              },
            });
          }
        }
      } catch (err) {
        console.warn("Gagal memuat preferensi notifikasi:", err);
      }
    }

    loadFallbackData();
    return () => {
      isMounted = false;
    };
  }, [initialPreferences]);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Notifikasi &amp; Privasi
        </h2>
        <p className="text-xs text-muted-foreground">
          {role === "recruiter"
            ? "Kelola preferensi pemberitahuan pelamar masuk, pesan kandidat, dan rentang jam tenang."
            : "Kelola preferensi pemberitahuan tawaran screening, pesan rekruter, dan rentang jam tenang."}
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
                  {role === "recruiter"
                    ? "Tampilkan lencana dan notifikasi lonceng di bilah navigasi atas saat ada pelamar atau kabar baru."
                    : "Tampilkan lencana dan notifikasi lonceng di bilah navigasi atas saat ada tawaran atau kabar baru."}
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
  );
}
