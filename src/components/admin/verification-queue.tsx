"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Row = { verification: { id: string; type: string; status: string; createdAt: string }; user: { email: string }; profile: { id: string } };
const labels: Record<string, string> = { identity: "Identitas", email: "Email", phone: "Nomor telepon", education: "Pendidikan", employment: "Riwayat kerja", certification: "Sertifikasi", portfolio: "Portfolio" };
const statuses = ["pending", "verified", "expired", "revoked", "disputed"];

export function VerificationQueue() {
  const [rows, setRows] = useState<Row[]>([]); const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading"); const [message, setMessage] = useState(""); const [busy, setBusy] = useState<string | null>(null);
  async function load() { setState("loading"); try { const response = await fetch("/api/verifications", { cache: "no-store" }); const body = await response.json() as { verifications?: Row[]; error?: string }; if (!response.ok) throw new Error(body.error || "Database verifikasi belum tersedia."); const next = body.verifications ?? []; setRows(next); setState(next.length ? "ready" : "empty"); } catch (error) { setMessage(error instanceof Error ? error.message : "Database verifikasi belum tersedia."); setState("error"); } }
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);
  async function update(id: string, status: string) { setBusy(id); setMessage(""); const response = await fetch(`/api/verifications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); if (!response.ok) setMessage(((await response.json()) as { error?: string }).error || "Status gagal diperbarui."); else await load(); setBusy(null); }
  if (state === "loading") return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground" role="status">Memuat antrean verifikasi...</div>;
  if (state === "error") return <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950" role="alert">{message} Mode demo tidak tersedia untuk verifikasi; data harus berasal dari database.</div>;
  if (state === "empty") return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Belum ada permintaan verifikasi. Mode demo tidak menampilkan data palsu.</div>;
  return <div className="grid gap-3">{message && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="alert">{message}</div>}{rows.map(({ verification, user }) => <div key={verification.id} className="rounded-2xl border bg-card p-5"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><p className="font-semibold">{labels[verification.type] || verification.type}</p><p className="mt-1 text-sm text-muted-foreground">{user.email} · {verification.status}</p></div><div className="flex flex-wrap gap-2">{statuses.filter((status) => status !== verification.status).map((status) => <Button key={status} size="sm" variant={status === "revoked" ? "destructive" : "outline"} onClick={() => void update(verification.id, status)} disabled={busy === verification.id}>{status}</Button>)}</div></div></div>)}</div>;
}
