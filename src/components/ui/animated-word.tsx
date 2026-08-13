"use client";

import { useEffect, useState } from "react";

const WORDS = ["tepat.", "terverifikasi.", "relevan.", "handal."];

export function AnimatedWord() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % WORDS.length);
        setFade(true);
      }, 250);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="relative inline-flex items-center align-baseline min-w-[170px] sm:min-w-[310px] pb-1">
      <span
        className={`bg-gradient-to-r from-[#A78BFA] via-[#C084FC] to-[#EC4899] bg-clip-text text-transparent transition-all duration-300 transform ${
          fade ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95"
        }`}
      >
        {WORDS[index]}
      </span>
    </span>
  );
}
