"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import { calculateCandidateReadiness } from "@/lib/candidate/onboarding-step";

export function ProfileCompletionCard() {
  const { cvProfile } = useApp();
  const readiness = calculateCandidateReadiness(cvProfile);

  return (
    <Card className="border-border/80 bg-card shadow-xs">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                readiness.complete ? "bg-emerald-50 text-emerald-600" : "bg-primary/10 text-primary"
              }`}
            >
              {readiness.complete ? <ShieldCheck className="size-5" /> : <ClipboardList className="size-5" />}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">Kesiapan profil</p>
                <Badge
                  variant="outline"
                  className={`text-[11px] font-medium ${
                    readiness.complete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-primary/20 bg-primary/5 text-primary"
                  }`}
                >
                  {readiness.tier}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {readiness.complete
                  ? "Semua bagian utama terisi. Profil siap dilamar dan lolos pindaian ATS."
                  : `${readiness.missingSections.length} bagian penting belum dilengkapi agar profil optimal.`}
              </p>
            </div>
          </div>
          <p className={`font-mono text-2xl font-bold tabular-nums tracking-tight ${readiness.tierColor}`}>
            {readiness.percent}%
          </p>
        </div>

        <div
          className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={readiness.percent}
          aria-label="Kesiapan profil ATS"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              readiness.complete ? "bg-emerald-500" : "bg-primary"
            }`}
            style={{ width: `${readiness.percent}%` }}
          />
        </div>

        {!readiness.complete && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Bagian yang perlu dilengkapi
            </p>
            <div className="flex flex-wrap gap-1.5">
              {readiness.missingSections.map((section) => (
                <Link key={section.id} href={section.anchor}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer border-border bg-muted/40 text-xs font-normal text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  >
                    + {section.label}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          {!readiness.complete ? (
            <>
              <Link
                href={readiness.firstIncompleteAnchor}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Lengkapi di CV Studio <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/candidate/career-advisor"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Sparkles className="size-3.5 text-primary" />
                Minta saran AI
              </Link>
            </>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="size-4" /> Profil aktif dan dapat ditemukan rekruter
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

