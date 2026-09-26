"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  Banknote,
  Check,
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  employmentLabels,
  arrangementLabels,
  experienceLabels,
  educationLabels,
  categoryLabels,
  type EmploymentType,
  type WorkArrangement,
  type ExperienceLevel,
  type EducationLevel,
  type JobCategory,
  type Job,
} from "@/lib/jobs";

export type JobSortOption = "newest" | "salary_high" | "vacancies";

export interface JobFilterValues {
  q: string;
  types: EmploymentType[];
  arrangements: WorkArrangement[];
  categories: JobCategory[];
  experience: ExperienceLevel[];
  education: EducationLevel[];
  minSalary: number;
  negotiableOnly: boolean;
  locations: string[];
  verifiedOnly: boolean;
  sort: JobSortOption;
}

export const INITIAL_JOB_FILTERS: JobFilterValues = {
  q: "",
  types: [],
  arrangements: [],
  categories: [],
  experience: [],
  education: [],
  minSalary: 0,
  negotiableOnly: false,
  locations: [],
  verifiedOnly: false,
  sort: "newest",
};

export const SALARY_PRESETS = [
  { value: 0, label: "Semua Rentang Gaji" },
  { value: 5000000, label: "≥ Rp 5.000.000 / bln" },
  { value: 10000000, label: "≥ Rp 10.000.000 / bln" },
  { value: 15000000, label: "≥ Rp 15.000.000 / bln" },
  { value: 20000000, label: "≥ Rp 20.000.000 / bln" },
  { value: 30000000, label: "≥ Rp 30.000.000 / bln" },
] as const;

export const SORT_OPTIONS: { value: JobSortOption; label: string }[] = [
  { value: "newest", label: "Terbaru Dipublikasi" },
  { value: "salary_high", label: "Gaji Tertinggi" },
  { value: "vacancies", label: "Kuota Penerimaan Terbanyak" },
];

export const POPULAR_LOCATIONS = [
  { value: "jakarta", label: "DKI Jakarta / Jabodetabek" },
  { value: "bandung", label: "Bandung, Jawa Barat" },
  { value: "surabaya", label: "Surabaya, Jawa Timur" },
  { value: "yogyakarta", label: "D.I. Yogyakarta" },
  { value: "tangerang", label: "Tangerang / BSD City" },
  { value: "bali", label: "Denpasar / Bali" },
  { value: "batam", label: "Batam, Kep. Riau" },
];

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface JobMultiSelectDropdownProps {
  label: string;
  icon: LucideIcon;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (nextValues: string[]) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  popoverWidth?: string;
}

/**
 * Reusable multi-select dropdown popover following the hybrid pattern:
 * - Keeps local draft while open to prevent UI flicker / jumping while selecting multiple items
 * - Footer provides explicit "Reset" and "Terapkan (N)" buttons
 * - Auto-applies changes when clicking outside or pressing Escape so no choices are lost
 */
