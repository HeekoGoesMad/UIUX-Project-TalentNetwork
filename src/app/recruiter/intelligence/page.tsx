"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Bot,
  Check,
  ChevronDown,
  Clock3,
  Database,
  Gauge,
  GitBranch,
  Info,
  Layers3,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  ThumbsUp,
  Trash2,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Tab = "search" | "governance";
type Freshness = "balanced" | "recent" | "complete";

const initialAliases = [
  { canonical: "TypeScript", aliases: ["TS", "Type script"], coverage: "92%" },
  { canonical: "Product discovery", aliases: ["Discovery produk", "Product research"], coverage: "78%" },
  { canonical: "Analitik produk", aliases: ["Product analytics", "Mixpanel", "Amplitude"], coverage: "84%" },
];

const savedSearches = [
  { name: "Senior Product Designer · Jakarta", detail: "12 skill · 3 lokasi", alert: true, change: "+4 kandidat baru" },
  { name: "Backend Engineer · Go / AWS", detail: "8 skill · Remote", alert: true, change: "2 profil diperbarui" },
  { name: "Campus talent · Data", detail: "5 skill · Entry level", alert: false, change: "Belum ada perubahan" },
];

const matchSignals = [
  { label: "Skill inti", value: 91, note: "7 dari 8 skill wajib terdeteksi pada CV dan portfolio", color: "bg-primary" },
  { label: "Konteks role", value: 83, note: "Pengalaman paling baru sesuai dengan konteks Product-led SaaS", color: "bg-pink-500" },
  { label: "Kebaruan profil", value: 76, note: "Profile diperbarui 18 hari lalu; bukti terbaru tersedia", color: "bg-emerald-500" },
];

const rubricDimensions = [
  { name: "Kedalaman skill", weight: "35%", score: "4.2 / 5", source: "CV + portfolio" },
  { name: "Konteks pengalaman", weight: "30%", score: "3.8 / 5", source: "Riwayat role" },
  { name: "Kualitas bukti", weight: "20%", score: "4.0 / 5", source: "Project evidence" },
  { name: "Kelengkapan data", weight: "15%", score: "3.6 / 5", source: "Profile fields" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">{children}</p>;
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Activity }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 text-muted-foreground"><span className="text-xs font-medium">{label}</span><Icon className="size-4 text-primary" /></div>
      <p className="mt-3 font-mono text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function ProgressBar({ value, color = "bg-primary" }: { value: number; color?: string }) {
  return <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`${value}%`}><div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} /></div>;
}

