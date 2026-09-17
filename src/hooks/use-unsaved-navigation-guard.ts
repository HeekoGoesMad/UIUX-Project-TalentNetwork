"use client";

import { useEffect, useRef } from "react";

interface UseUnsavedNavigationGuardOptions {
  isDirty: boolean;
  onBlocked: () => void;
}

/**
 * Custom hook that intercepts any navigation attempt when unsaved changes exist:
 * 1. Captures link clicks (internal/external Next.js navigation) before router takes over.
 * 2. Traps browser Back / Forward buttons and physical mouse Back / Forward buttons via History API (`popstate`) and mouse events (`auxclick`).
 * 3. Traps keyboard history shortcuts (`Alt + Left/Right`).
 * 4. Displays native confirmation on tab close / reload (`beforeunload`).
 */
export function useUnsavedNavigationGuard({
  isDirty,
  onBlocked,
}: UseUnsavedNavigationGuardOptions) {
  const isDirtyRef = useRef(isDirty);
  const onBlockedRef = useRef(onBlocked);
  const guardPushedRef = useRef(false);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    onBlockedRef.current = onBlocked;
  }, [onBlocked]);

  // Manage History API state trap for Back / Forward navigation
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isDirty) {
      if (!guardPushedRef.current) {
        window.history.pushState({ cvUnsavedGuard: true }, "", window.location.href);
        guardPushedRef.current = true;
      }
    } else {
      if (guardPushedRef.current) {
        guardPushedRef.current = false;
        if (window.history.state?.cvUnsavedGuard) {
          window.history.back();
        }
      }
    }
  }, [isDirty]);

  // Clean up guard state on component unmount
  useEffect(() => {
    return () => {
      if (guardPushedRef.current && typeof window !== "undefined") {
        guardPushedRef.current = false;
        if (window.history.state?.cvUnsavedGuard) {
          window.history.back();
        }
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Intercept link and anchor clicks
    const handleDocumentClick = (e: MouseEvent) => {
      if (!isDirtyRef.current) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Allow all interactions inside the floating unsaved bar (e.g. Save, Reset)
      if (target.closest("[data-cv-unsaved-bar]")) {
        return;
      }

      // Check if clicked element is or is within an <a> tag
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore hash links and protocols on the same page
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      try {
        const destination = new URL(anchor.href, window.location.href);
        // If navigating to the exact same page path and search, allow (e.g. in-page anchors)
        if (
          destination.origin === window.location.origin &&
          destination.pathname === window.location.pathname &&
          destination.search === window.location.search
        ) {
          return;
        }

        // Block navigation attempt
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Abort any progress bar animation
        window.dispatchEvent(new CustomEvent("navigation-abort"));

        // Trigger blocked callback (Discord vibration & danger feedback)
        onBlockedRef.current();
      } catch {
        // Ignore malformed URLs
      }
    };

    // 2. Intercept History popstate (Browser Back / Forward, mouse back/forward)
    const handlePopState = () => {
      if (!isDirtyRef.current) return;

      // Re-push current state to prevent navigating back/forward
      window.history.pushState({ cvUnsavedGuard: true }, "", window.location.href);
      guardPushedRef.current = true;

      window.dispatchEvent(new CustomEvent("navigation-abort"));
      onBlockedRef.current();
    };

    // 3. Intercept physical mouse back (button 3) and forward (button 4)
    const handleMouseAux = (e: MouseEvent) => {
      if (!isDirtyRef.current) return;
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        window.dispatchEvent(new CustomEvent("navigation-abort"));
        onBlockedRef.current();
      }
    };

    // 4. Intercept keyboard history navigation shortcuts (Alt + ArrowLeft / Alt + ArrowRight)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDirtyRef.current) return;
      if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        window.dispatchEvent(new CustomEvent("navigation-abort"));
        onBlockedRef.current();
      }
    };

    // 5. Native browser tab close / reload protection
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("auxclick", handleMouseAux, { capture: true });
    window.addEventListener("mouseup", handleMouseAux, { capture: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("auxclick", handleMouseAux, { capture: true });
      window.removeEventListener("mouseup", handleMouseAux, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
}
