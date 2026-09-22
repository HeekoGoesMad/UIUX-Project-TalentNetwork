"use client";

import { useEffect } from "react";
import { AlertTriangle, Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CvUnsavedBarProps {
  show: boolean;
  saving: boolean;
  shaking: boolean;
  shakeKey?: number;
  onSave: () => void | Promise<void>;
  onReset: () => void;
}

export function CvUnsavedBar({
  show,
  saving,
  shaking,
  shakeKey = 0,
  onSave,
  onReset,
}: CvUnsavedBarProps) {
  // Mobile & Gamepad haptic vibration support when danger shake is triggered
  useEffect(() => {
    if (shaking && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([40, 50, 40]);
      } catch {
        // Ignore vibration errors on unsupported environments
      }
    }
  }, [shaking, shakeKey]);

  return (
    <aside
      data-cv-unsaved-bar="true"
      role="region"
      aria-label="Notifikasi perubahan profil"
      aria-live={shaking ? "assertive" : "polite"}
      className={cn(
        "fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 transition-all duration-200",
        show
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-4 opacity-0 pointer-events-none"
      )}
    >
      <div
        key={shakeKey}
        className={cn(
          "flex flex-col items-center justify-between gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:py-2.5 transition-all duration-200",
          shaking
            ? "animate-discord-shake border-destructive ring-2 ring-destructive/40 bg-card/95 shadow-[0_0_32px_rgba(239,68,68,0.5),0_12px_28px_rgba(0,0,0,0.35)]"
            : "border-border/80 bg-card/95 backdrop-blur-md shadow-xl shadow-black/10"
        )}
      >
        {/* Status Indicator & Alert Copy */}
        <div className="flex items-center gap-2.5 text-sm font-medium">
          {shaking ? (
            <AlertTriangle className="size-4 shrink-0 text-destructive animate-pulse" />
          ) : (
            <span className="relative flex size-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-amber-500" />
            </span>
          )}

          <span
            className={cn(
              "text-xs sm:text-sm font-medium transition-colors",
              shaking ? "text-destructive font-semibold" : "text-foreground"
            )}
          >
            {shaking
              ? "Hati-hati — simpan atau batalkan perubahan terlebih dahulu!"
              : "Ada perubahan belum disimpan"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={saving}
            className="h-8 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Batalkan
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => void onSave()}
            disabled={saving}
            className={cn(
              "h-8 rounded-lg px-4 text-xs font-medium shadow-xs transition-all",
              shaking && "ring-2 ring-primary ring-offset-2 ring-offset-card"
            )}
          >
            {saving ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Simpan profil
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
