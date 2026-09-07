"use client";

import { useEffect, useState } from "react";
import {
  Type,
  Contrast,
  RotateCcw,
  Check,
  MousePointerClick,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useApp } from "@/providers/app-provider";

export type AccessibilityPreferences = {
  textScale: "normal" | "large" | "xlarge";
  highContrast: boolean;
  reduceMotion: boolean;
  enhancedFocus: boolean;
  relaxedSpacing: boolean;
};

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  textScale: "normal",
  highContrast: false,
  reduceMotion: false,
  enhancedFocus: false,
  relaxedSpacing: false,
};

function getUserStorageKey(email?: string | null) {
  if (!email) return null;
  return `proofylink-a11y-prefs:${email.trim().toLowerCase()}`;
}

export function applyAccessibilityToDOM(prefs: AccessibilityPreferences) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Text Scale
  if (prefs.textScale === "normal") {
    root.removeAttribute("data-text-scale");
  } else {
    root.setAttribute("data-text-scale", prefs.textScale);
  }

  // High Contrast
  if (prefs.highContrast) {
    root.setAttribute("data-high-contrast", "true");
  } else {
    root.removeAttribute("data-high-contrast");
  }

  // Reduce Motion
  if (prefs.reduceMotion) {
    root.setAttribute("data-reduce-motion", "true");
  } else {
    root.removeAttribute("data-reduce-motion");
  }

  // Enhanced Focus
  if (prefs.enhancedFocus) {
    root.setAttribute("data-enhanced-focus", "true");
  } else {
    root.removeAttribute("data-enhanced-focus");
  }

  // Relaxed Spacing
  if (prefs.relaxedSpacing) {
    root.setAttribute("data-relaxed-spacing", "true");
  } else {
    root.removeAttribute("data-relaxed-spacing");
  }
}

export function AccessibilityInitializer() {
  const { user, hydrated } = useApp();

  useEffect(() => {
    // Purge legacy un-namespaced key so it doesn't pollute any account
    try {
      localStorage.removeItem("proofylink-a11y-prefs");
    } catch {}

    if (!hydrated) return;

    if (!user || !user.email) {
      // Guest or logged out: always apply default preferences
      applyAccessibilityToDOM(DEFAULT_PREFERENCES);
      return;
    }

    const userKey = getUserStorageKey(user.email);
    if (!userKey) return;

    // 1. Initial application from this specific user's local storage
    try {
      const stored = localStorage.getItem(userKey);
      if (stored) {
        applyAccessibilityToDOM({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
      } else {
        // If this user has no local preferences, enforce default
        applyAccessibilityToDOM(DEFAULT_PREFERENCES);
      }
    } catch {
      applyAccessibilityToDOM(DEFAULT_PREFERENCES);
    }

    // 2. Fetch from user metadata in Supabase
    fetch("/api/user/accessibility")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.preferences) {
          const serverPrefs = { ...DEFAULT_PREFERENCES, ...data.preferences };
          applyAccessibilityToDOM(serverPrefs);
          try {
            localStorage.setItem(userKey, JSON.stringify(serverPrefs));
          } catch {}
        } else if (data && data.preferences === null) {
          // If this account hasn't configured accessibility, strictly enforce default
          applyAccessibilityToDOM(DEFAULT_PREFERENCES);
          try {
            localStorage.removeItem(userKey);
          } catch {}
        }
      })
      .catch(() => {});

    // 3. Listen to local custom events for instant updates within the same user session
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ email?: string; prefs: AccessibilityPreferences }>;
      if (customEvent.detail?.prefs) {
        if (!customEvent.detail.email || customEvent.detail.email.toLowerCase() === user.email.toLowerCase()) {
          applyAccessibilityToDOM(customEvent.detail.prefs);
        }
      }
    };
    window.addEventListener("proofylink-a11y-changed", handleSync);
    return () => window.removeEventListener("proofylink-a11y-changed", handleSync);
  }, [user, hydrated]);

  return null;
}

