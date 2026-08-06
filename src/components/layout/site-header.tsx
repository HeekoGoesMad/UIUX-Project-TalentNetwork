"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Search, Sparkles, WalletCards, X, History, UserRound, ArrowRight } from "lucide-react";
import { useApp } from "@/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { candidates } from "@/data/candidates";

export function SiteHeader() {
  const { tokens, scans } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const nav = <>
    <Link className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground" href="/search" onClick={() => setMobileOpen(false)}>Search talent</Link>
    <Link className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground" href="/shortlist" onClick={() => setMobileOpen(false)}>Shortlist</Link>
    <Link className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground" href="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
  </>;

  return <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur"><div className="container mx-auto flex h-16 items-center gap-4 px-4">
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight"><span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-4" /></span><span className="text-lg">talent<span className="text-primary">network</span></span></Link>
    <nav className="hidden items-center gap-1 text-sm md:flex">{nav}</nav>
    <div className="ml-auto flex items-center gap-2">
      <Button variant="outline" size="sm" className="hidden gap-3 sm:flex" onClick={() => setSearchOpen(true)}><Search className="size-4" /> Search <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd></Button>
      <Link href="/dashboard" className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm font-medium"><WalletCards className="size-4 text-primary" /> {tokens} <span className="hidden text-muted-foreground sm:inline">tokens</span></Link>
      <div className="relative hidden sm:block"><Button variant="ghost" size="icon" aria-label="Open recruiter menu" onClick={() => setProfileOpen((open) => !open)}><UserRound className="size-4" /></Button>{profileOpen && <div className="absolute right-0 top-11 z-50 w-56 rounded-lg border bg-popover p-1 shadow-lg"><div className="border-b px-3 py-2"><p className="text-sm font-semibold">Alex Morgan</p><p className="text-xs text-muted-foreground">Internal recruiter</p></div><button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => { setHistoryOpen(true); setProfileOpen(false); }}><History className="size-4" /> Token history <span className="ml-auto text-xs text-muted-foreground">{scans.length}</span></button><Link className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent" href="/dashboard" onClick={() => setProfileOpen(false)}><ArrowRight className="size-4" /> Recruiter dashboard</Link></div>}</div>
      <Button variant="ghost" size="icon" className="md:hidden" aria-label={mobileOpen ? "Close menu" : "Open menu"} onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? <X /> : <Menu />}</Button>
    </div>
  </div>{mobileOpen && <nav className="border-t px-4 py-3 md:hidden"><div className="container mx-auto flex flex-col gap-1">{nav}<button className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent" onClick={() => { setHistoryOpen(true); setMobileOpen(false); }}><History className="size-4" /> Token history</button></div></nav>}
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}><DialogContent><DialogHeader><DialogTitle>Search talent</DialogTitle><DialogDescription>Search the network by role, skill, city, or education.</DialogDescription></DialogHeader><Link href="/search" onClick={() => setSearchOpen(false)} className="flex items-center gap-3 rounded-md border p-3 text-sm hover:bg-accent"><Search className="size-4 text-muted-foreground" /> Browse the candidate network <ArrowRight className="ml-auto size-4" /></Link></DialogContent></Dialog>
    <Dialog open={historyOpen} onOpenChange={setHistoryOpen}><DialogContent><DialogHeader><DialogTitle>Token history</DialogTitle><DialogDescription>Every scan uses one token. Repeat visits never charge again.</DialogDescription></DialogHeader>{scans.length ? <div className="max-h-72 space-y-2 overflow-auto">{scans.slice().reverse().map((scan) => { const candidate = candidates.find((item) => item.id === scan.candidateId); return <div key={scan.candidateId} className="flex items-center justify-between rounded-md bg-muted p-3 text-sm"><span><span className="font-medium">{candidate?.name ?? "Candidate"}</span><span className="block text-xs text-muted-foreground">{candidate?.role}</span></span><span className="text-right text-xs text-muted-foreground">-1 token<br />{new Date(scan.scannedAt).toLocaleDateString()}</span></div>; })}</div> : <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">No scans yet. Browse the network to find your first signal.</p>}</DialogContent></Dialog>
  </header>;
}
