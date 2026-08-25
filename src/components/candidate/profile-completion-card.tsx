"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";

export function ProfileCompletionCard() {
  const { cvProfile } = useApp();
  const sections = [
    { label: "Data dasar", done: Boolean(cvProfile?.fullName.trim() && cvProfile?.email.trim()) },
    { label: "Headline & ringkasan", done: Boolean(cvProfile?.headline.trim() && cvProfile?.about.trim()) },
    { label: "Lokasi & peran tujuan", done: Boolean(cvProfile?.location.trim() && cvProfile?.targetRole.trim()) },
    { label: "Skill & tools", done: Boolean(cvProfile?.skills.length && cvProfile?.tools.length) },
    { label: "Pengalaman", done: Boolean(cvProfile?.experience.length) },
    { label: "Pendidikan", done: Boolean(cvProfile?.education.length) },
  ];
  const doneCount = sections.filter((section) => section.done).length;
  const percent = Math.round((doneCount / sections.length) * 100);
  const complete = percent === 100;
  const remaining = sections.filter((section) => !section.done);

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {complete ? <ShieldCheck className="size-5" /> : <ClipboardList className="size-5" />}
            </span>
            <div>
              <p className="font-semibold text-foreground">Kelengkapan profil</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {complete
                  ? "Semua bagian utama sudah terisi."
                  : `${remaining.length} bagian belum terisi.`}
              </p>
            </div>
          </div>
          <p className={`font-mono text-2xl font-bold ${complete ? "text-emerald-600" : "text-primary"}`}>
            {percent}%
          </p>
        </div>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Kelengkapan profil"
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${complete ? "bg-emerald-500" : "bg-primary"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        {!complete && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {remaining.map((section) => (
              <Badge key={section.label} variant="outline" className="font-normal text-muted-foreground">
                {section.label}
              </Badge>
            ))}
          </div>
        )}
        {!complete ? (
          <Link
            href="/candidate/onboarding"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Lanjutkan onboarding <ArrowRight className="size-4" />
          </Link>
        ) : (
          <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <ShieldCheck className="size-4" /> Profil siap ditemukan recruiter
          </p>
        )}
      </CardContent>
    </Card>
  );
}
