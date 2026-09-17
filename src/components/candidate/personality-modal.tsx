"use client";

import { useState } from "react";
import { Check, ExternalLink, Trash2 } from "lucide-react";
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
      <DialogContent className="gap-4 rounded-lg p-4 sm:max-w-md sm:p-6">
        <DialogHeader className="gap-1 border-b pb-3 pr-8">
          <DialogTitle className="text-sm font-semibold text-foreground">
            Tes kepribadian
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Pilih tipe MBTI untuk melengkapi profil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="flex items-center justify-between gap-3 rounded-md border bg-muted p-3">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-foreground">
                Belum tahu tipe kamu?
              </p>
              <p className="text-xs text-muted-foreground">
                Ikuti tes gratis 10–12 menit di situs resmi.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1 rounded-md px-2.5 text-xs font-medium"
            >
              <a
                href={OFFICIAL_16PERSONALITIES_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ikuti tes <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>

          {/* Select Dropdown (NO SHORTCUT GRID) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Tipe kepribadian
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-ring/50"
            >
              <option value="">Pilih tipe kepribadian</option>
              <optgroup label="Analis">
                {PERSONALITY_TYPES.filter((p) => p.category === "analyst").map((p) => (
                  <option key={p.type} value={p.type}>
                    {p.type} — {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Diplomat">
                {PERSONALITY_TYPES.filter((p) => p.category === "diplomat").map((p) => (
                  <option key={p.type} value={p.type}>
                    {p.type} — {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Pengawal">
                {PERSONALITY_TYPES.filter((p) => p.category === "sentinel").map((p) => (
                  <option key={p.type} value={p.type}>
                    {p.type} — {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Penjelajah">
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
            <div className="space-y-1 rounded-md border bg-muted p-3">
              <p className="text-xs font-medium text-foreground">
                {selectedConfig.type} · {selectedConfig.name}
                <span className="ml-1 font-normal text-muted-foreground">({selectedConfig.categoryLabel})</span>
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {selectedConfig.tagline}
              </p>
            </div>
          )}

          {/* Optional Test URL */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Tautan hasil tes (opsional)
            </label>
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://www.16personalities.com/profiles/..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-ring/50"
            />
            <p className="text-xs text-muted-foreground">
              Tautan publik agar rekruter dapat memverifikasi.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between gap-2 border-t pt-3">
          {personality?.type ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-8 gap-1 px-2.5 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Hapus
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
              className="h-8 rounded-md text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              disabled={!selectedType && !personality?.type}
              className="h-8 gap-1 rounded-md text-xs font-medium"
            >
              <Check className="h-3 w-3" />
              Terapkan
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
