"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Database, Grid2X2, List, Search as SearchIcon, X } from "lucide-react";
import { candidates } from "@/data/candidates";
import { CandidateCard } from "@/components/talent/candidate-card";
import { EmptyState } from "@/components/shared/empty-state";
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

type SortOption = "relevance" | "experience" | "name";

type Filters = {
  q: string;
  view: View;
  page: number;
  sort: SortOption;
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

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Paling relevan" },
  { value: "experience", label: "Pengalaman terbanyak" },
  { value: "name", label: "Nama A–Z" },
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

type ParamSource = { get(key: string): string | null };

function parseFilters(params: ParamSource): Filters {
  const list = (key: string, allowed?: readonly string[]): string[] => {
    const raw = params.get(key);
    if (!raw) return [];
    const values = raw.split(",").map((v) => v.trim()).filter(Boolean);
    return allowed ? values.filter((v) => allowed.includes(v)) : values;
  };
  const pageRaw = Number.parseInt(params.get("page") ?? "", 10);
  const sortRaw = params.get("sort");
  const viewRaw = params.get("view");
  return {
    q: params.get("q") ?? "",
    view: viewRaw === "list" ? "list" : "grid",
    page: Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1,
    sort: sortRaw === "experience" || sortRaw === "name" ? sortRaw : "relevance",
    talentCategories: list("cat", Object.keys(TALENT_CATEGORY_CONFIG)) as TalentCategory[],
    careerStatuses: list("cs", Object.keys(CAREER_STATUS_CONFIG)) as CareerStatus[],
    industries: list("ind", Object.keys(INDUSTRY_CATEGORY_CONFIG)) as IndustryCategory[],
    experienceBands: list("exp", EXPERIENCE_BANDS.map((b) => b.value)),
    locations: list("loc"),
  };
}

function filtersToQuery(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.sort !== "relevance") params.set("sort", filters.sort);
  if (filters.view !== "grid") params.set("view", filters.view);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.talentCategories.length) params.set("cat", filters.talentCategories.join(","));
  if (filters.careerStatuses.length) params.set("cs", filters.careerStatuses.join(","));
  if (filters.industries.length) params.set("ind", filters.industries.join(","));
  if (filters.experienceBands.length) params.set("exp", filters.experienceBands.join(","));
  if (filters.locations.length) params.set("loc", filters.locations.join(","));
  return params.toString();
}

function getPageItems(totalPages: number, currentPage: number): (number | "gap")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const wanted = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  let prev = 0;
  for (const n of pages) {
    if (n - prev > 1) items.push("gap");
    items.push(n);
    prev = n;
  }
  return items;
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
        className="size-4 rounded accent-primary"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}

function SearchResultsSkeleton() {
  return (
    <div role="status">
      <p className="mb-4 text-sm text-muted-foreground">Memuat kandidat...</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: pageSize }, (_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-lg border bg-muted/50" />
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────────
function SearchPageContent() {
  const { user, dbMode, bootstrapped, databaseError } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => parseFilters(searchParams));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [remoteCandidates, setRemoteCandidates] = useState<Candidate[]>([]);
  const [remoteLoaded, setRemoteLoaded] = useState(false);

  const urlQuery = searchParams.toString();
  const syncedQueryRef = useRef(urlQuery);
  const urlTimerRef = useRef<number | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const query = filtersToQuery(filters);
    if (query === syncedQueryRef.current) return;
    if (urlTimerRef.current !== null) window.clearTimeout(urlTimerRef.current);
    urlTimerRef.current = window.setTimeout(() => {
      urlTimerRef.current = null;
      syncedQueryRef.current = query;
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 300);
    return () => {
      if (urlTimerRef.current !== null) {
        window.clearTimeout(urlTimerRef.current);
        urlTimerRef.current = null;
      }
    };
  }, [filters, pathname, router]);

  useEffect(() => {
    if (urlQuery === syncedQueryRef.current) return;
    if (urlTimerRef.current !== null) {
      window.clearTimeout(urlTimerRef.current);
      urlTimerRef.current = null;
    }
    syncedQueryRef.current = urlQuery;
    setFilters(parseFilters(new URLSearchParams(urlQuery)));
  }, [urlQuery]);

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

  const clearSearch = () => {
    setFilters((f) => ({ ...f, q: "", page: 1 }));
    document.getElementById("search-talent")?.focus();
  };

  const goToPage = (page: number) => {
    setFilters((f) => ({ ...f, page }));
    const el = resultsRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = el ? el.getBoundingClientRect().top + window.scrollY : 0;
    window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
  };

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
  const showRemoteLoading = dbMode && !remoteLoaded;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ── Header ── */}
      <div className="flex flex-col justify-between gap-5 border-b pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Jaringan Talent</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827]">Temukan sinyal yang tepat.</h1>
          <p className="mt-2 text-muted-foreground" aria-live="polite">
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
            id="search-talent"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value, page: 1 }))}
            className={filters.q ? "pl-9 pr-9" : "pl-9"}
            placeholder="Cari nama, role, keahlian, atau kota..."
            aria-label="Cari talent"
          />
          {filters.q && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Hapus pencarian"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          )}
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
        <div className="min-w-0 flex-1" ref={resultsRef}>
          {!showRemoteLoading && (
            <div className="mb-4 flex items-center justify-end gap-2">
              <label htmlFor="sort-results" className="text-xs font-medium text-muted-foreground">
                Urutkan
              </label>
              <select
                id="sort-results"
                name="sort"
                value={filters.sort}
                onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as SortOption, page: 1 }))}
                className="h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {databaseEmpty ? (
            <EmptyState
              icon={Database}
              title="Belum ada kandidat di database."
              description="Belum ada profil kandidat yang dipublikasikan untuk recruiter."
            />
          ) : showRemoteLoading ? (
            <SearchResultsSkeleton />
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
            <EmptyState
              icon={SearchIcon}
              title="Tidak ada kandidat yang cocok."
              description="Coba perluas filter atau hapus salah satu filter."
              action={
                <Button variant="outline" onClick={resetFilters}>
                  Reset filter
                </Button>
              }
            />
          )}

          {/* Pagination */}
          {filtered.length > pageSize && !showRemoteLoading && (
            <nav
              className="mt-8 flex flex-wrap items-center justify-center gap-2"
              aria-label="Halaman hasil pencarian"
            >
              {getPageItems(totalPages, currentPage).map((item, index) =>
                item === "gap" ? (
                  <span
                    key={`gap-${index}`}
                    className="px-1 text-sm text-muted-foreground"
                    aria-hidden="true"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    size="sm"
                    variant={item === currentPage ? "default" : "outline"}
                    aria-current={item === currentPage ? "page" : undefined}
                    onClick={() => goToPage(item)}
                  >
                    {item}
                  </Button>
                )
              )}
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

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8" role="status" aria-label="Memuat pencarian">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="mt-6 h-10 animate-pulse rounded bg-muted" />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-lg border bg-muted/50" />
            ))}
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
