"use client";

import { useState } from "react";
import { Lock, Sliders } from "lucide-react";
import { AccessibilitySettings } from "@/components/settings/accessibility-settings";
import { SecuritySettings } from "@/components/settings/security-settings";

export function CandidateSettingsView() {
  const [activeTab, setActiveTab] = useState<"accessibility" | "security">("accessibility");

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-10">
      {/* Header Halaman */}
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Workspace Kandidat
        </span>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Pengaturan Akun
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola kenyamanan aksesibilitas antarmuka dan keamanan kata sandi login Anda.
        </p>
      </div>

      {/* Tabs Navigasi */}
      <div className="mb-8 flex flex-wrap gap-2 border-b border-border/80 pb-3">
        {[
          { id: "accessibility" as const, label: "Aksesibilitas", icon: Sliders },
          { id: "security" as const, label: "Keamanan & Sandi", icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                active
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Konten Tab 1: Aksesibilitas */}
      {activeTab === "accessibility" && <AccessibilitySettings />}

      {/* Konten Tab 2: Keamanan & Sandi */}
      {activeTab === "security" && <SecuritySettings />}
    </div>
  );
}
