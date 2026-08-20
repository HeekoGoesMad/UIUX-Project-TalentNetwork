"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show scroll to top button after scrolling down past 450px (~2 scroll turns)
      if (window.scrollY > 450) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Kembali ke atas"
      className={cn(
        "fixed bottom-6 right-6 z-50 flex size-12 items-center justify-center rounded-full bg-[#201C45]/90 text-white shadow-2xl backdrop-blur-xl border border-white/20 transition-all duration-500 ease-in-out group cursor-pointer",
        showScrollTop
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto hover:scale-110 hover:bg-[#7C3AED] hover:border-white/40"
          : "opacity-0 translate-y-6 scale-75 pointer-events-none"
      )}
    >
      <ChevronUp className="size-6 transition-transform group-hover:-translate-y-0.5" />
    </button>
  );
}
