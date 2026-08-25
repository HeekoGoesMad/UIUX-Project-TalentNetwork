"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MessageSquareText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import { getDemoInvitation, getDemoReview, listDemoInvitations, type DemoReview } from "@/lib/assessment-demo";

const labels: Record<DemoReview["status"], string> = { pending: "Menunggu review", in_review: "Sedang direview", completed: "Review selesai", disputed: "Perlu klarifikasi" };
type SafeReview = Pick<DemoReview, "status" | "score" | "reviewedAt">;

export function CandidateReviewStatus({ invitationId, compact = false }: { invitationId?: string; compact?: boolean }) {
  const { dbMode } = useApp();
  const [review, setReview] = useState<SafeReview | null>(null);
  useEffect(() => { let active = true; async function load() { if (!dbMode) { const invitation = invitationId ? getDemoInvitation(invitationId) : null; const local = invitation?.attemptId ? getDemoReview(invitation.attemptId) : null; if (active) setReview(local); return; } if (!invitationId) return; const list = await fetch("/api/assessment-invitations", { cache: "no-store" }).then((response) => response.json()) as { invitations?: Array<{ id: string; attempt?: { id: string } | null }> }; const invitation = list.invitations?.find((item) => item.id === invitationId); if (!invitation?.attempt?.id) return; const payload = await fetch(`/api/assessment-reviews/${invitation.attempt.id}`, { cache: "no-store" }).then((response) => response.json()) as { review?: SafeReview | null }; if (active) setReview(payload.review ?? null); } void load(); return () => { active = false; }; }, [dbMode, invitationId]);
  if (!review) return <p className="text-sm text-muted-foreground">Belum ada hasil review manusia.</p>;
  return <Card className={compact ? "border-primary/20" : "mt-6 border-primary/20"}><CardContent className="p-5"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="font-semibold">Status review manusia</p><p className="mt-1 text-sm text-muted-foreground">{labels[review.status]}</p>{review.status === "completed" && review.score !== null && <p className="mt-3 text-sm">Score keseluruhan: <strong>{review.score}/100</strong></p>}<p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><MessageSquareText className="size-3.5" /> Catatan internal recruiter tidak ditampilkan.</p></div></div></CardContent></Card>;
}

export function CandidateReviewList() {
  const { dbMode } = useApp();
  const [items, setItems] = useState<Array<{ id: string; review: SafeReview | null }>>([]);
  useEffect(() => { let active = true; async function load() { if (!dbMode) { setItems(listDemoInvitations().map((item) => ({ id: item.id, review: item.attemptId ? getDemoReview(item.attemptId) : null }))); return; } const list = await fetch("/api/assessment-invitations", { cache: "no-store" }).then((response) => response.json()) as { invitations?: Array<{ id: string; attempt?: { id: string } | null }> }; const next = await Promise.all((list.invitations ?? []).map(async (item) => ({ id: item.id, review: item.attempt?.id ? ((await fetch(`/api/assessment-reviews/${item.attempt.id}`, { cache: "no-store" }).then((response) => response.json())) as { review?: SafeReview | null }).review ?? null : null }))); if (active) setItems(next); } void load(); return () => { active = false; }; }, [dbMode]);
  return <div className="mt-4 space-y-3">{items.filter((item) => item.review).map((item) => <CandidateReviewStatus key={item.id} compact invitationId={item.id} />)}</div>;
}
