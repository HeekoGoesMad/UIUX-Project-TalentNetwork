"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileText, Pencil, Sparkles } from "lucide-react";

interface ProfessionalSummaryCardProps {
  summary?: string | null;
  onOpenHelper?: () => void;
  readOnly?: boolean;
  className?: string;
}

export function ProfessionalSummaryCard({
  summary,
  onOpenHelper,
  readOnly = false,
  className,
}: ProfessionalSummaryCardProps) {
  const hasSummary = Boolean(summary && summary.trim().length > 0);

  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-border/80 bg-card shadow-xs transition-all hover:border-border",
        className
      )}
    >
      <div className="border-b border-border/60 bg-muted/30 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Professional summary
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Ringkasan kualifikasi, keahlian inti, dan latar belakang profesional.
            </p>
          </div>

          {!readOnly && onOpenHelper && (
            <Button
              type="button"
              variant={hasSummary ? "outline" : "default"}
              size="sm"
              onClick={onOpenHelper}
              className={cn(
                "h-8 gap-1.5 text-xs font-medium",
                !hasSummary && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {hasSummary ? (
                <>
                  <Pencil className="h-3 w-3" />
                  Edit Ringkasan
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  Buat dengan Panduan
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <CardContent className="p-6">
        {hasSummary ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {summary}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <Sparkles className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">
              Belum ada Professional Summary
            </h4>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              Gunakan panduan 5 langkah terstruktur untuk menyusun ringkasan profil
              yang menarik bagi rekruter dalam hitungan detik.
            </p>
            {!readOnly && onOpenHelper && (
              <Button
                type="button"
                size="sm"
                onClick={onOpenHelper}
                className="mt-4 gap-1.5 bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Sparkles className="h-3 w-3" />
                Mulai Panduan Summary
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
