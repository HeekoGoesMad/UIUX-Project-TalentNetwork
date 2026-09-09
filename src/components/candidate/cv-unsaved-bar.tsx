"use client";

import { Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CvUnsavedBarProps {
  show: boolean;
  saving: boolean;
  shaking: boolean;
  onSave: () => void | Promise<void>;
  onReset: () => void;
}

export function CvUnsavedBar({
  show,
  saving,
  shaking,
  onSave,
  onReset,
}: CvUnsavedBarProps) {
  return (
    <aside
      role="region"
      aria-label="Notifikasi perubahan profil"
      aria-live="polite"
      className={cn(
        "fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 transition-all duration-300 ease-out",
        show
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-16 opacity-0 pointer-events-none"
      )}
    >
      <div
        className={cn(
          "flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl sm:rounded-full border px-4 py-3 sm:py-2.5 shadow-2xl backdrop-blur-xl transition-colors duration-200",
          shaking
            ? "animate-shake border-destructive/80 bg-destructive/15 text-destructive ring-4 ring-destructive/20 shadow-destructive/20"
            : "border-purple-200/80 bg-white/95 text-slate-900 ring-1 ring-black/5 dark:bg-slate-900/95 dark:border-purple-900/50 dark:text-slate-100"
        )}
      >
        {/* Status Indicator */}
        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
          <span className="relative flex size-2.5 shrink-0">
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                shaking ? "bg-destructive" : "bg-amber-400"
              )}
            />
            <span
              className={cn(
                "relative inline-flex size-2.5 rounded-full",
                shaking ? "bg-destructive" : "bg-amber-500"
              )}
            />
          </span>
          <span className="font-semibold tracking-tight">
            {shaking ? "Simpan perubahan terlebih dahulu!" : "Ada perubahan belum disimpan"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full sm:w-auto items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={saving}
            className="h-8 rounded-full px-3 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw className="size-3.5 mr-1" />
            Batalkan
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => void onSave()}
            disabled={saving}
            className={cn(
              "h-8 rounded-full px-4 text-xs font-semibold shadow-xs text-white transition-transform active:scale-95",
              shaking
                ? "bg-destructive hover:bg-destructive/90"
                : "bg-[#7C3AED] hover:bg-[#6D28D9]"
            )}
          >
            {saving ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="size-3.5 mr-1.5" />
                Simpan Profil
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
