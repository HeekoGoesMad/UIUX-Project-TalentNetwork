"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { CandidateAvatar } from "@/components/talent/avatar";
import { CheckCircle2, Clock, MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuickPeekCandidate = {
  id: string;
  name: string;
  role: string;
  location: string;
  stage: string;
  score?: number;
  avatarUrl?: string;
  dueDate?: string;
  appliedAt?: string;
  jobTitle?: string;
};

interface CandidateQuickPeekProps {
  candidate: QuickPeekCandidate;
  children: ReactNode;
  disabled?: boolean;
}

function getCandidateHighlights(role: string): string[] {
  const r = role.toLowerCase();
  if (r.includes("design") || r.includes("product management")) {
    return ["UI/UX Architecture & Figma", "Data-Driven Product Strategy", "User Journey & Prototyping"];
  }
  if (r.includes("architect") || r.includes("frontend") || r.includes("software")) {
    return ["Clean Architecture & Next.js", "TypeScript & State Management", "Performance Optimization"];
  }
  if (r.includes("backend") || r.includes("engineer")) {
    return ["Microservices & High Concurrency", "Database Schema Optimization", "API Security & Resilience"];
  }
  if (r.includes("human") || r.includes("capital") || r.includes("hr")) {
    return ["Talent Acquisition & Pipeline", "HR Operations & SLA Compliance", "Culture & Leadership Assessment"];
  }
  return ["Problem Solving & Analytical Thinking", "Cross-Functional Collaboration", "High Adaptability & Ownership"];
}

export function CandidateQuickPeek({
  candidate,
  children,
  disabled = false,
}: CandidateQuickPeekProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<"right" | "left">("right");
  const containerRef = useRef<HTMLDivElement>(null);
  const enterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (disabled) return;
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    enterTimerRef.current = setTimeout(() => {
      // Check viewport position to flip side if too close to right edge
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        if (rect.right + 280 > screenWidth) {
          setPlacement("left");
        } else {
          setPlacement("right");
        }
      }
      setIsOpen(true);
    }, 220);
  };

  const handleMouseLeave = () => {
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const isHighFit = (candidate.score || 4.2) >= 4.0;
  const highlights = getCandidateHighlights(candidate.role);

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      {children}

      {/* Floating Glassmorphism Quick-Peek Card */}
      {isOpen && !disabled && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 top-1 w-72 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-purple-200/90 shadow-2xl space-y-3 pointer-events-none animate-in fade-in zoom-in-95 duration-200",
            placement === "right" ? "left-[102%] ml-2" : "right-[102%] mr-2"
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <CandidateAvatar
                initials={candidate.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
                avatarUrl={candidate.avatarUrl}
                name={candidate.name}
                className="size-10 rounded-xl text-xs ring-1 ring-purple-200 shadow-2xs"
              />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {candidate.name}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">{candidate.role}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                  <MapPin className="size-2.5 shrink-0" />
                  <span className="truncate">{candidate.location}</span>
                </div>
              </div>
            </div>

            <Badge
              variant="outline"
              className={cn(
                "shrink-0 text-[9px] font-semibold py-0.2 px-1.5 rounded-md",
                isHighFit
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-purple-50 text-[#7C3AED] border-purple-200"
              )}
            >
              {isHighFit ? "Sangat Sesuai" : "Terverifikasi AI"}
            </Badge>
          </div>

          {/* Top Competencies / Strengths */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="size-3 text-[#7C3AED]" /> Kompetensi Kunci
            </span>
            <ul className="space-y-1 text-[11px] text-slate-600">
              {highlights.map((skill, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{skill}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* SLA & Pipeline Meta */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="size-3 text-slate-400" />
              SLA: <strong className="text-slate-700 font-semibold">{candidate.dueDate || "25 Sep 2026"}</strong>
            </span>
            <span className="text-[9px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100">
              Space untuk Detail
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
