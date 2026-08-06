"use client";

import Link from "next/link";
import { Menu, Search, ShieldCheck, UserRound, WalletCards, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/providers/app-provider";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { tokens, user, hydrated, logout } = useApp();
  const visibleUser = hydrated ? user : null;
  const [open, setOpen] = useState(false);
  const links = visibleUser?.role === "candidate"
    ? [{ href: "/candidate", label: "Workspace" }, { href: "/candidate/cv", label: "CV & Profile" }, { href: "/candidate/career-advisor", label: "Career Advisor" }]
    : [{ href: "/search", label: "Search talent" }, { href: "/shortlist", label: "Shortlist" }, { href: "/dashboard", label: "Dashboard" }];
  return <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur"><div className="container mx-auto flex h-16 items-center gap-5 px-4">
    <Link href="/" className="flex items-center gap-2 font-bold tracking-tight"><span className="flex size-9 items-center justify-center rounded-xl bg-[#d7f5e8] text-[#08744f]"><ShieldCheck className="size-5" /></span><span className="text-lg">Proofy<span className="text-[#19a974]">Link</span></span></Link>
    <nav className="hidden items-center gap-1 text-sm md:flex">{links.map((link) => <Link key={link.href} className="rounded-xl px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground" href={link.href}>{link.label}</Link>)}</nav>
    <div className="ml-auto flex items-center gap-2"><Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild><Link href={visibleUser?.role === "candidate" ? "/jobs" : "/search"}><Search className="size-4" /> {visibleUser?.role === "candidate" ? "Explore jobs" : "Search talent"}</Link></Button>
      {visibleUser?.role === "recruiter" && <Link href="/dashboard" className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><WalletCards className="size-4 text-[#19a974]" /><span className="font-mono">{tokens}</span><span className="hidden text-muted-foreground sm:inline">tokens</span></Link>}
      {visibleUser ? <Button variant="ghost" size="icon" aria-label="Log out" onClick={logout}><LogOut className="size-4" /></Button> : <Link className="hidden text-sm font-semibold md:inline" href="/login"><UserRound className="mr-1 inline size-4" /> Log in</Link>}
      <Button variant="ghost" size="icon" className="md:hidden" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
     </div></div>{open && <nav className="border-t bg-white px-4 py-3 md:hidden"><div className="container mx-auto flex flex-col">{links.map((link) => <Link key={link.href} className="rounded-xl px-3 py-3 text-sm" href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}{!visibleUser && <Link className="rounded-xl px-3 py-3 text-sm font-semibold" href="/login">Log in</Link>}</div></nav>}</header>;
}