export function AccessibilitySettings() {
  const { user } = useApp();
  const userKey = getUserStorageKey(user?.email);

  const [prefs, setPrefs] = useState<AccessibilityPreferences>(() => {
    if (typeof window === "undefined" || !userKey) return DEFAULT_PREFERENCES;
    try {
      const stored = localStorage.getItem(userKey);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_PREFERENCES;
  });

  // Sync with server when user changes or on mount
  useEffect(() => {
    if (!userKey) {
      applyAccessibilityToDOM(DEFAULT_PREFERENCES);
      return;
    }

    let active = true;
    fetch("/api/user/accessibility")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.preferences) {
          const merged = { ...DEFAULT_PREFERENCES, ...data.preferences };
          setPrefs(merged);
          applyAccessibilityToDOM(merged);
          try {
            localStorage.setItem(userKey, JSON.stringify(merged));
          } catch {}
        } else if (data && data.preferences === null) {
          setPrefs(DEFAULT_PREFERENCES);
          applyAccessibilityToDOM(DEFAULT_PREFERENCES);
          try {
            localStorage.removeItem(userKey);
          } catch {}
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [userKey]);

  useEffect(() => {
    applyAccessibilityToDOM(prefs);
  }, [prefs]);

  const updatePreference = <K extends keyof AccessibilityPreferences>(
    key: K,
    val: AccessibilityPreferences[K]
  ) => {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    applyAccessibilityToDOM(updated);

    if (userKey) {
      try {
        localStorage.setItem(userKey, JSON.stringify(updated));
        window.dispatchEvent(
          new CustomEvent("proofylink-a11y-changed", {
            detail: { email: user?.email, prefs: updated },
          })
        );
      } catch {
        // ignore
      }
    }

    // Persist to server (user_metadata)
    fetch("/api/user/accessibility", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    }).catch(() => {});

    toast.success("Preferensi aksesibilitas diperbarui.");
  };

  const handleReset = () => {
    setPrefs(DEFAULT_PREFERENCES);
    applyAccessibilityToDOM(DEFAULT_PREFERENCES);

    if (userKey) {
      try {
        localStorage.removeItem(userKey);
        window.dispatchEvent(
          new CustomEvent("proofylink-a11y-changed", {
            detail: { email: user?.email, prefs: DEFAULT_PREFERENCES },
          })
        );
      } catch {
        // ignore
      }
    }

    // Persist reset to server
    fetch("/api/user/accessibility", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(DEFAULT_PREFERENCES),
    }).catch(() => {});

    toast.info("Preferensi aksesibilitas dikembalikan ke bawaan.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Aksesibilitas &amp; Tampilan
          </h2>
          <p className="text-sm text-muted-foreground">
            Sesuaikan kenyamanan visual dan interaksi platform sesuai preferensi Anda.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="self-start gap-1.5 text-xs sm:self-auto"
        >
          <RotateCcw className="size-3.5" />
          Reset ke Bawaan
        </Button>
      </div>

      <div className="grid gap-5">
        {/* Ukuran Teks (Text Scaling) */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Type className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base">Ukuran Teks</CardTitle>
                <CardDescription className="text-xs">
                  Atur skala keterbacaan teks di seluruh antarmuka workspace.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { id: "normal" as const, label: "Standar (100%)", desc: "Ukuran bawaan sistem", size: "text-sm" },
                { id: "large" as const, label: "Sedang (106.25%)", desc: "Teks sedikit lebih besar", size: "text-base" },
                { id: "xlarge" as const, label: "Besar (112.5%)", desc: "Sangat mudah dibaca", size: "text-lg" },
              ].map((opt) => {
                const active = prefs.textScale === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updatePreference("textScale", opt.id)}
                    className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                      active
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className={`font-semibold text-foreground ${opt.size}`}>
                        Aa
                      </span>
                      {active && <Check className="size-4 text-primary" />}
                    </div>
                    <span className="mt-2 text-xs font-semibold text-foreground">{opt.label}</span>
                    <span className="text-[11px] text-muted-foreground">{opt.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Live Preview Box */}
            <div className="rounded-lg border bg-slate-50/70 p-3.5 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Pratinjau Teks:</p>
              <p className="mt-1">
                ProofyLink memudahkan verifikasi keabsahan portofolio dan pencarian talent berkualitas dengan kepatuhan data.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mode Kontras Tinggi & Tampilan Visual */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Contrast className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base">Kenyamanan Visual &amp; Kontras</CardTitle>
                <CardDescription className="text-xs">
                  Opsi untuk mempertegas batas elemen dan jarak baca.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border/60">
            {/* High Contrast */}
            <div className="flex items-center justify-between py-3.5">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-semibold text-foreground">Kontras Tinggi (High Contrast)</p>
                <p className="text-xs text-muted-foreground">
                  Mempertegas garis tepi card, tombol, dan warna teks untuk visibilitas optimal.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.highContrast}
                onClick={() => updatePreference("highContrast", !prefs.highContrast)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  prefs.highContrast ? "bg-primary" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    prefs.highContrast ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Relaxed Spacing */}
            <div className="flex items-center justify-between py-3.5">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-semibold text-foreground">Jarak Baca Renggang (Relaxed Spacing)</p>
                <p className="text-xs text-muted-foreground">
                  Menambah jarak spasi antar huruf dan baris untuk kenyamanan pembaca dengan disleksia.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.relaxedSpacing}
                onClick={() => updatePreference("relaxedSpacing", !prefs.relaxedSpacing)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  prefs.relaxedSpacing ? "bg-primary" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    prefs.relaxedSpacing ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Gerakan & Navigasi Keyboard */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <MousePointerClick className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base">Interaksi &amp; Gerakan (Motion)</CardTitle>
                <CardDescription className="text-xs">
                  Kontrol animasi transisi dan navigasi keyboard ramah disabilitas.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border/60">
            {/* Reduce Motion */}
            <div className="flex items-center justify-between py-3.5">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-semibold text-foreground">Kurangi Animasi &amp; Efek Gerak (Reduce Motion)</p>
                <p className="text-xs text-muted-foreground">
                  Mematikan efek transisi dan gerakan halaman bagi pengguna yang sensitif terhadap pergerakan.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.reduceMotion}
                onClick={() => updatePreference("reduceMotion", !prefs.reduceMotion)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  prefs.reduceMotion ? "bg-primary" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    prefs.reduceMotion ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Enhanced Focus Ring */}
            <div className="flex items-center justify-between py-3.5">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-semibold text-foreground">Indikator Fokus Jelas (WCAG Focus Ring)</p>
                <p className="text-xs text-muted-foreground">
                  Memberikan garis batas fokus tebal saat bernavigasi menggunakan tombol Tab di keyboard.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.enhancedFocus}
                onClick={() => updatePreference("enhancedFocus", !prefs.enhancedFocus)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  prefs.enhancedFocus ? "bg-primary" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    prefs.enhancedFocus ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
