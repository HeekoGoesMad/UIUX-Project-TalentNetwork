"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const trickleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNavigatingRef = useRef(false);

  const clearTimers = () => {
    if (trickleTimerRef.current) {
      clearInterval(trickleTimerRef.current);
      trickleTimerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startProgress = () => {
    clearTimers();
    isNavigatingRef.current = true;
    setVisible(true);
    setProgress(0.18);

    // Trickle progress from 18% up to ~85% while waiting for the route to commit
    trickleTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 0.85) return prev;
        const delta = Math.random() * (0.85 - prev) * 0.35 + 0.02;
        return Math.min(prev + delta, 0.88);
      });
    }, 180);

    // Failsafe: abort after 8 seconds if navigation never resolves
    timeoutRef.current = setTimeout(() => {
      completeProgress();
    }, 8000);
  };

  const completeProgress = () => {
    clearTimers();
    isNavigatingRef.current = false;
    setProgress(1);

    // Allow the 100% scale to paint smoothly, then fade out
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      timeoutRef.current = setTimeout(() => {
        setProgress(0);
      }, 300);
    }, 200);
  };

  // Trigger completion whenever pathname or searchParams change (navigation committed)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      completeProgress();
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Initial mount sweep animation on first load
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      startProgress();
    });
    const initialTimer = setTimeout(() => {
      completeProgress();
    }, 400);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(initialTimer);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global link click interceptor for instant feedback before Next.js commits the route
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const targetAttr = anchor.getAttribute("target");
      if (targetAttr && targetAttr !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
        return;
      }

      try {
        const destination = new URL(anchor.href, window.location.href);
        // Only trigger for same-origin navigations
        if (destination.origin !== window.location.origin) return;

        // Skip if navigating to the exact same URL + hash
        const isSameUrl =
          destination.pathname === window.location.pathname &&
          destination.search === window.location.search &&
          destination.hash === window.location.hash;
        if (isSameUrl) return;

        // Skip internal hash jumps on same page
        if (destination.pathname === window.location.pathname && destination.search === window.location.search && destination.hash) {
          return;
        }

        startProgress();
      } catch {
        // Ignore malformed URLs
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      aria-hidden={!visible}
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="pointer-events-none fixed top-0 left-0 right-0 z-[99999] h-[2.5px] overflow-hidden bg-transparent transition-opacity duration-250 ease-in"
      style={{
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className="h-full w-full bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#A855F7] shadow-[0_0_10px_rgba(124,58,237,0.7),0_0_5px_rgba(99,102,241,0.5)] transition-transform duration-200 ease-out"
        style={{
          transform: `scaleX(${progress})`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        {/* Glow peg at leading edge */}
        <div
          className="absolute top-0 right-0 h-full w-20 shadow-[0_0_12px_#A855F7,0_0_6px_#7C3AED]"
          style={{
            transform: "rotate(3deg) translate(0px, -2px)",
          }}
        />
      </div>
    </div>
  );
}

export function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
