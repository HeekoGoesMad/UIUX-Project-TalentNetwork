"use client";

import { useMemo, useState } from "react";
import { Grid2X2, List, Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { candidates } from "@/data/candidates";
import { CandidateCard } from "@/components/candidates/candidate-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const pageSize = 12;
const locations = [...new Set(candidates.map((candidate) => candidate.location))].sort();
const educations = [...new Set(candidates.map((candidate) => candidate.education))].sort();
const skills = [...new Set(candidates.flatMap((candidate) => candidate.skills))].sort();
const availabilities = [...new Set(candidates.map((candidate) => candidate.availability))];
type View = "grid" | "list";
type Filters = { q: string; experience: string; location: string; availability: string; skill: string; education: string; salaryMin: string; salaryMax: string; sort: string; view: View; page: number };

function readFilters(params: URLSearchParams): Filters {
  const view = params.get("view") === "list" ? "list" : "grid";
  const page = Math.max(1, Number(params.get("page") || 1) || 1);
  return { q: params.get("q") ?? "", experience: params.get("experience") ?? "", location: params.get("location") ?? "", availability: params.get("availability") ?? "", skill: params.get("skill") ?? "", education: params.get("education") ?? "", salaryMin: params.get("salaryMin") ?? "", salaryMax: params.get("salaryMax") ?? "", sort: params.get("sort") ?? "relevance", view, page };
}

function salaryStart(value: string) {
  return Number(value.replace(/[$k,]/g, "").split("–")[0]) || 0;
}

export default function SearchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const filters = readFilters(params);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const setFilters = (changes: Partial<Filters>) => {
    const next = { ...filters, ...changes, ...(changes.page === undefined ? { page: 1 } : {}) };
    const query = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => { if (value && !(key === "page" && value === 1) && !(key === "view" && value === "grid") && !(key === "sort" && value === "relevance")) query.set(key, String(value)); });
    router.replace(`/search${query.toString() ? `?${query.toString()}` : ""}`);
  };
  const clear = () => { router.replace("/search"); setDraft(readFilters(new URLSearchParams())); };
  const filtered = useMemo(() => candidates.filter((candidate) => {
    const haystack = `${candidate.name} ${candidate.role} ${candidate.location} ${candidate.skills.join(" ")} ${candidate.education}`.toLowerCase();
    const queryMatch = !filters.q || haystack.includes(filters.q.toLowerCase());
    const experienceMatch = !filters.experience || (filters.experience === "0-3" ? candidate.experience <= 3 : filters.experience === "4-6" ? candidate.experience >= 4 && candidate.experience <= 6 : candidate.experience >= 7);
    const salary = salaryStart(candidate.salary);
    return queryMatch && experienceMatch && (!filters.location || candidate.location === filters.location) && (!filters.availability || candidate.availability === filters.availability) && (!filters.skill || candidate.skills.includes(filters.skill)) && (!filters.education || candidate.education === filters.education) && (!filters.salaryMin || salary >= Number(filters.salaryMin)) && (!filters.salaryMax || salary <= Number(filters.salaryMax));
  }).sort((a, b) => filters.sort === "experience" ? b.experience - a.experience : filters.sort === "salary-low" ? salaryStart(a.salary) - salaryStart(b.salary) : filters.sort === "salary-high" ? salaryStart(b.salary) - salaryStart(a.salary) : a.name.localeCompare(b.name)), [filters]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(filters.page, totalPages);
  const results = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeCount = [filters.experience, filters.location, filters.availability, filters.skill, filters.education, filters.salaryMin, filters.salaryMax].filter(Boolean).length;
  const filterControls = <div className="space-y-4">
    <label className="block text-sm font-medium">Experience<select value={draft.experience} onChange={(e) => setDraft({ ...draft, experience: e.target.value })} className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Any experience</option><option value="0-3">0–3 years</option><option value="4-6">4–6 years</option><option value="7+">7+ years</option></select></label>
    <label className="block text-sm font-medium">Location<select value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Any location</option>{locations.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="block text-sm font-medium">Availability<select value={draft.availability} onChange={(e) => setDraft({ ...draft, availability: e.target.value })} className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Any availability</option>{availabilities.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="block text-sm font-medium">Skills<select value={draft.skill} onChange={(e) => setDraft({ ...draft, skill: e.target.value })} className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Any skill</option>{skills.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="block text-sm font-medium">Education<select value={draft.education} onChange={(e) => setDraft({ ...draft, education: e.target.value })} className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Any education</option>{educations.map((item) => <option key={item}>{item}</option>)}</select></label>
    <div><p className="text-sm font-medium">Salary range (starting $k)</p><div className="mt-1 grid grid-cols-2 gap-2"><Input type="number" min="0" placeholder="Min" value={draft.salaryMin} onChange={(e) => setDraft({ ...draft, salaryMin: e.target.value })} aria-label="Minimum salary" /><Input type="number" min="0" placeholder="Max" value={draft.salaryMax} onChange={(e) => setDraft({ ...draft, salaryMax: e.target.value })} aria-label="Maximum salary" /></div></div>
    <Button className="w-full" onClick={() => { setFilters(draft); setDrawerOpen(false); }}>Apply filters</Button>
  </div>;
  return <div className="container mx-auto px-4 py-8"><div className="flex flex-col justify-between gap-5 border-b pb-7 sm:flex-row sm:items-end"><div><p className="font-mono text-xs uppercase tracking-widest text-primary">Talent network</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Find the right signal.</h1><p className="mt-2 text-muted-foreground">{filtered.length} people open to a thoughtful conversation.</p></div><div className="flex gap-2"><Button variant={filters.view === "grid" ? "secondary" : "outline"} size="icon" onClick={() => setFilters({ view: "grid" })} aria-label="Grid view"><Grid2X2 /></Button><Button variant={filters.view === "list" ? "secondary" : "outline"} size="icon" onClick={() => setFilters({ view: "list" })} aria-label="List view"><List /></Button></div></div>
    <div className="mt-6 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={filters.q} onChange={(e) => setFilters({ q: e.target.value })} className="pl-9" placeholder="Search role, skill, or city" aria-label="Search talent" /></div><Button variant="outline" onClick={() => { setDraft(filters); setDrawerOpen(true); }}><SlidersHorizontal className="size-4" /> Filters {activeCount > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{activeCount}</span>}</Button><select value={filters.sort} onChange={(e) => setFilters({ sort: e.target.value })} className="h-9 rounded-md border bg-background px-3 text-sm" aria-label="Sort results"><option value="relevance">Sort: Relevance</option><option value="experience">Most experience</option><option value="salary-low">Salary: low to high</option><option value="salary-high">Salary: high to low</option></select></div>
    {activeCount > 0 && <div className="mt-4 flex flex-wrap items-center gap-2 text-sm"><span className="text-muted-foreground">Active filters:</span><button className="inline-flex items-center gap-1 text-primary hover:underline" onClick={clear}>Clear all <X className="size-3" /></button></div>}
    {results.length ? <div className={filters.view === "grid" ? "mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "mt-8 flex flex-col gap-4"}>{results.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} list={filters.view === "list"} />)}</div> : <div className="mt-12 rounded-lg border border-dashed p-10 text-center"><h2 className="text-xl font-semibold">No profiles match those filters.</h2><p className="mt-2 text-muted-foreground">Try widening the search or clearing one of the filters.</p><Button variant="outline" className="mt-5" onClick={clear}>Reset filters</Button></div>}
    {filtered.length > pageSize && <nav className="mt-8 flex flex-wrap justify-center gap-2" aria-label="Search results pages">{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <Button key={number} size="sm" variant={number === currentPage ? "default" : "outline"} aria-current={number === currentPage ? "page" : undefined} onClick={() => setFilters({ page: number })}>{number}</Button>)}</nav>}
    <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}><DialogContent className="max-h-[90vh] overflow-auto sm:max-w-md"><DialogHeader><DialogTitle>Filter talent</DialogTitle><DialogDescription>Refine the network, then apply all filters at once.</DialogDescription></DialogHeader>{filterControls}</DialogContent></Dialog>
  </div>;
}
