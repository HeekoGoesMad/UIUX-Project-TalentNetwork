"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useApp } from "@/providers/app-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
export default function Page() { const { previewsUsed } = useApp(); return <ProtectedRoute role="recruiter"><main className="container mx-auto max-w-4xl px-4 py-12"><p className="font-mono text-xs uppercase tracking-widest text-[#7C3AED]">Recruiter workspace</p><h1 className="mt-3 text-4xl font-bold">Mulai dengan konteks, bukan asumsi.</h1><p className="mt-3 max-w-2xl text-muted-foreground">Preview kandidat gratis sampai 5 kali untuk trial baru. Screening membutuhkan consent dan satu token.</p><p className="mt-5 font-mono text-sm">Free previews: {Math.max(0, 5 - previewsUsed)} tersisa</p><Button className="mt-8" asChild><Link href="/recruiter/screenings/new">Buat screening request</Link></Button></main></ProtectedRoute>; }
