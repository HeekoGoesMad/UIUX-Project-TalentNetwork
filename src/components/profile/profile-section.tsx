import { ReactNode } from "react";
export function ProfileSection({ title, children }: { title: string; children: ReactNode }) { return <section className="rounded-lg border bg-card p-6 shadow-xs"><h2 className="text-sm font-semibold text-foreground">{title}</h2><div className="mt-3">{children}</div></section>; }
