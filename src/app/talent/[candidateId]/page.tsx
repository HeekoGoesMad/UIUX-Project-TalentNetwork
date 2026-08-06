"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, Check, Copy, Lock, Mail, MapPin, Phone, ScanLine, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { findCandidate } from "@/data/candidates";
import { useApp } from "@/providers/app-provider";
import { CandidateAvatar } from "@/components/candidates/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function TalentProfile() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const candidate = findCandidate(candidateId);
  const { tokens, scans, scan, shortlisted, toggleShortlist, viewed } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  // Viewing a profile should only update the recent list when the route changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (candidate) viewed(candidate.id); }, [candidateId]);
  if (!candidate) return <div className="container mx-auto max-w-md px-4 py-16 text-center"><p className="font-mono text-xs uppercase tracking-widest text-primary">404 / profile missing</p><h1 className="mt-3 text-3xl font-bold">This profile moved on.</h1><p className="mt-3 text-muted-foreground">Try another candidate from the network.</p><Button className="mt-6" asChild><Link href="/search">Return to search</Link></Button></div>;
  const unlocked = scans.some((item) => item.candidateId === candidate.id);
  const startScan = () => {
    if (tokens <= 0) { toast.error("No tokens available", { description: "Add tokens before scanning a new profile." }); setConfirmOpen(false); return; }
    setScanning(true);
    window.setTimeout(() => { scan(candidate.id); setScanning(false); setConfirmOpen(false); }, 650);
  };
  return <div className="container mx-auto max-w-4xl px-4 py-8"><Link href="/search" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to search</Link><Card className="mt-6 overflow-hidden"><div className="bg-primary px-6 py-8 text-primary-foreground sm:px-10"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><CandidateAvatar initials={candidate.initials} locked={!unlocked} className="size-20 bg-primary-foreground/15 text-primary-foreground" /><div className="flex-1"><p className={unlocked ? "text-2xl font-bold" : "text-2xl font-bold blur-md select-none"}>{unlocked ? candidate.name : "Private candidate"}</p><p className="mt-1 text-primary-foreground/75">{candidate.role} · {candidate.location}</p><p className="mt-3 text-xs text-primary-foreground/80">{candidate.experience} years experience · {candidate.availability}</p></div><div className="flex gap-2"><Button variant="secondary" size="icon" onClick={() => toggleShortlist(candidate.id)} aria-label="Toggle shortlist"><Bookmark className={shortlisted.includes(candidate.id) ? "fill-primary" : ""} /></Button><Button variant="secondary" size="icon" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Profile link copied"); }} aria-label="Copy profile link"><Copy /></Button></div></div></div>{!unlocked ? <CardContent className="px-6 py-10 text-center sm:px-10"><div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-primary"><Lock /></div><h1 className="mt-5 text-2xl font-bold">There is more to this profile.</h1><p className="mx-auto mt-3 max-w-xl text-muted-foreground">Scan to reveal their name, story, experience, and contact details. This uses one token. Browsing stays free.</p><p className="mt-4 font-mono text-sm">Expected range: {candidate.salary}</p><Button className="mt-7" size="lg" disabled={tokens <= 0} onClick={() => setConfirmOpen(true)}><ScanLine className="size-4" />{tokens <= 0 ? "No tokens available" : "Scan profile · 1 token"}</Button>{tokens <= 0 && <p className="mt-3 text-xs text-muted-foreground">You can still save this preview. <Link className="text-primary underline" href="/pricing">Get more tokens</Link>.</p>}</CardContent> : <CardContent className="space-y-8 px-6 py-8 sm:px-10"><div><p className="leading-7 text-muted-foreground">{candidate.summary}</p><div className="mt-4 flex flex-wrap gap-2">{candidate.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}</div></div><section><h2 className="text-lg font-semibold">Work history</h2><div className="mt-3 space-y-3">{candidate.history.map((job) => <div key={`${job.company}-${job.years}`} className="flex justify-between border-b pb-3 text-sm"><span><strong>{job.role}</strong><span className="block text-muted-foreground">{job.company}</span></span><span className="text-muted-foreground">{job.years}</span></div>)}</div></section><section><h2 className="text-lg font-semibold">Education and credentials</h2><p className="mt-2 text-sm text-muted-foreground">{candidate.education}</p><div className="mt-3 flex flex-wrap gap-2">{candidate.certifications.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div></section><section><h2 className="text-lg font-semibold">Portfolio</h2><div className="mt-3 flex flex-wrap gap-2">{candidate.portfolio.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}</div></section><div className="grid gap-3 rounded-lg bg-muted p-4 text-sm sm:grid-cols-2"><a className="flex items-center gap-2 hover:text-primary" href={`mailto:${candidate.email}`}><Mail className="size-4" /> {candidate.email}</a><a className="flex items-center gap-2 hover:text-primary" href={`tel:${candidate.phone}`}><Phone className="size-4" /> {candidate.phone}</a><span className="flex items-center gap-2"><MapPin className="size-4" /> {candidate.location}</span><span className="flex items-center gap-2"><Check className="size-4 text-green-600" /> {candidate.availability}</span></div></CardContent>}</Card>
    <Dialog open={confirmOpen} onOpenChange={(open) => !scanning && setConfirmOpen(open)}><DialogContent><DialogHeader><DialogTitle>Scan this profile?</DialogTitle><DialogDescription>This will use 1 token and reveal the candidate&apos;s full profile. You have {tokens} {tokens === 1 ? "token" : "tokens"} remaining.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={scanning} onClick={() => setConfirmOpen(false)}>Cancel</Button><Button disabled={scanning || tokens <= 0} onClick={startScan}>{scanning && <Loader2 className="size-4 animate-spin" />}{scanning ? "Scanning profile..." : "Confirm scan"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
