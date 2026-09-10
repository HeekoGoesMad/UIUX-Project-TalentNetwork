/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Brain,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  ExternalLink,
  Eye,
  FileUp,
  GraduationCap,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/providers/app-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndonesianPhoneInput } from "@/components/ui/phone-input";
import { PARTNER_CAMPUSES, type CvProfile, type EducationItem, type ExperienceItem } from "@/types";
import { cn } from "@/lib/utils";
import { CvDownload } from "./cv-download";
import { CvUnsavedBar } from "./cv-unsaved-bar";
import { ProfessionalSummaryModal } from "./professional-summary-modal";
import { PersonalityModal } from "./personality-modal";
import { ImageCropDialog } from "@/components/ui/image-crop-dialog";

function blank(email = "", fullName = ""): CvProfile {
 return {
   id: "new-cv",
  fullName,
  headline: "",
  about: "",
  location: "",
  email,
  phone: "",
  salary: "",
  skills: [],
  hardCompetencies: [],
  tools: [],
  softSkills: [],
  industries: [],
  experience: [],
  education: [],
  certifications: [],
  portfolio: [],
  targetRole: "",
  workArrangement: "hybrid",
  openToWork: true,
  careerStatus: "open-to-work",
  updatedAt: new Date().toISOString(),
 };
}

