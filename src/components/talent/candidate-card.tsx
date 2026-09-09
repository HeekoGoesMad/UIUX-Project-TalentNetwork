"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { maskName } from "@/lib/candidate-display";
import { useApp } from "@/providers/app-provider";
import { Candidate, CampusVerification } from "@/types";
import { Bookmark, Brain, BriefcaseBusiness, Clock3, GraduationCap, Lock, MapPin, Wrench } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { CandidateAvatar } from "./avatar";
import { CandidateCategoryBadge } from "./candidate-category-badge";
import { CandidateStatusBadge } from "./candidate-status-badge";

export interface CandidateCardViewProps {
  candidate: Candidate;
  list?: boolean;
  unlocked: boolean;
  isShortlisted: boolean;
  onToggleShortlist: (id: string) => void;
  partnerVerification?: CampusVerification;
}

/**
 * Pure memoized candidate card view.
 * Only re-renders when its specific candidate state (unlocked, shortlist status, verification) changes.
 */
export const CandidateCardView = memo(function CandidateCardView({
  candidate,
  list = false,
  unlocked,
  isShortlisted,
  onToggleShortlist,
  partnerVerification,
}: CandidateCardViewProps) {
  const displayName = unlocked ? candidate.name : maskName(candidate.name);
  const verif = partnerVerification ?? candidate.campusVerification;

  return (
    <Card className={list ? "card-interactive" : "card-interactive flex flex-col"}>
      <CardContent className={list ? "flex flex-wrap items-center gap-4 p-5" : "flex flex-1 flex-col gap-4 p-5"}>
        <CandidateAvatar initials={candidate.initials} locked={!unlocked} />

        <div className="min-w-0 flex-1">
          {/* Category + shortlist row */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <CandidateCategoryBadge category={candidate.talentCategory} />
              {verif?.status === "verified" && (
                <span
                  title={`Terverifikasi oleh ${verif.verifiedBy || verif.institution}`}
                  className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-[#7C3AED]"
                >
                  <GraduationCap className="size-3 text-[#7C3AED]" />
                  Campus Verified · {verif.institution.replace("Universitas ", "UI ").replace("Institut Teknologi ", "IT ")}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 -mt-1 shrink-0"
              onClick={() => onToggleShortlist(candidate.id)}
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

          {/* Career status & Personality */}
          {(candidate.careerStatus || candidate.personality) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {candidate.careerStatus && (
                <CandidateStatusBadge status={candidate.careerStatus} />
              )}
              {candidate.personality && (
                <span
                  title={`Tipe Kepribadian: ${candidate.personality.type} (${candidate.personality.label})`}
                  className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-[#7C3AED]"
                >
                  <Brain className="size-3 text-[#7C3AED]" />
                  {candidate.personality.type} · {candidate.personality.label}
                </span>
              )}
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
            <Link href={`/recruiter/discover/${candidate.id}`}>
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
});

export interface CandidateCardProps {
  candidate: Candidate;
  list?: boolean;
  unlocked?: boolean;
  isShortlisted?: boolean;
  onToggleShortlist?: (id: string) => void;
  partnerVerification?: CampusVerification;
}

/**
 * Connected CandidateCard wrapper with fallback to context when props are omitted.
 */
export const CandidateCard = memo(function CandidateCard({
  candidate,
  list = false,
  unlocked: propUnlocked,
  isShortlisted: propIsShortlisted,
  onToggleShortlist: propToggleShortlist,
  partnerVerification: propPartnerVerification,
}: CandidateCardProps) {
  const { shortlisted, toggleShortlist, scans, partnerVerifications } = useApp();
  const unlocked = propUnlocked ?? scans.some((scan) => scan.candidateId === candidate.id);
  const isShortlisted = propIsShortlisted ?? shortlisted.includes(candidate.id);
  const handleToggle = propToggleShortlist ?? toggleShortlist;
  const verif = propPartnerVerification ?? partnerVerifications?.[candidate.id] ?? candidate.campusVerification;

  return (
    <CandidateCardView
      candidate={candidate}
      list={list}
      unlocked={unlocked}
      isShortlisted={isShortlisted}
      onToggleShortlist={handleToggle}
      partnerVerification={verif}
    />
  );
});

