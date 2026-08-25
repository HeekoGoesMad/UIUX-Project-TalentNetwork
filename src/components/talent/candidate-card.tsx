"use client";

import Link from "next/link";
import { Bookmark, BriefcaseBusiness, Clock3, Lock, MapPin, Wrench } from "lucide-react";
import { Candidate } from "@/types";
import { useApp } from "@/providers/app-provider";
import { maskName } from "@/lib/candidate-display";
import { CandidateAvatar } from "./avatar";
import { CandidateStatusBadge } from "./candidate-status-badge";
import { CandidateCategoryBadge } from "./candidate-category-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CandidateCard({ candidate, list = false }: { candidate: Candidate; list?: boolean }) {
  const { shortlisted, toggleShortlist, scans } = useApp();
  const unlocked = scans.some((scan) => scan.candidateId === candidate.id);
  const isShortlisted = shortlisted.includes(candidate.id);
  const displayName = unlocked ? candidate.name : maskName(candidate.name);

  return (
    <Card className={list ? "card-interactive" : "card-interactive flex flex-col"}>
      <CardContent className={list ? "flex flex-wrap items-center gap-4 p-5" : "flex flex-1 flex-col gap-4 p-5"}>
        <CandidateAvatar initials={candidate.initials} locked={!unlocked} />

        <div className="min-w-0 flex-1">
          {/* Category + shortlist row */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <CandidateCategoryBadge category={candidate.talentCategory} />
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 -mt-1 shrink-0"
              onClick={() => toggleShortlist(candidate.id)}
              aria-label={isShortlisted ? "Hapus dari shortlist" : "Simpan ke shortlist"}
              aria-pressed={isShortlisted}
            >
              <Bookmark className={isShortlisted ? "fill-primary text-primary" : ""} />
            </Button>
          </div>

          {/* Name + preview badge */}
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">{displayName}</p>
            {!unlocked && (
              <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                Pratinjau
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{candidate.role}</p>

          {/* Career status */}
          {candidate.careerStatus && (
            <div className="mt-2">
              <CandidateStatusBadge status={candidate.careerStatus} />
            </div>
          )}

          {/* Meta info */}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {candidate.location}
            </span>
            <span className="flex items-center gap-1">
              <BriefcaseBusiness className="size-3" />
              {candidate.experience} tahun
            </span>
            <span className="flex items-center gap-1">
              <Clock3 className="size-3" />
              {candidate.availability}
            </span>
          </div>
        </div>

        <div className={list ? "hidden min-w-28 text-right sm:block" : "border-t pt-3"}>
          <p className="text-xs text-muted-foreground">Ekspektasi gaji</p>
          <p className="font-mono text-sm font-medium">{candidate.salary}</p>
        </div>

        <div className={list ? "ml-auto flex items-center gap-3" : "mt-auto flex flex-col gap-3 pt-2"}>
          {/* Skills & Tools */}
          <div className="flex flex-wrap gap-1">
            {candidate.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {candidate.tools?.slice(0, 2).map((tool) => (
              <Badge key={tool} variant="secondary" className="border-slate-200 bg-slate-100 text-xs text-slate-600">
                <Wrench className="mr-0.5 size-2.5" /> {tool}
              </Badge>
            ))}
          </div>

          <Button asChild size="sm" variant={unlocked ? "outline" : "default"} className={list ? "" : "w-full justify-center"}>
            <Link href={`/talent/${candidate.id}`}>
              {unlocked ? (
                "Lihat Detail"
              ) : (
                <>
                  <Lock className="mr-1.5 size-3.5" /> Lihat Detail
                </>
              )}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
