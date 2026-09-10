"use client";

import { useState } from "react";
import { Brain, Check, ExternalLink, HelpCircle, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PERSONALITY_TYPES,
  OFFICIAL_16PERSONALITIES_URL,
  getPersonalityConfig,
} from "@/config/personality";
import type { CandidatePersonality } from "@/types";

interface PersonalityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personality?: CandidatePersonality;
  onSave: (personality: CandidatePersonality | undefined) => void;
}

export function PersonalityModal({
  open,
  onOpenChange,
  personality,
  onSave,
}: PersonalityModalProps) {
  const [selectedType, setSelectedType] = useState<string>(personality?.type ?? "");
  const [testUrl, setTestUrl] = useState<string>(personality?.testUrl ?? "");
  const [prevExisting, setPrevExisting] = useState(personality);

  if (personality !== prevExisting) {
    setPrevExisting(personality);
    setSelectedType(personality?.type ?? "");
    setTestUrl(personality?.testUrl ?? "");
  }

  const selectedConfig = getPersonalityConfig(selectedType);

  const handleApply = () => {
    if (!selectedType) {
      onSave(undefined);
      onOpenChange(false);
      return;
    }
    const cfg = getPersonalityConfig(selectedType);
    if (!cfg) return;

    onSave({
      type: cfg.type,
      label: cfg.name,
      tagline: cfg.tagline,
      summary: cfg.tagline,
      testUrl: testUrl.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    onOpenChange(false);
  };

  const handleRemove = () => {
    setSelectedType("");
    setTestUrl("");
    onSave(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 sm:p-6 rounded-2xl gap-4">
        <DialogHeader className="gap-1 border-b border-border pb-3 pr-8">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-[#7C3AED]">
              <Brain className="size-4" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Tes Kepribadian (16Personalities)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Pilih tipe kepribadian MBTI kamu untuk melengkapi profil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Belum tahu tes? info box */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-purple-200/70 bg-purple-50/50 p-3">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-purple-950 flex items-center gap-1.5">
                <HelpCircle className="size-3.5 text-[#7C3AED]" />
                Belum tahu tipe kamu?
              </p>
              <p className="text-[11px] text-purple-900/70">
                Ikuti tes gratis 10–12 menit di situs resmi 16Personalities.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 text-[11px] font-semibold border-purple-200 text-[#7C3AED] hover:bg-purple-100/60 rounded-lg shrink-0 gap-1 px-2.5"
            >
              <a
                href={OFFICIAL_16PERSONALITIES_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ikuti Tes <ExternalLink className="size-2.5" />
              </a>
            </Button>
          </div>

          {/* Select Dropdown (NO SHORTCUT GRID) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Pilih Tipe Kepribadian (16 Tipe MBTI)
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            >
              <option value="">-- Pilih Tipe Kepribadian --</option>
              <optgroup label="Kelompok Analis">
                {PERSONALITY_TYPES.filter((p) => p.category === "analyst").map((p) => (
                  <option key={p.type} value={p.type}>
                    {p.type} — {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Kelompok Diplomat">
                {PERSONALITY_TYPES.filter((p) => p.category === "diplomat").map((p) => (
                  <option key={p.type} value={p.type}>
                    {p.type} — {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Kelompok Pengawal">
                {PERSONALITY_TYPES.filter((p) => p.category === "sentinel").map((p) => (
                  <option key={p.type} value={p.type}>
                    {p.type} — {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Kelompok Penjelajah">
                {PERSONALITY_TYPES.filter((p) => p.category === "explorer").map((p) => (
                  <option key={p.type} value={p.type}>
                    {p.type} — {p.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Selected Preview Box */}
          {selectedConfig && (
            <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED]">
                <Sparkles className="size-3.5 text-[#7C3AED]" />
                <span>{selectedConfig.type} · {selectedConfig.name}</span>
                <span className="text-[10px] font-normal text-muted-foreground">({selectedConfig.categoryLabel})</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {selectedConfig.tagline}
              </p>
            </div>
          )}

          {/* Optional Test URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Tautan Hasil Tes (Opsional)
            </label>
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://www.16personalities.com/profiles/..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
            <p className="text-[10px] text-muted-foreground">
              Tautan publik profil hasil tesmu agar rekruter dapat memverifikasi keasliannya.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between gap-2 border-t border-border pt-3">
          {personality?.type ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2.5 gap-1"
            >
              <Trash2 className="size-3" /> Hapus
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              disabled={!selectedType && !personality?.type}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-8 text-xs font-semibold rounded-xl gap-1"
            >
              <Check className="size-3" />
              Terapkan
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
