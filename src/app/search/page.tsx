"use client";

import { useEffect, useMemo, useState } from "react";
import { Grid2X2, List, Search as SearchIcon, X } from "lucide-react";
import { candidates } from "@/data/candidates";
import { CandidateCard } from "@/components/talent/candidate-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useApp } from "@/providers/app-provider";
import {
  CAREER_STATUS_CONFIG,
  CareerStatus,
  INDUSTRY_CATEGORY_CONFIG,
  IndustryCategory,
  TALENT_CATEGORY_CONFIG,
  TalentCategory,
  Candidate,
} from "@/types";

const pageSize = 12;

type View = "grid" | "list";

type Filters = {
  q: string;
  view: View;
  page: number;
  sort: string;
  // Checkbox filters (multi-select)
  talentCategories: TalentCategory[];
  careerStatuses: CareerStatus[];
  industries: IndustryCategory[];
  experienceBands: string[];
  locations: string[];
};

const EXPERIENCE_BANDS = [
  { value: "lt1", label: "< 1 tahun", min: 0, max: 0 },
  { value: "1-3", label: "1 – 3 tahun", min: 1, max: 3 },
  { value: "3-5", label: "3 – 5 tahun", min: 3, max: 5 },
  { value: "5-10", label: "5 – 10 tahun", min: 5, max: 10 },
  { value: "gt10", label: "> 10 tahun", min: 10, max: Infinity },
];

const initialFilters: Filters = {
  q: "",
  view: "grid",
  page: 1,
  sort: "relevance",
  talentCategories: [],
  careerStatuses: [],
  industries: [],
  experienceBands: [],
  locations: [],
};

function matchesExperience(exp: number, bands: string[]): boolean {
  if (!bands.length) return true;
  return bands.some((band) => {
    const b = EXPERIENCE_BANDS.find((x) => x.value === band);
    if (!b) return false;
    return exp >= b.min && (b.max === Infinity ? true : exp <= b.max);
  });
}

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

// ────────────────────────────────────────────────────────────────
// Sidebar filter panel (shared between desktop sidebar & mobile drawer)
// ────────────────────────────────────────────────────────────────
function FilterPanel({
  filters,
  onChange,
  onReset,
  locations,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
  locations: string[];
}) {
  const set = (partial: Partial<Filters>) => onChange({ ...filters, ...partial, page: 1 });

  const hasActive =
    filters.talentCategories.length > 0 ||
    filters.careerStatuses.length > 0 ||
    filters.industries.length > 0 ||
    filters.experienceBands.length > 0 ||
    filters.locations.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">Filter Pencarian</p>
        {hasActive && (
          <button
            onClick={onReset}
            className="text-xs text-slate-700 hover:underline"
          >
            Reset semua
          </button>
        )}
      </div>

      {/* ── KATEGORI TALENT ── */}
      <FilterSection label="Kategori Talent">
        {(Object.keys(TALENT_CATEGORY_CONFIG) as TalentCategory[]).map((key) => {
          const cfg = TALENT_CATEGORY_CONFIG[key];
          const active = filters.talentCategories.includes(key);
          return (
            <CheckRow
              key={key}
              id={`cat-${key}`}
              checked={active}
              onChange={() => set({ talentCategories: toggle(filters.talentCategories, key) })}
              label={
                <span className="flex items-center gap-1.5">
                  <span>{cfg.badge}</span>
                  <span className="font-medium">{cfg.label}</span>
                </span>
              }
            />
          );
        })}
      </FilterSection>

      {/* ── STATUS KARIER ── */}
      <FilterSection label="Status Karier">
        {(Object.keys(CAREER_STATUS_CONFIG) as CareerStatus[]).map((key) => {
          const cfg = CAREER_STATUS_CONFIG[key];
          const active = filters.careerStatuses.includes(key);
          return (
            <CheckRow
              key={key}
              id={`cs-${key}`}
              checked={active}
              onChange={() => set({ careerStatuses: toggle(filters.careerStatuses, key) })}
              label={cfg.label}
            />
          );
        })}
      </FilterSection>

      {/* ── INDUSTRI ── */}
      <FilterSection label="Industri">
        {(Object.keys(INDUSTRY_CATEGORY_CONFIG) as IndustryCategory[]).map((key) => {
          const cfg = INDUSTRY_CATEGORY_CONFIG[key];
          const active = filters.industries.includes(key);
          return (
            <CheckRow
              key={key}
              id={`ind-${key}`}
              checked={active}
              onChange={() => set({ industries: toggle(filters.industries, key) })}
              label={cfg.label}
            />
          );
        })}
      </FilterSection>

      {/* ── PENGALAMAN ── */}
      <FilterSection label="Pengalaman">
        {EXPERIENCE_BANDS.map((band) => {
          const active = filters.experienceBands.includes(band.value);
          return (
            <CheckRow
              key={band.value}
              id={`exp-${band.value}`}
              checked={active}
              onChange={() => set({ experienceBands: toggle(filters.experienceBands, band.value) })}
              label={band.label}
            />
          );
        })}
      </FilterSection>

      {/* ── LOKASI ── */}
      <FilterSection label="Lokasi">
        {locations.map((loc) => {
          const active = filters.locations.includes(loc);
          return (
            <CheckRow
              key={loc}
              id={`loc-${loc}`}
              checked={active}
              onChange={() => set({ locations: toggle(filters.locations, loc) })}
              label={loc}
            />
          );
        })}
      </FilterSection>
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#31516e]">{label}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function CheckRow({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: () => void;
  label: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-sm transition-colors hover:bg-slate-50"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 rounded accent-slate-900"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}

