import { ReactNode } from "react";
export function ProfileSection({ title, children }: { title: string; children: ReactNode }) { return <section className="rounded-2xl border bg-white p-6"><h2 className="text-lg font-bold">{title}</h2><div className="mt-5">{children}</div></section>; }