export default function RecruiterIntelligencePage() {
  const [tab, setTab] = useState<Tab>("search");
  const [freshness, setFreshness] = useState<Freshness>("balanced");
  const [aliases, setAliases] = useState(initialAliases);
  const [alerts, setAlerts] = useState(() => savedSearches.map((item) => item.alert));
  const [showAllSignals, setShowAllSignals] = useState(false);
  const [period, setPeriod] = useState("30 hari");
  const [recommendationVisible, setRecommendationVisible] = useState(true);

  const freshnessCopy = useMemo(() => ({
    balanced: "Seimbang antara kecocokan skill dan bukti terbaru",
    recent: "Prioritaskan profile dengan aktivitas paling baru",
    complete: "Prioritaskan profile dengan data paling lengkap",
  }[freshness]), [freshness]);

  const toggleAlias = (index: number) => setAliases((current) => current.filter((_, itemIndex) => itemIndex !== index));

  return (
    <ProtectedRoute role="recruiter">
      <main className="container mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <header className="relative overflow-hidden rounded-3xl bg-[#201c45] px-6 py-8 text-white shadow-lg sm:px-10 sm:py-10">
          <div className="absolute -right-16 -top-20 size-64 rounded-full bg-primary/30 blur-3xl" aria-hidden="true" />
          <div className="relative max-w-3xl">
            <div className="flex flex-wrap items-center gap-2"><SectionLabel>Phase 3 · recruiter intelligence</SectionLabel><Badge className="border-white/20 bg-white/10 text-white">Demo foundation</Badge></div>
            <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Cari dengan sinyal yang bisa dijelaskan.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Satu ruang untuk merapikan pencarian talent dan menjaga setiap insight AI tetap dapat ditinjau manusia. Data di halaman ini adalah simulasi lokal, bukan keputusan rekrutmen.</p>
          </div>
          <div className="relative mt-8 flex flex-col gap-3 border-t border-white/15 pt-5 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-center gap-2"><Database className="size-4 text-emerald-300" /> Local demo state · tidak tersimpan ke database</span><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-300" /> Human review tetap diperlukan</span></div>
        </header>

        <div className="mt-8 flex flex-wrap gap-2 border-b" role="tablist" aria-label="Area intelligence">
          <Button variant={tab === "search" ? "secondary" : "ghost"} onClick={() => setTab("search")} role="tab" aria-selected={tab === "search"}><Search className="size-4" /> Search intelligence</Button>
          <Button variant={tab === "governance" ? "secondary" : "ghost"} onClick={() => setTab("governance")} role="tab" aria-selected={tab === "governance"}><ShieldCheck className="size-4" /> Screening governance</Button>
        </div>

        {tab === "search" ? (
          <div className="mt-7 space-y-7">
            <section aria-labelledby="search-overview"><div className="mb-4 flex items-end justify-between gap-4"><div><SectionLabel>Search observatory</SectionLabel><h2 id="search-overview" className="mt-2 text-xl font-bold tracking-tight">Apa yang membuat hasil ini relevan?</h2></div><Badge variant="outline" className="hidden sm:inline-flex"><Activity className="mr-1 size-3" /> Telemetry simulasi</Badge></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Search aktif" value="18" detail="+3 dibanding minggu lalu" icon={Search} /><Metric label="Alert terkirim" value="42" detail="92% dibaca oleh recruiter" icon={Bell} /><Metric label="Match ditinjau" value="128" detail="78% lanjut ke shortlist" icon={UsersRound} /><Metric label="Profile segar" value="64%" detail="Diperbarui ≤ 30 hari" icon={RefreshCw} /></div></section>

            <div className="grid gap-7 lg:grid-cols-[1.1fr_0.9fr]">
              <Card><CardHeader className="flex-row items-start justify-between space-y-0"><div><SectionLabel>Saved searches</SectionLabel><CardTitle className="mt-2 text-lg">Pencarian tersimpan</CardTitle><p className="mt-1 text-sm text-muted-foreground">Alert hanya memberi tahu perubahan pada hasil. Tidak ada auto-contact.</p></div><Button size="sm" variant="outline"><Plus className="size-4" /> Simpan search</Button></CardHeader><CardContent className="space-y-2">{savedSearches.map((search, index) => <div key={search.name} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-primary"><Search className="size-4" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{search.name}</p><p className="mt-1 text-xs text-muted-foreground">{search.detail} · {search.change}</p></div></div><div className="flex items-center gap-2 self-end sm:self-auto"><Button variant="ghost" size="icon" className="size-8" aria-label={`Hapus ${search.name}`}><Trash2 className="size-3.5" /></Button><Button variant={alerts[index] ? "secondary" : "outline"} size="sm" onClick={() => setAlerts((current) => current.map((enabled, itemIndex) => itemIndex === index ? !enabled : enabled))}><Bell className="size-3.5" /> {alerts[index] ? "Alert aktif" : "Nyalakan alert"}</Button></div></div>)}</CardContent></Card>

              <Card><CardHeader><SectionLabel>Ranking control</SectionLabel><CardTitle className="mt-2 text-lg">Kesegaran profile</CardTitle><p className="text-sm text-muted-foreground">Atur prioritas ranking tanpa menghapus sinyal relevansi lainnya.</p></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">{(["balanced", "recent", "complete"] as Freshness[]).map((option) => <button key={option} type="button" onClick={() => setFreshness(option)} className={`rounded-xl border p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${freshness === option ? "border-primary bg-purple-50 text-primary" : "hover:bg-muted"}`} aria-pressed={freshness === option}><span className="font-semibold">{option === "balanced" ? "Seimbang" : option === "recent" ? "Terbaru" : "Terlengkap"}</span><span className="mt-1 block text-xs text-muted-foreground">{option === "balanced" ? "Default" : option === "recent" ? "≤ 30 hari" : "Data terisi"}</span></button>)}</div><div className="mt-4 flex gap-2 rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0 text-primary" />{freshnessCopy}</div><div className="mt-5 flex items-center justify-between border-t pt-4"><span className="text-sm font-medium">Batas freshness</span><span className="font-mono text-sm">30 hari</span></div></CardContent></Card>
            </div>

            <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
              <Card><CardHeader><SectionLabel>Normalization layer</SectionLabel><CardTitle className="mt-2 text-lg">Skill aliases</CardTitle><p className="text-sm text-muted-foreground">Padankan istilah berbeda ke skill canonical sebelum ranking.</p></CardHeader><CardContent className="space-y-3">{aliases.map((alias, index) => <div key={alias.canonical} className="rounded-xl border p-3"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><Tag className="size-4 text-primary" /><span className="text-sm font-semibold">{alias.canonical}</span></div><button type="button" onClick={() => toggleAlias(index)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Hapus alias ${alias.canonical}`}><X className="size-4" /></button></div><div className="mt-2 flex flex-wrap gap-1.5">{alias.aliases.map((item) => <Badge key={item} variant="outline" className="font-normal">{item}</Badge>)}</div><div className="mt-3 flex items-center gap-2"><ProgressBar value={Number.parseInt(alias.coverage, 10)} /><span className="font-mono text-[11px] text-muted-foreground">{alias.coverage}</span></div></div>)}<Button variant="outline" className="w-full"><Plus className="size-4" /> Tambah alias</Button><p className="text-xs leading-5 text-muted-foreground">Demo: perubahan alias hanya berlaku selama sesi ini dan belum mengubah taxonomy produksi.</p></CardContent></Card>

              <Card><CardHeader className="flex-row items-start justify-between space-y-0"><div><SectionLabel>Explainable matching</SectionLabel><CardTitle className="mt-2 text-lg">Signal breakdown</CardTitle><p className="text-sm text-muted-foreground">Contoh penjelasan untuk kandidat yang sedang ditinjau.</p></div><Badge className="bg-emerald-50 text-emerald-800"><Check className="mr-1 size-3" /> Reviewable</Badge></CardHeader><CardContent><div className="rounded-xl bg-[#201c45] p-4 text-white"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-semibold">Alya Rahma</p><p className="mt-1 text-xs text-slate-300">Senior Product Designer · 87 / 100</p></div><span className="font-mono text-3xl font-semibold">87</span></div><div className="mt-4 space-y-3">{matchSignals.map((signal) => <div key={signal.label}><div className="mb-1.5 flex justify-between text-xs"><span>{signal.label}</span><span className="font-mono">{signal.value}%</span></div><ProgressBar value={signal.value} color={signal.color} /></div>)}</div></div><div className="mt-4 divide-y rounded-xl border">{matchSignals.slice(0, showAllSignals ? 3 : 2).map((signal) => <details key={signal.label} className="group p-3"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium"><span className="flex items-center gap-2"><Sparkles className="size-3.5 text-primary" />Mengapa sinyal {signal.label.toLowerCase()}?</span><ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" /></summary><p className="mt-2 pl-5 text-xs leading-5 text-muted-foreground">{signal.note}. Sumber data: profile yang dibagikan kandidat dan metadata role.</p></details>)}</div><Button variant="ghost" size="sm" className="mt-3" onClick={() => setShowAllSignals((visible) => !visible)}>{showAllSignals ? "Sembunyikan detail" : "Lihat semua sinyal"}</Button><p className="mt-3 text-xs leading-5 text-muted-foreground">Skor adalah alat bantu prioritas, bukan probabilitas keberhasilan atau rekomendasi hire.</p></CardContent></Card>
            </div>

            <section aria-labelledby="analytics-heading"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><SectionLabel>Search analytics</SectionLabel><h2 id="analytics-heading" className="mt-2 text-xl font-bold tracking-tight">Kualitas pencarian dari waktu ke waktu</h2></div><label className="flex items-center gap-2 text-sm"><span className="sr-only">Periode analytics</span><SlidersHorizontal className="size-4 text-muted-foreground" /><select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-lg border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option>7 hari</option><option>30 hari</option><option>90 hari</option></select></label></div><div className="grid gap-4 sm:grid-cols-3"><Metric label="Search → profile dibuka" value="36%" detail={`${period} · +8% dari periode sebelumnya`} icon={TrendingUp} /><Metric label="Profile → shortlist" value="18%" detail="Target internal 15% · simulasi" icon={ThumbsUp} /><Metric label="Waktu ke shortlist" value="2,4 hari" detail="Median · belum termasuk outreach" icon={Clock3} /></div></section>

            {recommendationVisible && <Card className="border-primary/20 bg-purple-50/60"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm"><Sparkles className="size-4" /></div><div><p className="text-sm font-semibold">Rekomendasi untuk recruiter</p><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Tambahkan alias “Product research” ke skill “Product discovery”. Pada simulasi ini, 6 profile relevan belum masuk hasil karena variasi istilah.</p></div></div><div className="flex shrink-0 gap-2"><Button size="sm">Tinjau alias</Button><Button variant="ghost" size="icon" className="size-8" onClick={() => setRecommendationVisible(false)} aria-label="Tutup rekomendasi"><X className="size-4" /></Button></div></CardContent></Card>}
          </div>
        ) : (
          <div className="mt-7 space-y-7">
            <section aria-labelledby="governance-overview"><div className="mb-4"><SectionLabel>AI governance ledger</SectionLabel><h2 id="governance-overview" className="mt-2 text-xl font-bold tracking-tight">Jejak audit sebelum insight dipercaya</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Metadata di bawah adalah contoh struktur yang perlu disimpan per run. Semua skor tetap memerlukan pemeriksaan manusia dan consent kandidat.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Rubric aktif" value="v2.3" detail="Dipublikasikan 12 Jun 2026" icon={GitBranch} /><Metric label="Quality agreement" value="84%" detail="AI vs human sample review" icon={Gauge} /><Metric label="Latency p95" value="1,8 dtk" detail="Termasuk 1 retry · demo" icon={Clock3} /><Metric label="AI cost / run" value="$0.018" detail="Estimasi provider sandbox" icon={Activity} /></div></section>

            <div className="grid gap-7 lg:grid-cols-[1.1fr_0.9fr]">
              <Card><CardHeader className="flex-row items-start justify-between space-y-0"><div><SectionLabel>Versioned rubric</SectionLabel><CardTitle className="mt-2 text-lg">Rubric screening · v2.3</CardTitle><p className="mt-1 text-sm text-muted-foreground">Role: Product Designer · status aktif</p></div><Button size="sm" variant="outline"><GitBranch className="size-4" /> Lihat versi</Button></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm"><caption className="sr-only">Dimensi rubric screening versi 2.3</caption><thead className="border-b text-xs text-muted-foreground"><tr><th className="pb-3 font-medium">Dimensi</th><th className="pb-3 font-medium">Bobot</th><th className="pb-3 font-medium">Score</th><th className="pb-3 font-medium">Sumber</th></tr></thead><tbody className="divide-y">{rubricDimensions.map((dimension) => <tr key={dimension.name}><td className="py-3 font-medium">{dimension.name}</td><td className="py-3 font-mono text-xs">{dimension.weight}</td><td className="py-3 font-mono text-xs">{dimension.score}</td><td className="py-3 text-xs text-muted-foreground">{dimension.source}</td></tr>)}</tbody></table></div><div className="mt-4 flex flex-wrap gap-2"><Badge variant="outline"><Check className="mr-1 size-3 text-emerald-600" /> Ada changelog</Badge><Badge variant="outline"><UserRound className="mr-1 size-3" /> Owner: People team</Badge><Badge variant="outline"><Clock3 className="mr-1 size-3" /> Valid sampai 30 Sep</Badge></div></CardContent></Card>

              <Card><CardHeader><SectionLabel>Run context</SectionLabel><CardTitle className="mt-2 text-lg">Snapshot & provider metadata</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div className="flex items-start justify-between gap-4 border-b pb-3"><span className="text-muted-foreground">Candidate input</span><span className="text-right font-mono text-xs">snapshot_2026-08-18_0912</span></div><div className="flex items-start justify-between gap-4 border-b pb-3"><span className="text-muted-foreground">Job input</span><span className="text-right font-mono text-xs">job_pd_saas_v4</span></div><div className="flex items-start justify-between gap-4 border-b pb-3"><span className="text-muted-foreground">Prompt / model</span><span className="text-right font-mono text-xs">screen-v2.3 · gpt-4.1-mini</span></div><div className="flex items-start justify-between gap-4 border-b pb-3"><span className="text-muted-foreground">Provider / request</span><span className="text-right font-mono text-xs">sandbox · req_demo_8f2a</span></div><div className="flex items-start justify-between gap-4"><span className="text-muted-foreground">Retry / latency</span><span className="text-right font-mono text-xs">1 retry · 1,24 dtk</span></div><p className="rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">Snapshot membuat hasil dapat ditelusuri ulang tanpa menimpa profile kandidat yang terus berubah.</p></CardContent></Card>
            </div>

            <div className="grid gap-7 lg:grid-cols-2">
              <Card><CardHeader><SectionLabel>Human-in-the-loop</SectionLabel><CardTitle className="mt-2 text-lg">Override & calibration</CardTitle><p className="text-sm text-muted-foreground">Perbedaan AI dan reviewer dicatat sebagai data perbaikan, bukan disembunyikan.</p></CardHeader><CardContent className="space-y-4"><div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex gap-3"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" /><div><p className="text-sm font-semibold text-amber-900">1 override perlu alasan</p><p className="mt-1 text-xs leading-5 text-amber-800">AI memberi 3,8/5 untuk konteks pengalaman; reviewer memilih 3,0/5 karena pengalaman freelance belum terverifikasi.</p></div></div><label className="mt-3 block text-xs font-semibold text-amber-900" htmlFor="override-reason">Alasan override tersimpan</label><textarea id="override-reason" defaultValue="Bukti pengalaman belum cukup terverifikasi untuk dimensi ini." className="mt-1 min-h-20 w-full rounded-lg border border-amber-200 bg-white p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div><div className="flex items-center justify-between rounded-xl border p-4"><div><p className="text-sm font-semibold">Calibration sample</p><p className="mt-1 text-xs text-muted-foreground">24 run dibandingkan dengan reviewer manusia</p></div><span className="font-mono text-lg font-semibold text-emerald-700">84%</span></div><Button variant="outline" size="sm"><Settings2 className="size-4" /> Atur sample calibration</Button></CardContent></Card>

              <Card><CardHeader><SectionLabel>Quality & bias monitoring</SectionLabel><CardTitle className="mt-2 text-lg">Guardrail evaluasi</CardTitle></CardHeader><CardContent className="space-y-4"><div><div className="mb-2 flex justify-between text-sm"><span className="font-medium">Completeness data</span><span className="font-mono text-xs">91%</span></div><ProgressBar value={91} color="bg-emerald-500" /></div><div><div className="mb-2 flex justify-between text-sm"><span className="font-medium">Konsistensi rubric</span><span className="font-mono text-xs">88%</span></div><ProgressBar value={88} color="bg-primary" /></div><div className="rounded-xl border p-4"><div className="flex items-center gap-2"><Layers3 className="size-4 text-primary" /><p className="text-sm font-semibold">Bias monitoring</p><Badge className="ml-auto bg-emerald-50 text-emerald-800">Tidak ada alert demo</Badge></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Pantau perbedaan error dan coverage antar kelompok hanya jika dasar hukum, consent, dan data evaluasi yang sesuai tersedia. Tidak menggunakan protected attribute untuk ranking.</p></div><Button variant="outline" size="sm"><ArrowUpRight className="size-4" /> Buka evaluasi kualitas</Button></CardContent></Card>
            </div>

            <Card className="border-amber-200 bg-amber-50/60"><CardContent className="flex gap-3 p-5"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" /><div><p className="text-sm font-semibold text-amber-950">Modul financial / credit screening tidak tersedia</p><p className="mt-1 max-w-3xl text-sm leading-6 text-amber-900/80">Tidak ada data finansial, credit score, kemampuan bayar, atau sinyal serupa di halaman ini. Modul tersebut hanya dapat dipertimbangkan sebagai future compliance-gated module setelah legal review, tujuan yang jelas, consent, kontrol akses, dan audit khusus tersedia.</p></div></CardContent></Card>

            <div className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><Bot className="mt-0.5 size-4 shrink-0 text-primary" /><p>AI draft / telemetry demo: nilai, provider, latency, retry, dan cost di atas adalah contoh UI untuk observability. Jangan gunakan sebagai bukti akurasi produksi tanpa evaluasi dan persetujuan governance.</p></div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