// ────────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const { user, dbMode, bootstrapped, databaseError } = useApp();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [remoteCandidates, setRemoteCandidates] = useState<Candidate[]>([]);
  const [remoteLoaded, setRemoteLoaded] = useState(false);

  useEffect(() => {
    if (!dbMode || !bootstrapped) return;
    void fetch("/api/candidates", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { candidates?: Candidate[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Data kandidat belum dapat dimuat.");
        setRemoteCandidates(payload.candidates ?? []);
      })
      .catch(() => setRemoteCandidates([]))
      .finally(() => setRemoteLoaded(true));
  }, [dbMode, bootstrapped]);

  const source = dbMode ? remoteCandidates : candidates;
  const allLocations = useMemo(() => [...new Set(source.map((candidate) => candidate.location))].sort(), [source]);

  const filtered = useMemo(() => {
    const haystack = (c: Candidate) =>
      `${c.name} ${c.role} ${c.location} ${c.skills.join(" ")} ${c.education}`.toLowerCase();

    return source
      .filter((c) => {
        const qMatch = !filters.q || haystack(c).includes(filters.q.toLowerCase());
        const catMatch = !filters.talentCategories.length || filters.talentCategories.includes(c.talentCategory);
        const statusMatch = !filters.careerStatuses.length || (c.careerStatus && filters.careerStatuses.includes(c.careerStatus));
        const indMatch = !filters.industries.length || filters.industries.includes(c.industry);
        const expMatch = matchesExperience(c.experience, filters.experienceBands);
        const locMatch = !filters.locations.length || filters.locations.includes(c.location);
        return qMatch && catMatch && statusMatch && indMatch && expMatch && locMatch;
      })
      .sort((a, b) => {
        if (filters.sort === "experience") return b.experience - a.experience;
        if (filters.sort === "name") return a.name.localeCompare(b.name);
        // default: djoin-verified first
        if (a.talentCategory !== b.talentCategory) {
          return a.talentCategory === "djoin-verified" ? -1 : 1;
        }
        return 0;
      });
  }, [filters, source]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(filters.page, totalPages);
  const results = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeFilterCount =
    filters.talentCategories.length +
    filters.careerStatuses.length +
    filters.industries.length +
    filters.experienceBands.length +
    filters.locations.length;

  const resetFilters = () => setFilters(initialFilters);

  if (!user || user.role !== "recruiter") {
    return <ProtectedRoute role="recruiter"><div /></ProtectedRoute>;
  }

  if (dbMode && !bootstrapped) {
    return <div className="container mx-auto px-4 py-8"><div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground" role="status">Memuat kandidat dari database...</div></div>;
  }

  if (dbMode && databaseError) {
    return <div className="container mx-auto px-4 py-8"><div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700" role="alert">Data kandidat belum dapat dimuat. {databaseError}</div></div>;
  }

  const databaseEmpty = dbMode && remoteLoaded && remoteCandidates.length === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ── Header ── */}
      <div className="flex flex-col justify-between gap-5 border-b pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Jaringan Talent</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827]">Temukan sinyal yang tepat.</h1>
          <p className="mt-2 text-muted-foreground">
            {filtered.length} kandidat ditemukan.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filters.view === "grid" ? "secondary" : "outline"}
            size="icon"
            onClick={() => setFilters((f) => ({ ...f, view: "grid" }))}
            aria-label="Tampilan grid"
          >
            <Grid2X2 />
          </Button>
          <Button
            variant={filters.view === "list" ? "secondary" : "outline"}
            size="icon"
            onClick={() => setFilters((f) => ({ ...f, view: "list" }))}
            aria-label="Tampilan daftar"
          >
            <List />
          </Button>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value, page: 1 }))}
            className="pl-9"
            placeholder="Cari nama, role, keahlian, atau kota..."
            aria-label="Cari talent"
          />
        </div>

        {/* Mobile: filter button */}
        <Button
          variant="outline"
          className="sm:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Buka filter"
        >
          <List className="size-4" />
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{activeFilterCount} filter aktif</span>
          <button
            className="inline-flex items-center gap-1 text-xs text-[#7C3AED] hover:underline"
            onClick={resetFilters}
          >
            Hapus semua <X className="size-3" />
          </button>
        </div>
      )}

      {/* ── Body: sidebar + results ── */}
      <div className="mt-6 flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 sm:block">
          <div className="sticky top-6 rounded-xl border bg-white p-4 shadow-sm">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onReset={resetFilters}
              locations={allLocations}
            />
          </div>
        </aside>

        {/* Results */}
        <div className="min-w-0 flex-1">
          {databaseEmpty ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <h2 className="text-xl font-semibold">Belum ada kandidat di database.</h2>
              <p className="mt-2 text-muted-foreground">Belum ada profil kandidat yang dipublikasikan untuk recruiter.</p>
            </div>
          ) : results.length > 0 ? (
            <div
              className={
                filters.view === "grid"
                  ? "grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col gap-4"
              }
            >
              {results.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  list={filters.view === "list"}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <h2 className="text-xl font-semibold">Tidak ada kandidat yang cocok.</h2>
              <p className="mt-2 text-muted-foreground">
                Coba perluas filter atau hapus salah satu filter.
              </p>
              <Button variant="outline" className="mt-5" onClick={resetFilters}>
                Reset filter
              </Button>
            </div>
          )}

          {/* Pagination */}
          {filtered.length > pageSize && (
            <nav
              className="mt-8 flex flex-wrap justify-center gap-2"
              aria-label="Halaman hasil pencarian"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={n === currentPage ? "default" : "outline"}
                  aria-current={n === currentPage ? "page" : undefined}
                  onClick={() => setFilters((f) => ({ ...f, page: n }))}
                >
                  {n}
                </Button>
              ))}
            </nav>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Filter Pencarian</DialogTitle>
            <DialogDescription>
              Filter langsung diterapkan saat kamu memilih.
            </DialogDescription>
          </DialogHeader>
          <FilterPanel
            filters={filters}
            onChange={(f) => { setFilters(f); }}
            onReset={() => { resetFilters(); setMobileOpen(false); }}
            locations={allLocations}
          />
          <Button className="mt-2 w-full" onClick={() => setMobileOpen(false)}>
            Lihat {filtered.length} kandidat
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
