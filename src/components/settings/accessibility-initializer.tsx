"use client";

import { useEffect } from "react";
import { useApp } from "@/providers/app-provider";

export type AccessibilityPreferences = {
  textScale: "normal" | "large" | "xlarge";
  highContrast: boolean;
  reduceMotion: boolean;
  enhancedFocus: boolean;
  relaxedSpacing: boolean;
};

export const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  textScale: "normal",
  highContrast: false,
  reduceMotion: false,
  enhancedFocus: false,
  relaxedSpacing: false,
};

export function getUserStorageKey(email?: string | null) {
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