export function JobMultiSelectDropdown({
  label,
  icon: Icon,
  options,
  selectedValues,
  onChange,
  searchable = false,
  searchPlaceholder = "Cari opsi...",
  popoverWidth = "w-72 sm:w-80",
}: JobMultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftValues, setDraftValues] = useState<string[]>(selectedValues);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggleOpen = () => {
    if (!isOpen) {
      setDraftValues(selectedValues);
      setSearchTerm("");
      setIsOpen(true);
    } else {
      onChange(draftValues);
      setIsOpen(false);
    }
  };

  // Click outside listener: auto-applies and closes
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Auto-apply current draft values on click outside
        onChange(draftValues);
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onChange(draftValues);
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, draftValues, onChange]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm.trim()) return options;
    const lower = searchTerm.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lower));
  }, [options, searchable, searchTerm]);

  const toggleOption = (val: string) => {
    setDraftValues((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleApply = () => {
    onChange(draftValues);
    setIsOpen(false);
  };

  const handleReset = () => {
    setDraftValues([]);
  };

  const activeCount = selectedValues.length;
  const draftCount = draftValues.length;

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={handleToggleOpen}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer select-none",
          activeCount > 0
            ? "border-primary/50 bg-primary/10 text-primary ring-1 ring-primary/20"
            : "border-input bg-card text-foreground hover:bg-muted/60 hover:border-border",
          isOpen && "ring-2 ring-primary/20 border-primary"
        )}
      >
        <Icon className={cn("size-3.5 shrink-0", activeCount > 0 ? "text-primary" : "text-muted-foreground")} />
        <span>{label}</span>
        {activeCount > 0 && (
          <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white leading-none">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={`Filter ${label}`}
          className={cn(
            "absolute left-0 top-full mt-2 z-50 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl p-3 text-foreground shadow-[0_16px_40px_rgba(15,23,42,0.14)] animate-in fade-in-0 zoom-in-95",
            popoverWidth
          )}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-xs font-bold text-foreground">
              {label} {draftCount > 0 && <span className="text-primary font-mono">({draftCount})</span>}
            </span>
            <span className="text-[11px] text-muted-foreground">Multi-pilihan</span>
          </div>

          {/* Search input for long lists */}
          {searchable && (
            <div className="pt-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-8 rounded-lg border border-input bg-muted/30 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary/20"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options Checklist */}
          <div className="mt-2 max-h-56 overflow-y-auto space-y-1 pr-1">
            {filteredOptions.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Tidak ada opsi yang sesuai
              </p>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = draftValues.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    onClick={() => toggleOption(opt.value)}
                    className={cn(
                      "flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors select-none",
                      isChecked ? "bg-primary/8 text-primary" : "text-foreground hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "size-4 rounded-md border flex items-center justify-center transition-colors shrink-0",
                          isChecked
                            ? "bg-primary border-primary text-white"
                            : "border-slate-300 bg-white"
                        )}
                      >
                        {isChecked && <Check className="size-3 stroke-[2.5]" />}
                      </div>
                      <span className={cn("truncate", isChecked && "font-semibold")}>
                        {opt.label}
                      </span>
                    </div>
                    {opt.count !== undefined && (
                      <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                        {opt.count}
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>

          {/* Popover Footer: Reset & Apply Buttons */}
          <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={draftCount === 0}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="h-8 px-3.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg shadow-2xs cursor-pointer"
            >
              Terapkan {draftCount > 0 ? `(${draftCount})` : ""}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Custom Dropdown for Salary Filter:
 * - Minimum monthly salary presets
 * - Checkbox for negotiable salary only
 */
export function JobSalaryDropdown({
  minSalary,
  negotiableOnly,
  onChange,
}: {
  minSalary: number;
  negotiableOnly: boolean;
  onChange: (salary: number, negotiable: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftSalary, setDraftSalary] = useState(minSalary);
  const [draftNegotiable, setDraftNegotiable] = useState(negotiableOnly);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggleOpen = () => {
    if (!isOpen) {
      setDraftSalary(minSalary);
      setDraftNegotiable(negotiableOnly);
      setIsOpen(true);
    } else {
      onChange(draftSalary, draftNegotiable);
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onChange(draftSalary, draftNegotiable);
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onChange(draftSalary, draftNegotiable);
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, draftSalary, draftNegotiable, onChange]);

  const isFiltered = minSalary > 0 || negotiableOnly;

  const handleApply = () => {
    onChange(draftSalary, draftNegotiable);
    setIsOpen(false);
  };

  const handleReset = () => {
    setDraftSalary(0);
    setDraftNegotiable(false);
  };

  const displayLabel = useMemo(() => {
    if (minSalary > 0 && negotiableOnly) {
      return `≥ Rp ${minSalary / 1000000} Jt + Nego`;
    }
    if (minSalary > 0) {
      return `≥ Rp ${minSalary / 1000000} Juta`;
    }
    if (negotiableOnly) {
      return "Gaji Negosiasi";
    }
    return "Rentang Gaji";
  }, [minSalary, negotiableOnly]);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={handleToggleOpen}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer select-none",
          isFiltered
            ? "border-emerald-300 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300/40"
            : "border-input bg-card text-foreground hover:bg-muted/60 hover:border-border",
          isOpen && "ring-2 ring-emerald-400/20 border-emerald-400"
        )}
      >
        <Banknote className={cn("size-3.5 shrink-0", isFiltered ? "text-emerald-700" : "text-muted-foreground")} />
        <span>{displayLabel}</span>
        {isFiltered && (
          <span className="flex size-4.5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white leading-none">
            {minSalary > 0 && negotiableOnly ? 2 : 1}
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180 text-emerald-700"
          )}
        />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Filter Rentang Gaji"
          className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl p-3 text-foreground shadow-[0_16px_40px_rgba(15,23,42,0.14)] animate-in fade-in-0 zoom-in-95"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-xs font-bold text-foreground">Rentang Gaji Bulanan</span>
            <span className="text-[11px] text-muted-foreground">IDR / Bulan</span>
          </div>

          <div className="mt-2 space-y-1">
            {SALARY_PRESETS.map((preset) => {
              const isSelected = draftSalary === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setDraftSalary(preset.value)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors text-left",
                    isSelected
                      ? "bg-emerald-50 text-emerald-800 font-semibold"
                      : "text-foreground hover:bg-slate-100"
                  )}
                >
                  <span>{preset.label}</span>
                  {isSelected && <Check className="size-3.5 text-emerald-600 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-border/60">
            <label
              onClick={() => setDraftNegotiable((prev) => !prev)}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-medium cursor-pointer hover:bg-slate-100 transition-colors select-none"
            >
              <div
                className={cn(
                  "size-4 rounded-md border flex items-center justify-center transition-colors shrink-0",
                  draftNegotiable
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "border-slate-300 bg-white"
                )}
              >
                {draftNegotiable && <Check className="size-3 stroke-[2.5]" />}
              </div>
              <span className="text-foreground">Hanya yang dapat dinegosiasi</span>
            </label>
          </div>

          <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={draftSalary === 0 && !draftNegotiable}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="h-8 px-3.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-2xs cursor-pointer"
            >
              Terapkan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Dropdown for sorting jobs
 */
export function JobSortDropdown({
  value,
  onChange,
}: {
  value: JobSortOption;
  onChange: (sort: JobSortOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const activeOption = SORT_OPTIONS.find((opt) => opt.value === value) ?? SORT_OPTIONS[0];

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl border border-input bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-2xs hover:bg-muted/60 transition-all cursor-pointer select-none",
          isOpen && "ring-2 ring-primary/20 border-primary"
        )}
      >
        <ArrowUpDown className="size-3.5 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground hidden sm:inline">Urutan:</span>
        <span className="font-semibold text-foreground">{activeOption.label}</span>
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Urutkan Lowongan"
          className="absolute right-0 top-full mt-2 z-50 w-60 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl p-2 text-foreground shadow-[0_16px_40px_rgba(15,23,42,0.14)] animate-in fade-in-0 zoom-in-95"
        >
          <div className="space-y-1">
            {SORT_OPTIONS.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors text-left",
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground hover:bg-slate-100"
                  )}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="size-3.5 text-primary stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Active Filter Chips Ribbon with individual dismiss and clear-all
 */
export function JobActiveFilterChips({
  filters,
  onRemoveFilter,
  onClearAll,
}: {
  filters: JobFilterValues;
  onRemoveFilter: (key: keyof JobFilterValues, value?: string) => void;
  onClearAll: () => void;
}) {
  const chips: { key: keyof JobFilterValues; val?: string; label: string; prefix: string }[] = [];

  // Tipe Kerja
  filters.types.forEach((type) => {
    chips.push({
      key: "types",
      val: type,
      prefix: "Tipe",
      label: employmentLabels[type] || type,
    });
  });

  // Penempatan
  filters.arrangements.forEach((arr) => {
    chips.push({
      key: "arrangements",
      val: arr,
      prefix: "Lokasi",
      label: arrangementLabels[arr] || arr,
    });
  });

  // Kategori Bidang
  filters.categories.forEach((cat) => {
    chips.push({
      key: "categories",
      val: cat,
      prefix: "Bidang",
      label: categoryLabels[cat] || cat,
    });
  });

  // Pengalaman
  filters.experience.forEach((exp) => {
    chips.push({
      key: "experience",
      val: exp,
      prefix: "Pengalaman",
      label: experienceLabels[exp] || exp,
    });
  });

  // Pendidikan
  filters.education.forEach((edu) => {
    chips.push({
      key: "education",
      val: edu,
      prefix: "Pendidikan",
      label: educationLabels[edu] || edu,
    });
  });

  // Rentang Gaji
  if (filters.minSalary > 0) {
    chips.push({
      key: "minSalary",
      prefix: "Gaji",
      label: `≥ Rp ${(filters.minSalary / 1000000).toLocaleString("id-ID")} Jt`,
    });
  }

  // Gaji Negosiasi
  if (filters.negotiableOnly) {
    chips.push({
      key: "negotiableOnly",
      prefix: "Gaji",
      label: "Bisa Nego",
    });
  }

  // Lokasi Kota
  filters.locations.forEach((loc) => {
    const found = POPULAR_LOCATIONS.find((p) => p.value === loc);
    chips.push({
      key: "locations",
      val: loc,
      prefix: "Kota",
      label: found ? found.label.split(",")[0] : loc,
    });
  });

  // Perusahaan Terverifikasi
  if (filters.verifiedOnly) {
    chips.push({
      key: "verifiedOnly",
      prefix: "Perusahaan",
      label: "Terverifikasi Resmi",
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-3">
      <span className="text-[11px] font-semibold text-muted-foreground mr-1 flex items-center gap-1">
        <SlidersHorizontal className="size-3" />
        Filter Aktif:
      </span>

      {chips.map((chip, idx) => (
        <span
          key={`${chip.key}-${chip.val || idx}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 pl-2.5 pr-1.5 py-1 text-xs font-medium text-primary shadow-2xs"
        >
          <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
            {chip.prefix}:
          </span>
          <span className="font-semibold text-foreground">{chip.label}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter(chip.key, chip.val)}
            className="rounded-md p-0.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
            aria-label={`Hapus filter ${chip.label}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors gap-1 ml-1"
      >
        <RotateCcw className="size-3" />
        <span>Hapus Semua</span>
      </Button>
    </div>
  );
}

/**
 * Filter evaluation engine
 */
export function applyJobFilters(jobs: Job[], filters: JobFilterValues): Job[] {
  return jobs.filter((job) => {
    // 1. Keyword query matching (Title, Company, Description, Skills, Location)
    if (filters.q.trim()) {
      const qLower = filters.q.toLowerCase();
      const titleMatch = job.title.toLowerCase().includes(qLower);
      const companyMatch = (job.organization?.name || job.organizationName || "")
        .toLowerCase()
        .includes(qLower);
      const descMatch = job.description.toLowerCase().includes(qLower);
      const locMatch = (job.location || "").toLowerCase().includes(qLower);
      const reqMatch = job.requirements.some((r) => r.name.toLowerCase().includes(qLower));

      if (!titleMatch && !companyMatch && !descMatch && !locMatch && !reqMatch) {
        return false;
      }
    }

    // 2. Tipe Pekerjaan (Employment Type)
    if (filters.types.length > 0) {
      if (!filters.types.includes(job.employmentType)) {
        return false;
      }
    }

    // 3. Penempatan Kerja (Work Arrangement)
    if (filters.arrangements.length > 0) {
      if (!filters.arrangements.includes(job.workArrangement)) {
        return false;
      }
    }

    // 4. Kategori Bidang (Job Category)
    if (filters.categories.length > 0) {
      if (!job.jobCategory || !filters.categories.includes(job.jobCategory as JobCategory)) {
        return false;
      }
    }

    // 5. Pengalaman Kerja (Experience Level)
    if (filters.experience.length > 0) {
      if (!job.experienceLevel || !filters.experience.includes(job.experienceLevel as ExperienceLevel)) {
        return false;
      }
    }

    // 6. Pendidikan Minimal (Minimum Education)
    if (filters.education.length > 0) {
      if (!job.minEducation || !filters.education.includes(job.minEducation as EducationLevel)) {
        return false;
      }
    }

    // 7. Rentang Gaji Minimal
    if (filters.minSalary > 0) {
      const salaryEffective = job.salaryMax || job.salaryMin || 0;
      if (salaryEffective < filters.minSalary) {
        return false;
      }
    }

    // 8. Hanya Gaji yang Bisa Dinegosiasi
    if (filters.negotiableOnly) {
      if (!job.isSalaryNegotiable) {
        return false;
      }
    }

    // 9. Lokasi / Kota
    if (filters.locations.length > 0) {
      const jobLoc = (job.location || "").toLowerCase();
      const matchesAnyLocation = filters.locations.some((loc) => {
        if (loc === "jakarta") return jobLoc.includes("jakarta") || jobLoc.includes("dki");
        if (loc === "bandung") return jobLoc.includes("bandung");
        if (loc === "surabaya") return jobLoc.includes("surabaya");
        if (loc === "yogyakarta") return jobLoc.includes("yogyakarta") || jobLoc.includes("jogja");
        if (loc === "tangerang") return jobLoc.includes("tangerang") || jobLoc.includes("bsd");
        if (loc === "bali") return jobLoc.includes("bali") || jobLoc.includes("denpasar");
        if (loc === "batam") return jobLoc.includes("batam");
        return jobLoc.includes(loc.toLowerCase());
      });

      // If job is 100% remote, it also satisfies location filter unless user selected specific city only
      const isRemote = job.workArrangement === "remote";
      if (!matchesAnyLocation && !isRemote) {
        return false;
      }
    }

    // 10. Perusahaan Terverifikasi Resmi
    if (filters.verifiedOnly) {
      if (job.organization?.verificationStatus !== "approved") {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort engine for jobs
 */
export function sortJobs(jobs: Job[], sort: JobSortOption): Job[] {
  const sorted = [...jobs];
  switch (sort) {
    case "salary_high":
      return sorted.sort((a, b) => {
        const salaryA = a.salaryMax || a.salaryMin || 0;
        const salaryB = b.salaryMax || b.salaryMin || 0;
        return salaryB - salaryA;
      });
    case "vacancies":
      return sorted.sort((a, b) => {
        const vacA = a.vacanciesCount || 1;
        const vacB = b.vacanciesCount || 1;
        return vacB - vacA;
      });
    case "newest":
    default:
      return sorted.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
  }
}