// ─── Helpers ────────────────────────────────────────────────────
// ─── Helpers ────────────────────────────────────────────────────
function Field({
  label,
  hint,
  children,
  span2,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  span2?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1.5 text-sm font-medium${span2 ? " md:col-span-2" : ""}`}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      {children}
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";
const textareaCls =
  "min-h-24 w-full rounded-md border bg-background p-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";
const maxPdfBytes = 5 * 1024 * 1024;

// ─── Section wrapper ─────────────────────────────────────────────
function FormSection({
  id,
  title,
  icon,
  children,
}: {
  id?: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-20 space-y-4">
      <div className="flex items-center gap-2 border-b pb-2">
        {icon}
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function CompetencyTagInput({
  tags,
  onChange,
  placeholder,
  colorScheme = "purple",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  colorScheme?: "purple" | "slate" | "emerald";
}) {
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addCurrent = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    const updated = Array.from(new Set([...tags, ...parts]));
    onChange(updated);
    setInputVal("");
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const badgeStyles = {
    purple: "bg-purple-50 text-[#7C3AED] border-purple-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
  };

  return (
    <div
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("button")) {
          inputRef.current?.focus();
        }
      }}
      className="rounded-lg border bg-background p-2 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 cursor-text"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeStyles[colorScheme]}`}
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(idx);
              }}
              className="hover:opacity-75 focus:outline-none"
              aria-label={`Hapus ${tag}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="h-7 min-w-[150px] flex-1 border-0 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
          value={inputVal}
          onChange={(e) => {
            const val = e.target.value;
            if (val.includes(",")) {
              const parts = val.split(",").map((s) => s.trim()).filter(Boolean);
              if (parts.length > 0) {
                onChange(Array.from(new Set([...tags, ...parts])));
              }
              setInputVal("");
            } else {
              setInputVal(val);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addCurrent();
            } else if (e.key === "Backspace" && !inputVal && tags.length > 0) {
              removeTag(tags.length - 1);
            }
          }}
          onBlur={addCurrent}
          placeholder={tags.length === 0 ? placeholder : "+ ketik lalu tekan koma / enter..."}
        />
      </div>
    </div>
  );
}

// Helper to deterministically serialize only user-editable fields (excluding timestamps/metadata)
function serializeCvData(p: CvProfile | null | undefined): string {
  if (!p) return "";
  return JSON.stringify({
    fullName: (p.fullName ?? "").trim(),
    headline: (p.headline ?? "").trim(),
    about: (p.about ?? "").trim(),
    location: (p.location ?? "").trim(),
    email: (p.email ?? "").trim(),
    phone: (p.phone ?? "").trim(),
    skills: p.skills ?? [],
    hardCompetencies: p.hardCompetencies ?? [],
    tools: p.tools ?? [],
    softSkills: p.softSkills ?? [],
    industries: p.industries ?? [],
    experience: p.experience ?? [],
    education: p.education ?? [],
    certifications: p.certifications ?? [],
    portfolio: p.portfolio ?? [],
    targetRole: (p.targetRole ?? "").trim(),
    workArrangement: p.workArrangement ?? "hybrid",
    openToWork: Boolean(p.openToWork),
    careerStatus: p.careerStatus ?? "open-to-work",
    talentCategory: p.talentCategory ?? "general",
    avatarUrl: p.avatarUrl ?? "",
    bannerUrl: p.bannerUrl ?? "",
    salary: p.salary ?? "",
    personality: p.personality ?? null,
  });
}

// ─── Main Component ──────────────────────────────────────────────
export function CvWorkspace() {
  const { cvProfile, user, dbMode, saveCvProfile } = useApp();
  const [profile, setProfile] = useState<CvProfile>(
    cvProfile ?? blank(dbMode ? user?.email : "", dbMode ? user?.name : "")
  );
  const [prevCvProfile, setPrevCvProfile] = useState(cvProfile);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() =>
    serializeCvData(cvProfile ?? blank(dbMode ? user?.email : "", dbMode ? user?.name : ""))
  );

  if (cvProfile && cvProfile !== prevCvProfile) {
    setPrevCvProfile(cvProfile);
    const incomingSnap = serializeCvData(cvProfile);
    setSavedSnapshot(incomingSnap);
    if (serializeCvData(profile) === savedSnapshot) {
      setProfile(cvProfile);
    }
  }
  const [message, setMessage] = useState("");
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [personalityModalOpen, setPersonalityModalOpen] = useState(false);
  const [cropModal, setCropModal] = useState<{
    open: boolean;
    imageSrc: string | null;
    type: "avatar" | "banner";
    fileName: string;
  }>({
    open: false,
    imageSrc: null,
    type: "avatar",
    fileName: "",
  });

  const isDirty = useMemo(() => {
    return serializeCvData(profile) !== savedSnapshot;
  }, [profile, savedSnapshot]);

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  const profileRef = useRef(profile);
  const isShakingRef = useRef(false);
  const hasGuardedHistoryRef = useRef(false);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    isShakingRef.current = shaking;
  }, [shaking]);

  // Clean up any stale unsavedGuard state from a previous session on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.history.state?.unsavedGuard) {
      window.history.replaceState({ ...window.history.state, unsavedGuard: undefined }, "", window.location.href);
    }
  }, []);

  // Browser-level tab close / refresh protection
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Client-side link navigation guard (vibrates floating bar if user clicks a link while unsaved)
  useEffect(() => {
    if (!isDirty) return;
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("blob:") || href.startsWith("data:")) return;

      if (isShakingRef.current) {
        const leave = window.confirm(
          "Ada perubahan profil yang belum disimpan. Tinggalkan halaman ini dan buang perubahan?"
        );
        if (leave) {
          hasGuardedHistoryRef.current = false;
          setSavedSnapshot(serializeCvData(profileRef.current));
          return;
        }
      }

      e.preventDefault();
      e.stopPropagation();
      window.dispatchEvent(new Event("navigation-abort"));
      triggerShake();
    };

    document.addEventListener("click", handleLinkClick, { capture: true });
    return () => document.removeEventListener("click", handleLinkClick, { capture: true });
  }, [isDirty]);

  // Browser history (Back / Forward button) guard for unsaved changes
  useEffect(() => {
    if (!isDirty) {
      if (hasGuardedHistoryRef.current) {
        hasGuardedHistoryRef.current = false;
        if (window.history.state?.unsavedGuard) {
          window.history.back();
        }
      }
      return;
    }

    // Push a dummy guard entry to browser history stack when dirty
    if (!hasGuardedHistoryRef.current) {
      window.history.pushState({ unsavedGuard: true }, "", window.location.href);
      hasGuardedHistoryRef.current = true;
    }

    const handlePopState = () => {
      // If user repeatedly presses back while already vibrating, offer option to confirm exit
      if (isShakingRef.current) {
        const leave = window.confirm(
          "Ada perubahan profil yang belum disimpan. Tinggalkan halaman ini dan buang perubahan?"
        );
        if (leave) {
          hasGuardedHistoryRef.current = false;
          setSavedSnapshot(serializeCvData(profileRef.current));
          window.history.back();
          return;
        }
      }

      // Intercept and prevent navigating away
      window.dispatchEvent(new Event("navigation-abort"));
      triggerShake();

      // Re-push guard entry so URL stays on /candidate/cv and form inputs are preserved
      window.history.pushState({ unsavedGuard: true }, "", window.location.href);
      hasGuardedHistoryRef.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDirty]);

  const handleReset = () => {
    if (cvProfile) {
      setProfile(cvProfile);
      setSavedSnapshot(serializeCvData(cvProfile));
    } else {
      const empty = blank(dbMode ? user?.email : "", dbMode ? user?.name : "");
      setProfile(empty);
      setSavedSnapshot(serializeCvData(empty));
    }
    toast.info("Perubahan profil berhasil dibatalkan.");
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxBytes = type === "banner" ? 8 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`Ukuran ${type === "banner" ? "banner maksimal 8MB" : "foto profil maksimal 5MB"}`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropModal({
        open: true,
        imageSrc: reader.result as string,
        type,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const isAvatar = cropModal.type === "avatar";
    const toastId = toast.loading(`Mengunggah foto ${isAvatar ? "profil" : "sampul"}...`);
    try {
      const formData = new FormData();
      formData.append("file", croppedBlob, cropModal.fileName || `${cropModal.type}.webp`);
      formData.append("type", cropModal.type);

      const res = await fetch("/api/profile/media", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? `Gagal mengunggah foto ${isAvatar ? "profil" : "sampul"}.`);
      }

      const updated = {
        ...profile,
        ...(isAvatar ? { avatarUrl: data.url } : { bannerUrl: data.url }),
      };
      update(isAvatar ? "avatarUrl" : "bannerUrl", data.url);
      await saveCvProfile(updated);
      setSavedSnapshot(serializeCvData(updated));
      toast.success(`Foto ${isAvatar ? "profil" : "sampul"} berhasil diperbarui!`, { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Gagal mengunggah ${isAvatar ? "foto profil" : "sampul"}`, { id: toastId });
    }
  };

  const handleRemoveMedia = async (type: "avatar" | "banner") => {
    const isAvatar = type === "avatar";
    const toastId = toast.loading(`Menghapus foto ${isAvatar ? "profil" : "sampul"}...`);
    try {
      const res = await fetch(`/api/profile/media?type=${type}`, { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? `Gagal menghapus foto ${isAvatar ? "profil" : "sampul"}.`);
      }

      const updated = {
        ...profile,
        ...(isAvatar ? { avatarUrl: "" } : { bannerUrl: "" }),
      };
      update(isAvatar ? "avatarUrl" : "bannerUrl", "");
      await saveCvProfile(updated);
      setSavedSnapshot(serializeCvData(updated));
      toast.success(`Foto ${isAvatar ? "profil" : "sampul"} berhasil dihapus!`, { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Gagal menghapus foto ${isAvatar ? "profil" : "sampul"}`, { id: toastId });
    }
  };


  // Generic scalar updater
  const update = <K extends keyof CvProfile>(key: K, value: CvProfile[K]) =>
    setProfile((c) => ({ ...c, [key]: value }));

  // Experience helpers
  const addExp = () =>
    setProfile((c) => ({
      ...c,
      experience: [
        ...c.experience,
        {
          company: "",
          role: "",
          employmentType: "Full Time",
          startDate: "",
          endDate: "",
          currentPosition: false,
          dates: "",
          description: "",
          achievements: [],
        },
      ],
    }));
  const removeExp = (i: number) =>
    setProfile((c) => ({ ...c, experience: c.experience.filter((_, idx) => idx !== i) }));
  const moveExp = (fromIndex: number, direction: -1 | 1) => {
    setProfile((c) => {
      const toIndex = fromIndex + direction;
      if (toIndex < 0 || toIndex >= c.experience.length) return c;
      const next = [...c.experience];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { ...c, experience: next };
    });
  };
  const updateExp = (i: number, key: keyof ExperienceItem, val: unknown) =>
    setProfile((c) => {
      const exp = [...c.experience];
      const item = { ...exp[i], [key]: val };
      if (key === "startDate" || key === "endDate" || key === "currentPosition") {
        const start = key === "startDate" ? (val as string) : item.startDate || "";
        const isCurrent = key === "currentPosition" ? (val as boolean) : item.currentPosition;
        const end = isCurrent ? "Sekarang" : key === "endDate" ? (val as string) : item.endDate || "";
        if (start || end) {
          item.dates = start && end ? `${start} — ${end}` : start || end;
        }
      }
      exp[i] = item;
      return { ...c, experience: exp };
    });
  const updateExpAchievement = (i: number, j: number, val: string) =>
    setProfile((c) => {
      const exp = [...c.experience];
      const target = exp[i];
      if (!target) return c;
      const achievements = Array.isArray(target.achievements) ? [...target.achievements] : [];
      achievements[j] = val;
      exp[i] = { ...target, achievements };
      return { ...c, experience: exp };
    });
  const addExpAchievement = (i: number) =>
    setProfile((c) => ({
      ...c,
      experience: c.experience.map((exp, idx) =>
        idx === i ? { ...exp, achievements: [...(Array.isArray(exp.achievements) ? exp.achievements : []), ""] } : exp
      ),
    }));
  const removeExpAchievement = (i: number, j: number) =>
    setProfile((c) => ({
      ...c,
      experience: c.experience.map((exp, idx) =>
        idx === i
          ? {
              ...exp,
              achievements: (Array.isArray(exp.achievements) ? exp.achievements : []).filter((_, aIdx) => aIdx !== j),
            }
          : exp
      ),
    }));

  // Education helpers
  const addEdu = () =>
    setProfile((c) => ({
      ...c,
      education: [
        ...c.education,
        {
          level: "S1",
          school: "",
          program: "",
          gpa: "",
          startDate: "",
          endDate: "",
          currentlyStudying: false,
          dates: "",
        },
      ],
    }));
  const removeEdu = (i: number) =>
    setProfile((c) => ({ ...c, education: c.education.filter((_, idx) => idx !== i) }));
  const moveEdu = (fromIndex: number, direction: -1 | 1) => {
    setProfile((c) => {
      const toIndex = fromIndex + direction;
      if (toIndex < 0 || toIndex >= c.education.length) return c;
      const next = [...c.education];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { ...c, education: next };
    });
  };
  const updateEdu = (i: number, key: keyof EducationItem, val: unknown) =>
    setProfile((c) => {
      const edu = [...c.education];
      const item = { ...edu[i], [key]: val };
      if (key === "startDate" || key === "endDate" || key === "currentlyStudying") {
        const start = key === "startDate" ? (val as string) : item.startDate || "";
        const isCurrent = key === "currentlyStudying" ? (val as boolean) : item.currentlyStudying;
        const end = isCurrent ? "Sekarang" : key === "endDate" ? (val as string) : item.endDate || "";
        if (start || end) {
          item.dates = start && end ? `${start} — ${end}` : start || end;
        }
      }
      edu[i] = item;
      return { ...c, education: edu };
    });

  // Portfolio helpers
  const addPortfolio = () =>
    setProfile((c) => ({ ...c, portfolio: [...c.portfolio, ""] }));
  const removePortfolio = (i: number) =>
    setProfile((c) => ({ ...c, portfolio: c.portfolio.filter((_, idx) => idx !== i) }));
  const updatePortfolio = (i: number, val: string) =>
    setProfile((c) => {
      const p = [...c.portfolio];
      p[i] = val;
      return { ...c, portfolio: p };
    });

  async function importPdf(file: File) {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setMessage("File harus berformat PDF.");
      toast.error("File tidak didukung", { description: "Impor CV hanya menerima berkas PDF." });
      return;
    }
    if (file.size > maxPdfBytes) {
      setMessage("Ukuran file melebihi batas 5 MB.");
      toast.error("Ukuran file terlalu besar", { description: "Ukuran PDF maksimal 5 MB. Kompres atau pilih file lain." });
      return;
    }
    setImporting(true);
    setMessage("Membaca PDF sebagai draf...");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/cv/import", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Impor gagal. Coba lagi atau isi manual.");
        toast.error("Impor gagal", { description: data.error ?? "Server tidak dapat memproses PDF ini." });
        return;
      }
      setProfile((c) => ({
        ...c,
        ...data,
        id: data.cvId,
        skills: data.skills ?? c.skills,
        hardCompetencies: data.hardCompetencies ?? data.skills ?? c.hardCompetencies ?? c.skills,
        tools: data.tools ?? c.tools,
        softSkills: data.softSkills ?? c.softSkills ?? [],
        experience: data.experience ?? c.experience,
        education: data.education ?? c.education,
        portfolio: data.portfolio ?? c.portfolio,
        sourceFileName: file.name,
      }));
      setMessage("Draf berhasil dibuat. Tinjau semua field sebelum menyimpan.");
      toast.success("PDF diimpor sebagai draf", { description: "Semua hasil ekstraksi tetap bisa kamu edit sebelum disimpan." });
    } catch {
      setMessage("Impor gagal. Coba lagi atau isi manual.");
      toast.error("Impor gagal", { description: "Periksa koneksi kamu lalu coba lagi." });
    } finally {
      setImporting(false);
    }
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await saveCvProfile(profile);
      setSavedSnapshot(serializeCvData(profile));
      setMessage("Profil berhasil disimpan dan disinkronkan.");
    } catch {
      setMessage("Profil gagal disimpan. Coba lagi.");
      toast.error("Profil gagal disimpan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  const NAV_SECTIONS = [
    { id: "sec-basic", label: "Info Dasar" },
    { id: "sec-experience", label: "Pengalaman" },
    { id: "sec-education", label: "Pendidikan" },
    { id: "sec-skills", label: "Keahlian" },
    { id: "sec-portfolio", label: "Portofolio" },
  ];

  return (
    <div className="space-y-6">
      {/* Mobile Mode Switcher (< lg) */}
      <div className="flex lg:hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setMobileTab("editor")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors",
            mobileTab === "editor"
              ? "bg-[#7C3AED] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
          )}
        >
          <Edit3 className="size-3.5" />
          Edit Profil
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors",
            mobileTab === "preview"
              ? "bg-[#7C3AED] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
          )}
        >
          <Eye className="size-3.5" />
          Pratinjau Live &amp; Unduh
        </button>
      </div>

      {/* 2-Column Responsive Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
        {/* Left Column: Editor Form */}
        <div
          className={cn(
            "lg:col-span-7 xl:col-span-7 space-y-6",
            mobileTab === "preview" && "hidden lg:block"
          )}
        >
          {/* Import banner */}
          <Card className="border-border bg-muted/40 shadow-xs">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 font-semibold text-foreground text-sm">
                  <FileUp className="size-4 text-primary" />
                  Import Data dari CV PDF
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Format PDF (maks 5 MB). AI mengekstraksi data otomatis sebagai draf yang bisa kamu tinjau.
                </p>
              </div>
              <label
                aria-disabled={importing}
                className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold transition-colors shrink-0 ${
                  importing
                    ? "pointer-events-none bg-primary/60 text-primary-foreground"
                    : "cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                <input
                  className="sr-only"
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={importing}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void importPdf(f);
                  }}
                />
                {importing ? <Loader2 className="size-3.5 animate-spin" /> : <FileUp className="size-3.5" />}
                {importing ? "Memproses..." : "Pilih Berkas PDF"}
              </label>
            </CardContent>
          </Card>

          {/* Form Card */}
          <Card className="border-border shadow-xs">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <CardTitle className="text-foreground text-lg sm:text-xl font-bold">
                  Tinjau CV &amp; Profil
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Isi profil Anda. Perubahan langsung disinkronkan ke lembar pratinjau.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {saving ? (
                  <Badge variant="outline" className="border-purple-300 bg-purple-50 text-[#7C3AED] text-[11px] font-semibold gap-1.5 py-0.5">
                    <Loader2 className="size-3 animate-spin text-[#7C3AED]" />
                    Menyimpan...
                  </Badge>
                ) : isDirty ? (
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-[11px] font-semibold gap-1 py-0.5">
                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Ada perubahan belum disimpan
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 text-[11px] font-semibold gap-1 py-0.5">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    Semua perubahan tersimpan
                  </Badge>
                )}
              </div>
            </CardHeader>

            {/* Section Quick-Jump Chips */}
            <div className="flex flex-wrap items-center gap-2 px-6 py-2.5 bg-slate-50 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 mr-0.5">Lompat ke:</span>
              {NAV_SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(sec.id);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  className="cursor-pointer inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-purple-300 hover:bg-purple-50 hover:text-[#7C3AED] transition-colors shadow-2xs"
                >
                  {sec.label}
                </button>
              ))}
            </div>

            <CardContent className="space-y-8 pt-6">
              <FormSection id="sec-basic" title="Informasi Dasar &amp; Foto">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Foto Profil (Avatar)</span>
                <div className="flex items-center gap-4">
                  <div className="relative flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-200 shadow-2xs overflow-hidden">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="Foto Profil" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    ) : (
                      <User className="size-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs">
                      <Camera className="size-3.5 text-[#7C3AED]" />
                      <span>Upload Foto Profil</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => onSelectFile(e, "avatar")}
                      />
                    </label>
                    {profile.avatarUrl ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia("avatar")}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors shadow-2xs"
                      >
                        <Trash2 className="size-3.5 text-red-500" />
                        <span>Hapus</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Foto Sampul (Banner)</span>
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-32 shrink-0 rounded-xl border-2 border-white bg-gradient-to-r from-[#1e1b4b] to-[#7c3aed] shadow-2xs overflow-hidden">
                    {profile.bannerUrl ? (
                      <img src={profile.bannerUrl} alt="Foto Sampul" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs">
                      <Camera className="size-3.5 text-[#7C3AED]" />
                      <span>Upload Sampul</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => onSelectFile(e, "banner")}
                      />
                    </label>
                    {profile.bannerUrl ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia("banner")}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors shadow-2xs"
                      >
                        <Trash2 className="size-3.5 text-red-500" />
                        <span>Hapus</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <Field label="Nama Lengkap">
                <input
                  className={inputCls}
                  value={profile.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="Nama lengkapmu"
                />
              </Field>
              <Field label="Lokasi">
                <input
                  className={inputCls}
                  value={profile.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="Kota, Provinsi (contoh: Jakarta Selatan, DKI Jakarta)"
                />
              </Field>
              <Field label="Email">
                <input
                  className={inputCls}
                  type="email"
                  value={profile.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="nama@email.com"
                />
              </Field>
              <Field label="Nomor Telepon / WhatsApp">
                <IndonesianPhoneInput
                  value={profile.phone ?? ""}
                  onChange={(val) => update("phone", val)}
                  placeholder="812-3456-7890"
                />
              </Field>
              <Field
                label="Ekspektasi Gaji"
                hint="Ditunjukkan ke rekruter setelah profil dibuka (unlocked)."
              >
                <input
                  className={inputCls}
                  value={profile.salary ?? ""}
                  onChange={(e) => update("salary", e.target.value)}
                  placeholder="Contoh: Rp 15 jt – 22 jt / bln"
                />
              </Field>
              <Field
                label="Preferensi Kerja (Work Arrangement)"
                hint="Preferensi kehadiran kerja yang kamu minati."
              >
                <select
                  className={inputCls}
                  value={profile.workArrangement || "hybrid"}
                  onChange={(e) => update("workArrangement", e.target.value as "remote" | "hybrid" | "onsite")}
                >
                  <option value="hybrid">Hybrid (Kantor &amp; Remote)</option>
                  <option value="remote">Remote (Full WFH)</option>
                  <option value="onsite">Onsite (Bekerja di Kantor)</option>
                </select>
              </Field>
              <Field
                label="Headline Profesional"
                hint='Contoh: "Human Capital Specialist | Recruitment | Employee Relations"'
                span2
              >
                <input
                  className={inputCls}
                  value={profile.headline}
                  onChange={(e) => update("headline", e.target.value)}
                  placeholder="Posisi | Keahlian | Spesialisasi"
                />
              </Field>

              {/* ── Tipe Kepribadian (16Personalities) ── */}
              <div className="md:col-span-2 rounded-xl border border-purple-200/70 bg-gradient-to-r from-purple-50/40 via-white to-purple-50/20 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#7C3AED] border border-purple-200/60">
                      <Brain className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          Tes Kepribadian (16Personalities)
                        </span>
                        {profile.personality?.type ? (
                          <Badge className="bg-[#7C3AED] text-white font-bold text-[10px] px-2 py-0.5">
                            {profile.personality.type} · {profile.personality.label}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 text-[10px] font-semibold">
                            Belum Diisi
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {profile.personality?.tagline || "Lengkapi tipe kepribadian MBTI untuk menarik perhatian rekruter."}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPersonalityModalOpen(true)}
                    className="shrink-0 border-purple-200 text-[#7C3AED] hover:bg-purple-50 hover:text-[#6D28D9] rounded-xl text-xs font-semibold h-8.5 px-3 self-start sm:self-center"
                  >
                    <Brain className="mr-1.5 size-3.5" />
                    {profile.personality?.type ? "Ubah Kepribadian" : "Pilih Kepribadian"}
                  </Button>
                </div>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Tentang Saya
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSummaryModalOpen(true)}
                    className="h-7 gap-1.5 border-primary/30 text-xs font-medium text-primary hover:bg-primary/5"
                  >
                    <Sparkles className="size-3" />
                    Panduan Summary
                  </Button>
                </div>
                <p className="text-xs font-normal text-muted-foreground">
                  Deskripsi profesional singkat — siapa kamu, apa yang kamu lakukan, dan nilai apa yang kamu bawa.
                </p>
                <textarea
                  className={textareaCls}
                  value={profile.about}
                  onChange={(e) => update("about", e.target.value)}
                  placeholder="Deskripsi profesional singkat — siapa kamu, apa yang kamu lakukan, dan nilai apa yang kamu bawa."
                  rows={4}
                />
              </div>
            </div>
          </FormSection>

          {/* ── Pengalaman Kerja ── */}
          <FormSection
            id="sec-experience"
            title="Pengalaman Kerja"
            icon={<BriefcaseBusiness className="size-4 text-primary" />}
          >
            <div className="space-y-4">
              {profile.experience.map((exp, i) => {
                const employmentTypes = ["Full Time", "Internship", "Contract", "Freelance"];

                return (
                  <div key={i} className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 space-y-4 shadow-2xs transition-all hover:border-slate-300">
                    {/* Card Header with numbering, entity preview, reorder arrows, and delete button */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-[11px] font-bold text-[#7C3AED] border border-purple-200/60">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-foreground truncate">
                            {exp.company ? exp.company : `Pengalaman Kerja #${i + 1}`}
                          </h4>
                          {exp.role && (
                            <p className="text-xs text-muted-foreground truncate">{exp.role}</p>
                          )}
                        </div>
                        {exp.currentPosition && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0 font-medium hidden sm:inline-flex">
                            Posisi Aktif
                          </Badge>
                        )}
                      </div>

                      {/* Header Actions: Reorder & Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={i === 0}
                          onClick={() => moveExp(i, -1)}
                          title="Pindahkan ke atas"
                          className="size-7 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ChevronUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={i === profile.experience.length - 1}
                          onClick={() => moveExp(i, 1)}
                          title="Pindahkan ke bawah"
                          className="size-7 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                        <div className="h-4 w-px bg-slate-200 mx-1" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExp(i)}
                          title="Hapus Pengalaman"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="size-3.5 mr-1" />
                          Hapus
                        </Button>
                      </div>
                    </div>

                    {/* Row 1: Company Name & Position (50% / 50%) */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Nama Perusahaan *">
                        <input
                          className={inputCls}
                          value={exp.company}
                          onChange={(e) => updateExp(i, "company", e.target.value)}
                          placeholder="Contoh: PT GoTo Gojek Tokopedia"
                        />
                      </Field>
                      <Field label="Posisi / Jabatan *">
                        <input
                          className={inputCls}
                          value={exp.role}
                          onChange={(e) => updateExp(i, "role", e.target.value)}
                          placeholder="Contoh: Senior UI/UX Designer"
                        />
                      </Field>
                    </div>

                    {/* Row 2: Employment Type, Start Date, End Date (3 equal cols) */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Tipe Pekerjaan">
                        <select
                          className={inputCls}
                          value={exp.employmentType || "Full Time"}
                          onChange={(e) => updateExp(i, "employmentType", e.target.value)}
                        >
                          {employmentTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Bulan / Tahun Mulai">
                        <input
                          className={inputCls}
                          value={exp.startDate || ""}
                          onChange={(e) => updateExp(i, "startDate", e.target.value)}
                          placeholder="Contoh: Jan 2021"
                        />
                      </Field>
                      <Field label="Bulan / Tahun Selesai">
                        <input
                          className={cn(inputCls, exp.currentPosition && "bg-muted text-muted-foreground cursor-not-allowed")}
                          disabled={Boolean(exp.currentPosition)}
                          value={exp.currentPosition ? "Sekarang" : exp.endDate || ""}
                          onChange={(e) => updateExp(i, "endDate", e.target.value)}
                          placeholder={exp.currentPosition ? "Sekarang" : "Contoh: Des 2023"}
                        />
                      </Field>
                    </div>

                    {/* Row 3: Current Position Toggle Bar */}
                    <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2 border border-slate-100">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={Boolean(exp.currentPosition)}
                          onChange={(e) => updateExp(i, "currentPosition", e.target.checked)}
                          className="size-4 rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                        />
                        <span>Saya saat ini masih bekerja di posisi / perusahaan ini</span>
                      </label>
                      {exp.currentPosition && (
                        <span className="text-[11px] font-semibold text-[#7C3AED]">Periode otomatis diatur ke &ldquo;Sekarang&rdquo;</span>
                      )}
                    </div>

                    {/* Row 4: Job Description */}
                    <Field
                      label="Deskripsi Pekerjaan & Tanggung Jawab *"
                      hint="Jelaskan peran utama, lingkup kerja, dan kontribusi inti kamu."
                    >
                      <textarea
                        className={`${textareaCls} min-h-24`}
                        value={exp.description || ""}
                        onChange={(e) => updateExp(i, "description", e.target.value)}
                        placeholder="Deskripsikan peran utama, cakupan kerja, dan tanggung jawab..."
                        rows={3}
                      />
                    </Field>

                    {/* Row 5: Achievements */}
                    <div className="space-y-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground">
                          Pencapaian Utama (Achievements) — Opsional
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Tambahkan poin pencapaian atau hasil kerja terukur yang diraih pada posisi ini.
                        </span>
                      </div>
                      {((Array.isArray(exp.achievements)
                        ? exp.achievements
                        : typeof exp.achievements === "string" && exp.achievements
                        ? [exp.achievements]
                        : []) as string[]).map((achievement, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <textarea
                            className={`${textareaCls} flex-1 min-h-16`}
                            aria-label={`Pencapaian ${j + 1}`}
                            value={achievement}
                            onChange={(e) => updateExpAchievement(i, j, e.target.value)}
                            placeholder={j === 0 ? "Contoh: Meningkatkan efisiensi sistem sebesar 25% dalam 6 bulan..." : "Tambahkan poin pencapaian terukur lainnya..."}
                            rows={2}
                          />
                          <button
                            type="button"
                            onClick={() => removeExpAchievement(i, j)}
                            className="mt-2 shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            aria-label={`Hapus pencapaian ${j + 1}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex justify-end pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#7C3AED] hover:border-purple-300 shadow-2xs"
                          onClick={() => addExpAchievement(i)}
                        >
                          <Plus className="size-3.5" /> Tambah Poin Pencapaian
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <Button type="button" variant="outline" size="sm" onClick={addExp}>
                <Plus className="size-4" /> Tambah Pengalaman
              </Button>
            </div>
          </FormSection>

          {/* ── Pendidikan ── */}
          <FormSection
            id="sec-education"
            title="Pendidikan"
            icon={<GraduationCap className="size-4 text-primary" />}
          >
            <div className="space-y-4">
              {profile.education.map((edu, i) => {
                const partnerMatch = PARTNER_CAMPUSES.find((c) => edu.school.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(edu.school.toLowerCase()));
                const isVerified = profile.campusVerification?.institution === partnerMatch && profile.campusVerification?.status === "verified";
                const educationLevels = ["SMA/SMK", "Diploma", "S1", "S2", "S3"];

                return (
                  <div key={i} className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 space-y-4 shadow-2xs transition-all hover:border-slate-300">
                    {/* Card Header with numbering, school preview, reorder arrows, and delete button */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-[11px] font-bold text-[#7C3AED] border border-purple-200/60">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-foreground truncate">
                            {edu.school ? edu.school : `Pendidikan #${i + 1}`}
                          </h4>
                          {edu.program && (
                            <p className="text-xs text-muted-foreground truncate">{edu.program} {edu.level ? `(${edu.level})` : ""}</p>
                          )}
                        </div>
                        {edu.currentlyStudying && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0 font-medium hidden sm:inline-flex">
                            Studi Aktif
                          </Badge>
                        )}
                      </div>

                      {/* Header Actions: Reorder & Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={i === 0}
                          onClick={() => moveEdu(i, -1)}
                          title="Pindahkan ke atas"
                          className="size-7 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ChevronUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={i === profile.education.length - 1}
                          onClick={() => moveEdu(i, 1)}
                          title="Pindahkan ke bawah"
                          className="size-7 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                        <div className="h-4 w-px bg-slate-200 mx-1" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEdu(i)}
                          title="Hapus Pendidikan"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="size-3.5 mr-1" />
                          Hapus
                        </Button>
                      </div>
                    </div>

                    {/* Row 1: School & Major (50% / 50%) */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Universitas / Institusi Pendidikan *">
                        <input
                          className={inputCls}
                          value={edu.school}
                          onChange={(e) => updateEdu(i, "school", e.target.value)}
                          placeholder="Contoh: Universitas Indonesia / SMKN 1 Jakarta"
                        />
                      </Field>
                      <Field label="Jurusan / Program Studi *">
                        <input
                          className={inputCls}
                          value={edu.program}
                          onChange={(e) => updateEdu(i, "program", e.target.value)}
                          placeholder="Contoh: Teknik Informatika / Manajemen Bisnis"
                        />
                      </Field>
                    </div>

                    {/* Row 2: Level, GPA, Start Date, End Date (4 equal cols on md+) */}
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                      <Field label="Jenjang">
                        <select
                          className={inputCls}
                          value={edu.level || "S1"}
                          onChange={(e) => updateEdu(i, "level", e.target.value)}
                        >
                          {educationLevels.map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="IPK / Nilai Akhir">
                        <input
                          className={inputCls}
                          value={edu.gpa || ""}
                          onChange={(e) => updateEdu(i, "gpa", e.target.value)}
                          placeholder="3.85 / 4.00"
                        />
                      </Field>
                      <Field label="Bulan / Tahun Mulai">
                        <input
                          className={inputCls}
                          value={edu.startDate || ""}
                          onChange={(e) => updateEdu(i, "startDate", e.target.value)}
                          placeholder="Contoh: Agu 2020"
                        />
                      </Field>
                      <Field label="Bulan / Tahun Selesai">
                        <input
                          className={cn(inputCls, edu.currentlyStudying && "bg-muted text-muted-foreground cursor-not-allowed")}
                          disabled={Boolean(edu.currentlyStudying)}
                          value={edu.currentlyStudying ? "Sekarang" : edu.endDate || ""}
                          onChange={(e) => updateEdu(i, "endDate", e.target.value)}
                          placeholder={edu.currentlyStudying ? "Sekarang" : "Contoh: Jul 2024"}
                        />
                      </Field>
                    </div>

                    {/* Row 3: Currently Studying Toggle Bar */}
                    <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2 border border-slate-100">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={Boolean(edu.currentlyStudying)}
                          onChange={(e) => updateEdu(i, "currentlyStudying", e.target.checked)}
                          className="size-4 rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                        />
                        <span>Saya saat ini masih menempuh pendidikan di sini</span>
                      </label>
                      {edu.currentlyStudying && (
                        <span className="text-[11px] font-semibold text-[#7C3AED]">Periode otomatis diatur ke &ldquo;Sekarang&rdquo;</span>
                      )}
                    </div>

                    {partnerMatch && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-purple-100 bg-purple-50/50 p-3 text-xs">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <GraduationCap className="size-3.5 text-[#7C3AED]" /> Terhubung ke <strong>{partnerMatch} Career Center</strong>
                        </span>
                        <span className={isVerified
                          ? "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-800"
                          : "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-800"
                        }>
                          {isVerified ? "✓ Terverifikasi Resmi Kampus" : "⏳ Menunggu Verifikasi Career Center"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              <Button type="button" variant="outline" size="sm" onClick={addEdu}>
                <Plus className="size-4" /> Tambah Pendidikan
              </Button>
            </div>
          </FormSection>

          {/* ── Competency Framework ── */}
          <FormSection id="sec-skills" title="Framework Kompetensi (Competencies)">
            <div className="space-y-4">
              {/* 1. Hard Competencies */}
              <Field
                label="1. Hard Competencies (Kompetensi Teknis)"
                hint="Ketik nama kompetensi teknis lalu tekan koma (,) atau Enter. Contoh: UI/UX Design, Data Analysis, SEO"
              >
                <CompetencyTagInput
                  tags={profile.hardCompetencies?.length ? profile.hardCompetencies : profile.skills}
                  onChange={(tags) =>
                    setProfile((c) => ({
                      ...c,
                      skills: tags,
                      hardCompetencies: tags,
                    }))
                  }
                  colorScheme="purple"
                  placeholder="Ketik kompetensi teknis lalu tekan koma / Enter..."
                />
              </Field>

              {/* 2. Tools */}
              <Field
                label="2. Tools &amp; Software Pendukung"
                hint="Ketik nama software/tools lalu tekan koma (,) atau Enter. Contoh: Figma, VS Code, Notion, Docker"
              >
                <CompetencyTagInput
                  tags={profile.tools}
                  onChange={(tags) =>
                    setProfile((c) => ({
                      ...c,
                      tools: tags,
                    }))
                  }
                  colorScheme="slate"
                  placeholder="Ketik tools lalu tekan koma / Enter..."
                />
              </Field>

              {/* 3. Soft Skills */}
              <Field
                label="3. Soft Skills (Kompetensi Interpersonal)"
                hint="Ketik soft skill lalu tekan koma (,) atau Enter. Contoh: Problem Solving, Leadership, Team Collaboration"
              >
                <CompetencyTagInput
                  tags={profile.softSkills ?? []}
                  onChange={(tags) =>
                    setProfile((c) => ({
                      ...c,
                      softSkills: tags,
                    }))
                  }
                  colorScheme="emerald"
                  placeholder="Ketik soft skill lalu tekan koma / Enter..."
                />
              </Field>
            </div>
          </FormSection>

          {/* ── Portfolio ── */}
          <FormSection
            id="sec-portfolio"
            title="Portofolio"
            icon={<ExternalLink className="size-4 text-primary" />}
          >
            <div className="space-y-3">
              {profile.portfolio.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={inputCls + " flex-1"}
                    value={item}
                    onChange={(e) => updatePortfolio(i, e.target.value)}
                    placeholder="https://link-ke-project.com atau nama project"
                  />
                  <button
                    type="button"
                    onClick={() => removePortfolio(i)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label="Hapus portofolio"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addPortfolio}>
                <Plus className="size-4" /> Tambah Link / Proyek
              </Button>
            </div>
          </FormSection>

            {message && (
              <p className="rounded-lg bg-muted px-4 py-3 text-sm text-primary" role="status">
                {message}
              </p>
            )}
          </CardContent>
        </Card>

        <p className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <ShieldCheck className="size-3.5 text-primary" />
          Kamu mengontrol field yang dipublikasikan. Screening recruiter tidak memakai financial atau credit data.
        </p>
      </div>

      {/* Right Column: Sticky Live Preview Dock */}
      <div
        className={cn(
          "lg:col-span-5 xl:col-span-5 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]",
          mobileTab === "editor" && "hidden lg:block"
        )}
      >
        <CvDownload profile={profile} />
      </div>
    </div>

    {/* Floating Unsaved Changes Bar */}
    <CvUnsavedBar
      show={isDirty || saving}
      saving={saving}
      shaking={shaking}
      onSave={handleSave}
      onReset={handleReset}
    />

    <ProfessionalSummaryModal
      open={summaryModalOpen}
      onOpenChange={setSummaryModalOpen}
      currentSummary={profile.about}
      cvProfile={profile}
      onApply={async (newSummary) => {
        update("about", newSummary);
        if (profile.id && profile.id !== "new-cv") {
          const updated = {
            ...profile,
            about: newSummary,
          };
          await saveCvProfile(updated);
          setSavedSnapshot(serializeCvData(updated));
        }
      }}
    />

      <PersonalityModal
        open={personalityModalOpen}
        onOpenChange={setPersonalityModalOpen}
        personality={profile.personality}
        onSave={(newPersonality) => {
          update("personality", newPersonality);
          toast.success(newPersonality ? "Tipe kepribadian diperbarui! Klik Simpan Profil untuk menyimpan permanen." : "Tipe kepribadian dihapus.");
        }}
      />

      <ImageCropDialog
        open={cropModal.open}
        onOpenChange={(open) => setCropModal((prev) => ({ ...prev, open }))}
        imageSrc={cropModal.imageSrc}
        aspectRatio={cropModal.type === "avatar" ? 1 : 3}
        cropShape={cropModal.type === "avatar" ? "round" : "rect"}
        title={cropModal.type === "avatar" ? "Sesuaikan Foto Profil" : "Sesuaikan Foto Sampul"}
        description={
          cropModal.type === "avatar"
            ? "Geser dan perbesar untuk mengatur foto profil Anda."
            : "Geser dan perbesar untuk mengatur foto sampul (banner) Anda."
        }
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
