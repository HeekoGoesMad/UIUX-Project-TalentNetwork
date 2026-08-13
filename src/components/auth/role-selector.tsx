"use client";

import { BriefcaseBusiness, GraduationCap, UserRound } from "lucide-react";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";

export function RoleSelector({
  role,
  onChange,
}: {
  role: UserRole;
  onChange: (role: UserRole) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {([
        ["recruiter", "Recruiter / Hiring", BriefcaseBusiness, "Buka profil terverifikasi"],
        ["candidate", "Talent / Candidate", UserRound, "Terima tawaran karir privat"],
        ["partner", "Partnership", GraduationCap, "Kampus / Lembaga / Partner"],
      ] as const).map(([value, label, Icon, subtext]) => {
        const active = role === value;
        return (
          <button
            type="button"
            key={value}
            aria-pressed={active}
            onClick={() => onChange(value)}
            className={cn(
              "relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900",
              active
                ? "border-slate-900 bg-slate-50 shadow-xs ring-1 ring-slate-900"
                : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-300"
            )}
          >
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg transition-colors",
                  active ? "bg-slate-900 text-white" : "bg-slate-200/80 text-slate-600"
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-1.5">
              <span className={cn("block text-xs font-bold truncate", active ? "text-slate-900" : "text-slate-800")}>
                {label}
              </span>
              <span className="mt-0.5 block text-[10px] leading-3 text-slate-500">
                {subtext}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
