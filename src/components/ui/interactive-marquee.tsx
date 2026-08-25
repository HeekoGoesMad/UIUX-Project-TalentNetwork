"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InteractiveMarqueeProps {
  children: ReactNode;
  className?: string;
  speed?: number; // base speed in px per frame (default 0.7)
  hoverSpeed?: number; // slowed speed when hovered (default 0.15)
}

export function InteractiveMarquee({
  children,
  className,
  speed = 0.7,
  hoverSpeed = 0.15,
}: InteractiveMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const singleContentRef = useRef<HTMLDivElement>(null);

  const offsetRef = useRef(0);
  const currentSpeedRef = useRef(speed);
  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);
  const startXRef = useRef(0);
  const [isDraggingState, setIsDraggingState] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = mediaQuery.matches;
    const handleChange = (event: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = event.matches;
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let isVisible = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    const animate = () => {
      if (isVisible) {
        const singleWidth = singleContentRef.current?.offsetWidth || 0;

        if (!isDraggingRef.current && !prefersReducedMotionRef.current) {
          // Smoothly interpolate speed on hover / unhover to prevent any visual jumps
          const targetSpeed = isHoveredRef.current ? hoverSpeed : speed;
          currentSpeedRef.current += (targetSpeed - currentSpeedRef.current) * 0.08;
          offsetRef.current -= currentSpeedRef.current;
        }

        // Infinite loop wrap math (seamless wrapping with zero offset)
        if (singleWidth > 0) {
          if (offsetRef.current <= -singleWidth) {
            offsetRef.current += singleWidth;
          } else if (offsetRef.current > 0) {
            offsetRef.current -= singleWidth;
          }
        }

        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [speed, hoverSpeed]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    setIsDraggingState(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    startXRef.current = e.clientX;
    offsetRef.current += deltaX;
  };

  const handleMouseUpOrLeave = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDraggingState(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      startXRef.current = e.touches[0].clientX;
      setIsDraggingState(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - startXRef.current;
    startXRef.current = e.touches[0].clientX;
    offsetRef.current += deltaX;
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
        handleMouseUpOrLeave();
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUpOrLeave}
      className={cn(
        "relative overflow-hidden select-none cursor-grab active:cursor-grabbing",
        isDraggingState && "cursor-grabbing",
        className
      )}
    >
      <div ref={trackRef} className="flex w-max will-change-transform">
        {/* Set 1 */}
        <div ref={singleContentRef} className="flex shrink-0 items-center">
          {children}
        </div>
        {/* Set 2 (for seamless infinite loop) */}
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
        {/* Set 3 (extra buffer for ultra-wide displays) */}
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
