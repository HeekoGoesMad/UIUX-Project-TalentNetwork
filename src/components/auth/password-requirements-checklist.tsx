"use client";

import { CheckCircle2 } from "lucide-react";
import { PasswordRequirements } from "./auth-form";

interface PasswordRequirementsChecklistProps {
  requirements: PasswordRequirements;
  className?: string;
}

export function PasswordRequirementsChecklist({
  requirements,
  className = "",
}: PasswordRequirementsChecklistProps) {
  const fulfilledCount = [
    requirements.hasMinLength,
    requirements.hasUppercase,
    requirements.hasLowercase,
    requirements.hasNumber,
  ].filter(Boolean).length;

  return (
    <div
      className={`space-y-1.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs text-slate-600 transition-all ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-700">
          Kriteria Kata Sandi:
        </span>
        <span className="text-[11px] font-medium text-slate-500">
          {fulfilledCount}/4 terpenuhi
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
        <div
          className={`flex items-center gap-1.5 text-[11px] transition-colors ${
            requirements.hasMinLength
              ? "font-medium text-emerald-700"
              : "text-slate-500"
          }`}
        >
          <CheckCircle2
            className={`size-3.5 shrink-0 ${
              requirements.hasMinLength ? "text-emerald-600" : "text-slate-300"
            }`}
          />
          <span>Minimal 8 karakter</span>
        </div>
        <div
          className={`flex items-center gap-1.5 text-[11px] transition-colors ${
            requirements.hasUppercase
              ? "font-medium text-emerald-700"
              : "text-slate-500"
          }`}
        >
          <CheckCircle2
            className={`size-3.5 shrink-0 ${
              requirements.hasUppercase ? "text-emerald-600" : "text-slate-300"
            }`}
          />
          <span>Huruf besar (A-Z)</span>
        </div>
        <div
          className={`flex items-center gap-1.5 text-[11px] transition-colors ${
            requirements.hasLowercase
              ? "font-medium text-emerald-700"
              : "text-slate-500"
          }`}
        >
          <CheckCircle2
            className={`size-3.5 shrink-0 ${
              requirements.hasLowercase ? "text-emerald-600" : "text-slate-300"
            }`}
          />
          <span>Huruf kecil (a-z)</span>
        </div>
        <div
          className={`flex items-center gap-1.5 text-[11px] transition-colors ${
            requirements.hasNumber
              ? "font-medium text-emerald-700"
              : "text-slate-500"
          }`}
        >
          <CheckCircle2
            className={`size-3.5 shrink-0 ${
              requirements.hasNumber ? "text-emerald-600" : "text-slate-300"
            }`}
          />
          <span>Minimal 1 angka (0-9)</span>
        </div>
      </div>
    </div>
  );
}
