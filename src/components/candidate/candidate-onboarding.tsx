"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  Clock,
  GraduationCap,
  Hammer,
  Loader2,
  MapPin,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  User,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IndonesianPhoneInput } from "@/components/ui/phone-input";
import { extractIndonesianLocalPhone } from "@/lib/utils";
import { useApp } from "@/providers/app-provider";
import { getFirstIncompleteStep } from "@/lib/candidate/onboarding-step";
import { POPULAR_LOCATION_SUGGESTIONS, isValidLocationFormat, normalizeLocation } from "@/lib/locations";
import {
  CAREER_STATUS_CONFIG,
  TALENT_CATEGORY_CONFIG,
  PARTNER_CAMPUSES,
  type CareerStatus,
  type TalentCategory,
  type CvProfile,
} from "@/types";

type HistoryItem = CvProfile["experience"][number];
type EducationItem = CvProfile["education"][number];
type TextField = "fullName" | "email" | "phone" | "headline" | "about" | "location" | "targetRole";

type FormState = {
  talentCategory: TalentCategory;
  careerStatus: CareerStatus;
  fullName: string;
  headline: string;
  about: string;
  location: string;
  targetRole: string;
  email: string;
  phone: string;
  experience: HistoryItem[];
  education: EducationItem[];
  skills: string[]; // Hard Competencies
  tools: string[];
  softSkills: string[];
  workArrangement: CvProfile["workArrangement"];
};

const steps = [
  { title: "Kategori talent", note: "Klasifikasi profilmu", icon: Award },
  { title: "Status karier", note: "Kesiapanmu saat ini", icon: Rocket },
  { title: "Tentang kamu", note: "Profil dasar & kontak", icon: UserRound },
  { title: "Lokasi & Peran", note: "Pilihan target kerja", icon: MapPin },
  { title: "Pengalaman", note: "Riwayat pekerjaanmu", icon: BriefcaseBusiness },
  { title: "Pendidikan", note: "Latar belajar & kampus", icon: GraduationCap },
  { title: "Kompetensi", note: "Hard, Tools & Soft Skills", icon: Hammer },
  { title: "Cara kerja", note: "Pengaturan kerja", icon: Sparkles },
  { title: "Review & Publikasikan", note: "Siap ditemukan", icon: ShieldCheck },
] as const;

const emptyHistory: HistoryItem = {
  company: "",
  role: "",
  employmentType: "Full Time",
  startDate: "",
  endDate: "",
  currentPosition: false,
  dates: "",
  description: "",
  achievements: [""],
};
const emptyEducation: EducationItem = {
  level: "S1",
  school: "",
  program: "",
  gpa: "",
  startDate: "",
  endDate: "",
  currentlyStudying: false,
  dates: "",
};

const careerLabels: Record<CareerStatus, string> = {
  "open-to-work": "Open to Work",
  "open-for-opportunities": "Open for Opportunities",
  "freelance-available": "Freelance",
  "internship-available": "Internship",
  "not-available": "Not Available",
};

const draftKey = "proofylink-onboarding-draft";

const requiredLabels: Record<string, string> = {
  fullName: "Nama lengkap",
  email: "Email aktif",
  phone: "Nomor telepon",
  headline: "Headline profesional",
  about: "Tentang kamu",
  location: "Domisili saat ini",
};

const requiredByStep: Record<number, TextField[]> = {
  2: ["fullName", "email", "phone", "headline", "about"],
  3: ["location"],
};

function isDemoCandidateProfile(profile?: CvProfile | null) {
  if (!profile) return false;
  return (
    profile.id === "demo-candidate-1" ||
    profile.fullName === "Nadia Utami" ||
    profile.email === "nadia.utami@example.com"
  );
}

const initialForm = (profile: CvProfile | null, careerStatus: CareerStatus, email: string): FormState => {
  const p = isDemoCandidateProfile(profile) ? null : profile;
  return {
    talentCategory: p?.talentCategory ?? "public",
    careerStatus: p?.careerStatus ?? careerStatus,
    fullName: p?.fullName ?? "",
    headline: p?.headline ?? "",
    about: p?.about ?? "",
    location: p?.location ?? "",
    targetRole: p?.targetRole ?? "",
    email: p?.email ?? email,
    phone: p?.phone ?? "",
    experience: p?.experience?.length ? p.experience : [{ ...emptyHistory }],
    education: p?.education?.length ? p.education : [{ ...emptyEducation }],
    skills: p?.hardCompetencies?.length ? p.hardCompetencies : p?.skills ?? [],
    tools: p?.tools ?? [],
    softSkills: p?.softSkills ?? [],
    workArrangement: p?.workArrangement ?? "hybrid",
  };
};

function Field({
  label,
  required,
  optional,
  id,
  extraBadge,
  children,
  hint,
  error,
}: {
  label: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  id?: string;
  extraBadge?: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5" id={id ? `field-${id}` : undefined}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-sm font-semibold text-foreground flex items-center gap-1.5 select-none"
        >
          <span>{label}</span>
          {required && (
            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-md px-1.5 py-0.5 leading-none tracking-wide uppercase">
              Wajib
            </span>
          )}
          {optional && (
            <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 border border-border/70 rounded-md px-1.5 py-0.5 leading-none">
              Opsional
            </span>
          )}
        </label>
        {extraBadge && <div>{extraBadge}</div>}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive flex items-center gap-1.5 animate-fade-up">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";
const textareaClass =
  "min-h-28 w-full resize-none rounded-md border bg-transparent px-3 py-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

function isMeaningfulDraft(value: FormState) {
  return Boolean(
    value.fullName.trim() ||
      value.headline.trim() ||
      value.about.trim() ||
      value.location.trim() ||
      value.targetRole.trim() ||
      value.phone.trim() ||
      value.skills.length ||
      value.tools.length ||
      value.softSkills.length ||
      value.experience.some((item) => item.company.trim() || item.role.trim() || item.dates?.trim() || item.description?.trim() || item.achievements?.some((entry) => entry.trim())) ||
      value.education.some((item) => item.school.trim() || item.program.trim() || item.dates?.trim() || item.gpa?.trim()),
  );
}

function isValidDraftPayload(value: unknown): value is { form: FormState; step: number } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { form?: Partial<FormState>; step?: unknown };
  return typeof candidate.form?.fullName === "string" && typeof candidate.form.email === "string" && typeof candidate.step === "number";
}

function getSavedDraft(): { form: FormState; step: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isValidDraftPayload(parsed) && isMeaningfulDraft(parsed.form)) {
      if (
        parsed.form.fullName?.includes("Nadia Utami") ||
        parsed.form.email?.includes("nadia.utami@example.com")
      ) {
        window.localStorage.removeItem(draftKey);
        return null;
      }
      return {
        form: parsed.form,
        step: typeof parsed.step === "number" ? Math.min(Math.max(Math.trunc(parsed.step), 0), steps.length - 1) : 0,
      };
    }
  } catch {
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
    return null;
  }
  return null;
}

export function CandidateOnboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, cvProfile, careerStatus, bootstrapped, saveCvProfile } = useApp();

  const [step, setStep] = useState<number>(() => {
    const rawParam = typeof window !== "undefined" ? searchParams?.get("step") : null;
    const paramStep = rawParam !== null && rawParam !== undefined ? parseInt(rawParam, 10) : NaN;
    if (!isNaN(paramStep) && paramStep >= 0 && paramStep < steps.length) {
      return paramStep;
    }
    const draft = getSavedDraft();
    if (draft) {
      return draft.step;
    }
    return 0;
  });

  const [isPublishing, setIsPublishing] = useState(false);
  const [form, setForm] = useState<FormState>(() => {
    const draft = getSavedDraft();
    if (draft) {
      return draft.form;
    }
    const isDemo = isDemoCandidateProfile(cvProfile);
    const profile = isDemo ? null : (cvProfile ?? null);
    const userIsDemo = user?.name === "Nadia Utami" || user?.email === "nadia.utami@example.com";
    const initial = initialForm(profile, careerStatus, userIsDemo ? "" : user?.email ?? "");
    return {
      ...initial,
      fullName: initial.fullName || (userIsDemo ? "" : user?.name !== "Kandidat Baru" ? user?.name || "" : ""),
    };
  });
  const [tagInput, setTagInput] = useState<{ skills: string; tools: string; softSkills: string }>({
    skills: "",
    tools: "",
    softSkills: "",
  });
  const [errors, setErrors] = useState<Partial<Record<TextField, string>>>({});
  const [stepError, setStepError] = useState<string | null>(null);
  const [educationError, setEducationError] = useState<string | null>(null);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [edits, setEdits] = useState(0);

  const formRef = useRef(form);
  const stepRef = useRef(step);
  const hasEditsRef = useRef(false);
  const initializedRef = useRef(false);
  const publishedRef = useRef(false);

  useEffect(() => {
    formRef.current = form;
    stepRef.current = step;
  }, [form, step]);

  const goToStep = (targetStep: number) => {
    if (targetStep < 0 || targetStep >= steps.length) return;
    setStep(targetStep);
    stepRef.current = targetStep;
    setStepError(null);
    setEducationError(null);
    setSkillsError(null);
    try {
      window.localStorage.setItem(draftKey, JSON.stringify({ form: formRef.current, step: targetStep }));
    } catch {
      // ignore
    }
  };

  // Initial populate from remote profile / user IF no local draft and user has not typed
  useEffect(() => {
    if (!bootstrapped || !user || initializedRef.current || hasEditsRef.current) return;

    // Check again in case draft was written right before bootstrap completed
    const freshDraft = getSavedDraft();
    if (freshDraft) {
      initializedRef.current = true;
      hasEditsRef.current = true;
      const draftForm = freshDraft.form;
      formRef.current = draftForm;
      const rawParam = searchParams?.get("step");
      const paramStep = rawParam !== null && rawParam !== undefined ? parseInt(rawParam, 10) : NaN;
      const targetStep = !isNaN(paramStep) && paramStep >= 0 && paramStep < steps.length ? paramStep : freshDraft.step;
      stepRef.current = targetStep;
      queueMicrotask(() => {
        setForm(draftForm);
        setStep(targetStep);
      });
      return;
    }

    initializedRef.current = true;
    if (cvProfile && !isDemoCandidateProfile(cvProfile)) {
      const initial = initialForm(cvProfile, careerStatus, user.email);
      formRef.current = initial;
      const rawParam = searchParams?.get("step");
      const paramStep = rawParam !== null && rawParam !== undefined ? parseInt(rawParam, 10) : NaN;
      const targetStep = !isNaN(paramStep) && paramStep >= 0 && paramStep < steps.length ? paramStep : getFirstIncompleteStep(initial);
      stepRef.current = targetStep;
      queueMicrotask(() => {
        setForm(initial);
        setStep(targetStep);
      });
    } else {
      const isDemo = user.name === "Nadia Utami" || user.email === "nadia.utami@example.com";
      queueMicrotask(() => {
        setForm((current) => {
          const next = {
            ...current,
            fullName: current.fullName || (isDemo ? "" : user.name !== "Kandidat Baru" ? user.name : ""),
            email: current.email || (isDemo ? "" : user.email),
          };
          formRef.current = next;
          return next;
        });
      });
    }
  }, [bootstrapped, user, cvProfile, careerStatus, searchParams]);

  // Synchronous immediate draft flush on tab switch, window blur, pagehide, and beforeunload
  useEffect(() => {
    const saveImmediately = () => {
      if (publishedRef.current) return;
      const currentForm = formRef.current;
      const currentStep = stepRef.current;
      if (hasEditsRef.current || isMeaningfulDraft(currentForm)) {
        try {
          window.localStorage.setItem(draftKey, JSON.stringify({ form: currentForm, step: currentStep }));
        } catch {
          // ignore
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveImmediately();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", saveImmediately);
    window.addEventListener("beforeunload", saveImmediately);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", saveImmediately);
      window.removeEventListener("beforeunload", saveImmediately);
    };
  }, []);

  // Debounced draft autosave while typing
  useEffect(() => {
    if (publishedRef.current || (!hasEditsRef.current && !isMeaningfulDraft(form))) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify({ form, step }));
      } catch {
        return;
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [form, step, edits]);

  // Unsaved changes prompt before closing window
  useEffect(() => {
    if (!hasEditsRef.current || publishedRef.current) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [edits]);

  const setValue = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    hasEditsRef.current = true;
    initializedRef.current = true;
    setForm((current) => {
      const next = { ...current, [key]: value };
      formRef.current = next;
      return next;
    });
    setEdits((current) => current + 1);
    if (key in requiredLabels) setErrors((current) => ({ ...current, [key as TextField]: undefined }));
    setStepError(null);
  };

  const updateHistory = (index: number, key: keyof HistoryItem, value: unknown) =>
    setValue(
      "experience",
      form.experience.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const updated = { ...item, [key]: value };
        if (key === "achievements") return { ...item, achievements: [value as string] };
        if (key === "startDate" || key === "endDate" || key === "currentPosition") {
          const start = key === "startDate" ? (value as string) : updated.startDate || "";
          const isCurrent = key === "currentPosition" ? (value as boolean) : updated.currentPosition;
          const end = isCurrent ? "Sekarang" : key === "endDate" ? (value as string) : updated.endDate || "";
          if (start || end) {
            updated.dates = start && end ? `${start} — ${end}` : start || end;
          }
        }
        return updated;
      })
    );

  const updateEducation = (index: number, key: keyof EducationItem, value: unknown) => {
    setValue(
      "education",
      form.education.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const updated = { ...item, [key]: value };
        if (key === "startDate" || key === "endDate" || key === "currentlyStudying") {
          const start = key === "startDate" ? (value as string) : updated.startDate || "";
          const isCurrent = key === "currentlyStudying" ? (value as boolean) : updated.currentlyStudying;
          const end = isCurrent ? "Sekarang" : key === "endDate" ? (value as string) : updated.endDate || "";
          if (start || end) {
            updated.dates = start && end ? `${start} - ${end}` : start || end;
          }
        }
        return updated;
      })
    );
    setEducationError(null);
  };

  const addTag = (kind: "skills" | "tools" | "softSkills") => {
    const value = tagInput[kind].trim();
    if (!value || form[kind].includes(value)) return;
    setValue(kind, [...form[kind], value]);
    setTagInput((current) => ({ ...current, [kind]: "" }));
    if (kind === "skills") setSkillsError(null);
  };

  const removeTag = (kind: "skills" | "tools" | "softSkills", tag: string) => {
    setValue(kind, form[kind].filter((item) => item !== tag));
    if (kind === "skills") setSkillsError(null);
  };

  const validateFields = (fields: TextField[]) => {
    const found: Partial<Record<TextField, string>> = {};
    for (const field of fields) {
      const text = form[field].trim();
      if (!text) found[field] = `${requiredLabels[field]} wajib diisi.`;
      else if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) found[field] = "Format email belum valid.";
      else if (field === "phone") {
        const digits = extractIndonesianLocalPhone(text);
        if (!digits) found[field] = "Nomor telepon wajib diisi.";
        else if (digits.length < 8) found[field] = "Nomor telepon minimal 8 digit angka.";
      } else if (field === "location") {
        const locCheck = isValidLocationFormat(text);
        if (!locCheck.isValid) {
          found[field] = locCheck.error;
        }
      }
    }
    setErrors(found);
    return found;
  };

  const finish = async () => {
    const found = validateFields(Object.keys(requiredLabels) as TextField[]);
    const missing = Object.keys(found) as TextField[];
    if (missing.length > 0) {
      setStep(missing.some((field) => requiredByStep[2]?.includes(field)) ? 2 : 3);
      setStepError("Lengkapi seluruh isian wajib sebelum mempublikasikan profil.");
      const firstKey = missing[0];
      setTimeout(() => {
        const el = document.getElementById(`input-${firstKey}`) || document.querySelector(`[name="${firstKey}"]`);
        (el as HTMLElement)?.focus();
      }, 100);
      return;
    }

    const hasValidEducation = form.education.some((item) => item.school.trim() && item.program.trim());
    if (!hasValidEducation) {
      setStep(5);
      setEducationError("Isi minimal 1 riwayat institusi dan program studi pada langkah pendidikan.");
      setTimeout(() => {
        const el = document.getElementById("input-education-school-0");
        (el as HTMLElement)?.focus();
      }, 100);
      return;
    }

    if (form.skills.length < 3) {
      setStep(6);
      setSkillsError(`Tambahkan minimal 3 keahlian teknis kamu (saat ini: ${form.skills.length}/3).`);
      setTimeout(() => {
        const el = document.getElementById("input-tags-skills");
        (el as HTMLElement)?.focus();
      }, 100);
      return;
    }

    setIsPublishing(true);
    const toastId = toast.loading("Mempublikasikan profil...", {
      description: "Menyimpan data dan mengaktifkan profil profesional Anda.",
    });

    const profile: CvProfile = {
      ...cvProfile,
      id: cvProfile?.id ?? "cv-profile",
      fullName: form.fullName.trim(),
      headline: form.headline.trim(),
      about: form.about.trim(),
      location: normalizeLocation(form.location.trim()) || form.location.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      skills: form.skills,
      tools: form.tools,
      hardCompetencies: form.skills,
      softSkills: form.softSkills,
      industries: cvProfile?.industries ?? [],
      experience: form.experience
        .filter((item) => item.company.trim() || item.role.trim())
        .map((item) => ({
          ...item,
          achievements: Array.isArray(item.achievements)
            ? item.achievements.filter((a) => Boolean(a.trim()))
            : typeof item.achievements === "string" && (item.achievements as string).trim()
            ? [(item.achievements as string).trim()]
            : [],
        })),
      education: form.education.filter((item) => item.school.trim() || item.program.trim()),
      certifications: cvProfile?.certifications ?? [],
      portfolio: cvProfile?.portfolio ?? [],
      targetRole: form.targetRole.trim(),
      workArrangement: form.workArrangement,
      openToWork: form.careerStatus !== "not-available",
      careerStatus: form.careerStatus,
      talentCategory: form.talentCategory,
      avatarUrl: cvProfile?.avatarUrl,
      bannerUrl: cvProfile?.bannerUrl,
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveCvProfile(profile);
    } catch (err) {
      toast.error("Gagal mempublikasikan", {
        id: toastId,
        description:
          err instanceof Error
            ? err.message
            : "Coba lagi beberapa saat. Drafmu tetap tersimpan di perangkat ini.",
      });
      setIsPublishing(false);
      return;
    }

    publishedRef.current = true;
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
    toast.success("Profil berhasil dipublikasikan", {
      id: toastId,
      description: "Recruiter sekarang dapat menemukan profilmu sesuai pengaturan.",
    });
    router.push("/candidate");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (step === 2 || step === 3) {
      const fieldsToValidate = requiredByStep[step] ?? [];
      const found = validateFields(fieldsToValidate);
      const missingKeys = Object.keys(found) as TextField[];
      if (missingKeys.length > 0) {
        setStepError("Mohon lengkapi isian wajib yang ditandai sebelum melanjutkan.");
        const firstKey = missingKeys[0];
        setTimeout(() => {
          const el = document.getElementById(`input-${firstKey}`) || document.querySelector(`[name="${firstKey}"]`);
          (el as HTMLElement)?.focus();
        }, 50);
        return;
      }
    }

    if (step === 5) {
      const hasValidEducation = form.education.some((item) => item.school.trim() && item.program.trim());
      if (!hasValidEducation) {
        setEducationError("Mohon lengkapi minimal 1 riwayat institusi dan program studi formal.");
        setTimeout(() => {
          const el = document.getElementById("input-education-school-0");
          (el as HTMLElement)?.focus();
        }, 50);
        return;
      }
    }

    if (step === 6) {
      if (form.skills.length < 3) {
        setSkillsError(`Tambahkan minimal 3 keahlian teknis (saat ini: ${form.skills.length}/3).`);
        setTimeout(() => {
          const el = document.getElementById("input-tags-skills");
          (el as HTMLElement)?.focus();
        }, 50);
        return;
      }
    }

    if (step === steps.length - 1) {
      void finish();
      return;
    }
    goToStep(step + 1);
  };

  return (
    <ProtectedRoute role="candidate">
      <div className="fixed inset-0 z-10 flex flex-col overflow-hidden bg-background md:p-3 lg:p-6">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col md:flex-row overflow-hidden border-border bg-card md:rounded-2xl md:border md:shadow-2xl">
          {/* Mobile Brand Top Bar */}
          <div className="flex items-center justify-between border-b border-white/10 bg-dark-navy px-4 py-3 text-white md:hidden">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-white">
                <ShieldCheck className="size-4" />
              </span>
              <span>ProofyLink</span>
            </div>
            <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-purple-200">
              Kandidat
            </span>
          </div>

          <aside className="hidden w-[285px] shrink-0 flex-col bg-dark-navy p-7 text-white md:flex">
            <div className="flex items-center gap-2 font-bold">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
                <ShieldCheck className="size-5" />
              </span>
              ProofyLink
            </div>
            <div className="mt-16">
              <h1 className="text-3xl font-bold leading-tight tracking-tight">Bangun profil yang terasa seperti kamu.</h1>
              <p className="mt-4 text-sm leading-6 text-slate-300">Jawab beberapa pertanyaan singkat. Kamu tetap memegang kendali sebelum profil dipublikasikan.</p>
            </div>
            <div className="mt-auto space-y-2">
              {steps.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.title}
                    onClick={() => goToStep(index)}
                    disabled={isPublishing}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer disabled:cursor-not-allowed ${
                      index === step
                        ? "bg-white text-foreground shadow-xs font-medium"
                        : index < step
                        ? "text-emerald-300 hover:bg-white/10"
                        : "text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs transition-colors ${
                        index === step
                          ? "bg-primary text-white font-bold"
                          : index < step
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/10 text-slate-400"
                      }`}
                    >
                      {index < step ? <Check className="size-3.5 stroke-[2.5]" /> : <Icon className="size-3.5" />}
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-xs font-semibold truncate">{item.title}</strong>
                      <small className={`text-[11px] truncate block ${index === step ? "text-muted-foreground" : "text-slate-400"}`}>
                        {item.note}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col">
            <div className="border-b bg-card px-4 py-3.5 sm:px-8 sm:py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground md:text-2xl">{steps[step].title}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Langkah {step + 1} dari {steps.length} · {steps[step].note}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground">{Math.round(((step + 1) / steps.length) * 100)}% selesai</p>
                  <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-muted sm:w-40">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-1 md:hidden">
                {steps.map((item, index) => (
                  <button
                    type="button"
                    key={item.title}
                    onClick={() => goToStep(index)}
                    disabled={isPublishing}
                    aria-label={`Lompat ke langkah ${index + 1}: ${item.title}`}
                    className={`h-1.5 flex-1 rounded-full transition-all cursor-pointer ${
                      index === step
                        ? "bg-primary"
                        : index < step
                        ? "bg-emerald-500"
                        : "bg-muted hover:bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-7">
                <div className="mx-auto max-w-2xl animate-fade-up">
                  {stepError && (
                    <div
                      role="alert"
                      className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive animate-fade-up shadow-xs"
                    >
                      <AlertCircle className="size-4.5 shrink-0 mt-0.5 text-destructive" />
                      <div>
                        <p className="font-bold text-sm text-destructive">Periksa Isian Wajib</p>
                        <p className="mt-0.5 text-muted-foreground leading-relaxed">
                          {stepError}
                        </p>
                      </div>
                    </div>
                  )}
                  {step === 0 && <TalentCategoryStep value={form.talentCategory} onChange={(value) => setValue("talentCategory", value)} />}
                  {step === 1 && <StatusStep value={form.careerStatus} onChange={(value) => setValue("careerStatus", value)} />}
                  {step === 2 && <BasicStep form={form} errors={errors} setValue={setValue} />}
                  {step === 3 && <LocationStep form={form} errors={errors} setValue={setValue} />}
                  {step === 4 && (
                    <HistoryStep
                      items={form.experience}
                      update={updateHistory}
                      add={() => setValue("experience", [...form.experience, { ...emptyHistory }])}
                      remove={(index) => setValue("experience", form.experience.filter((_, itemIndex) => itemIndex !== index))}
                    />
                  )}
                  {step === 5 && (
                    <EducationStep
                      items={form.education}
                      update={updateEducation}
                      add={() => setValue("education", [...form.education, { ...emptyEducation }])}
                      remove={(index) => setValue("education", form.education.filter((_, itemIndex) => itemIndex !== index))}
                      educationError={educationError}
                    />
                  )}
                  {step === 6 && (
                    <TagsStep
                      form={form}
                      tagInput={tagInput}
                      setTagInput={setTagInput}
                      addTag={addTag}
                      removeTag={removeTag}
                      skillsError={skillsError}
                    />
                  )}
                  {step === 7 && <ArrangementStep value={form.workArrangement} onChange={(value) => setValue("workArrangement", value)} />}
                  {step === 8 && <ReviewStep form={form} />}
                </div>
              </div>

              <div className="flex items-center justify-between border-t bg-card px-4 py-3 sm:px-8 sm:py-4">
                {step > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => goToStep(step - 1)}
                    disabled={isPublishing}
                    className="rounded-xl text-xs font-semibold px-3 sm:px-4 h-9 sm:h-10"
                  >
                    <ArrowLeft className="size-4 mr-1.5" />
                    Kembali
                  </Button>
                ) : (
                  <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary" />
                    <span>Langkah 1 dari {steps.length} (Wajib)</span>
                  </div>
                )}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isPublishing}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-xs text-xs sm:text-sm px-4 sm:px-6 h-9 sm:h-10 transition-all disabled:opacity-70"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="size-4 mr-1.5 animate-spin" />
                      Mempublikasikan Profil...
                    </>
                  ) : step === steps.length - 1 ? (
                    <>
                      Publikasikan Profil
                      <ArrowRight className="size-4 ml-1.5" />
                    </>
                  ) : (
                    <>
                      Lanjut
                      <ArrowRight className="size-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function TalentCategoryStep({ value, onChange }: { value: TalentCategory; onChange: (value: TalentCategory) => void }) {
  return (
    <Intro
      title="Pilih kategori profil talent."
      text="Klasifikasi ini menentukan bagaimana lencana dan reputasi profesionalmu ditampilkan ke recruiter."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(TALENT_CATEGORY_CONFIG) as TalentCategory[]).map((category) => {
          const config = TALENT_CATEGORY_CONFIG[category];
          const isSelected = value === category;
          const CategoryIcon = category === "djoin-verified" ? BadgeCheck : User;
          return (
            <button
              type="button"
              key={category}
              onClick={() => onChange(category)}
              aria-pressed={isSelected}
              className={`rounded-2xl border p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs" : "bg-card border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <CategoryIcon className="size-4.5" />
                </span>
                {isSelected && <span className="text-xs font-bold text-primary bg-secondary px-2 py-0.5 rounded-full">Dipilih</span>}
              </div>
              <strong className="mt-3 block text-base font-bold text-foreground">{config.label}</strong>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{config.description}</p>
            </button>
          );
        })}
      </div>
    </Intro>
  );
}

function StatusStep({ value, onChange }: { value: CareerStatus; onChange: (value: CareerStatus) => void }) {
  return (
    <Intro title="Kamu sedang berada di fase mana?" text="Pilih status yang paling mendekati. Status ini bisa kamu ubah kapan saja.">
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(CAREER_STATUS_CONFIG) as CareerStatus[]).map((status) => {
          const config = CAREER_STATUS_CONFIG[status];
          return (
            <button
              type="button"
              key={status}
              onClick={() => onChange(status)}
              aria-pressed={value === status}
              className={`rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                value === status ? "border-primary bg-secondary ring-2 ring-primary/20" : "bg-card"
              }`}
            >
              <span className={`inline-flex size-2.5 rounded-full ${config.dot}`} aria-hidden="true" />
              <strong className="mt-3 block text-sm">{careerLabels[status]}</strong>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {status === "not-available" ? "Belum ingin menerima peluang" : "Terbuka untuk percakapan yang relevan"}
              </span>
            </button>
          );
        })}
      </div>
    </Intro>
  );
}

function Intro({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-2xl font-bold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{text}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}

function BasicStep({
  form,
  errors,
  setValue,
}: {
  form: FormState;
  errors: Partial<Record<TextField, string>>;
  setValue: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <Intro title="Mari kenalan lebih dekat." text="Tulis ringkasan singkat agar recruiter langsung memahami kontak dan arah kariermu.">
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nama lengkap" required id="fullName" error={errors.fullName}>
            <input
              id="input-fullName"
              aria-invalid={Boolean(errors.fullName)}
              autoComplete="name"
              className={inputClass}
              value={form.fullName}
              onChange={(event) => setValue("fullName", event.target.value)}
              placeholder="Contoh: Budi Pratama / Siti Rahmawati"
            />
          </Field>
          <Field label="Email aktif" required id="email" error={errors.email}>
            <input
              id="input-email"
              aria-invalid={Boolean(errors.email)}
              type="email"
              autoComplete="email"
              spellCheck={false}
              className={inputClass}
              value={form.email}
              onChange={(event) => setValue("email", event.target.value)}
              placeholder="nama@email.com"
            />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Nomor telepon / WhatsApp"
            required
            id="phone"
            extraBadge={
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <Clock className="size-2.5" /> Verifikasi Segera Hadir
              </span>
            }
            error={errors.phone}
            hint="Metode verifikasi telepon segera hadir. Saat ini nomor disimpan sebagai kontak untuk dihubungi recruiter saat screening disetujui."
          >
            <IndonesianPhoneInput
              id="input-phone"
              error={Boolean(errors.phone)}
              value={form.phone}
              onChange={(val) => setValue("phone", val)}
            />
          </Field>
          <Field label="Headline profesional" required id="headline" hint="Contoh: Senior Product Designer | UX Research" error={errors.headline}>
            <input
              id="input-headline"
              aria-invalid={Boolean(errors.headline)}
              className={inputClass}
              value={form.headline}
              onChange={(event) => setValue("headline", event.target.value)}
              placeholder="Apa keahlian utamamu?"
            />
          </Field>
        </div>
        <Field
          label="Tentang kamu"
          required
          id="about"
          error={errors.about}
          hint="Ceritakan ringkasan singkat profil, minat karier, atau keahlian utamamu. Kamu dapat menyempurnakannya nanti di workspace."
        >
          <textarea
            id="input-about"
            aria-invalid={Boolean(errors.about)}
            className={textareaClass}
            value={form.about}
            onChange={(event) => setValue("about", event.target.value)}
            placeholder="Ceritakan gambaran singkat profil profesionalmu..."
            rows={4}
          />
        </Field>
      </div>
    </Intro>
  );
}

function LocationStep({
  form,
  errors,
  setValue,
}: {
  form: FormState;
  errors: Partial<Record<TextField, string>>;
  setValue: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <Intro title="Di mana kamu ingin bekerja?" text="Lokasi membantu recruiter menemukan kecocokan yang realistis.">
      <div className="space-y-5">
        <Field
          label="Domisili saat ini (Kabupaten/Kota, Provinsi)"
          required
          id="location"
          hint="Wajib pisahkan dengan koma: [Kabupaten/Kota], [Provinsi]. Contoh: Sleman, D.I. Yogyakarta"
          error={errors.location}
        >
          <input
            id="input-location"
            aria-invalid={Boolean(errors.location)}
            className={inputClass}
            value={form.location}
            onChange={(event) => setValue("location", event.target.value)}
            placeholder="Contoh: Sleman, D.I. Yogyakarta atau Jakarta Selatan, DKI Jakarta"
            list="onboarding-locations-list"
          />
          <datalist id="onboarding-locations-list">
            {POPULAR_LOCATION_SUGGESTIONS.map((loc) => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </Field>
        <Field label="Peran yang dituju" optional id="targetRole" hint="Satu peran utama membantu profilmu tampil lebih fokus.">
          <input
            id="input-targetRole"
            className={inputClass}
            value={form.targetRole}
            onChange={(event) => setValue("targetRole", event.target.value)}
            placeholder="Contoh: Senior Product Designer (Opsional)"
          />
        </Field>
        <Card className="border-emerald-200 bg-emerald-50 p-5">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0 text-emerald-700" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Privasi tetap di tanganmu</p>
              <p className="mt-1 text-xs leading-5 text-emerald-800">
                Lokasi yang kamu masukkan tampil sebagai area umum kota/provinsi, bukan alamat lengkap rumah.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Intro>
  );
}

function HistoryStep({
  items,
  update,
  add,
  remove,
}: {
  items: HistoryItem[];
  update: (index: number, key: keyof HistoryItem, value: unknown) => void;
  add: () => void;
  remove: (index: number) => void;
}) {
  const employmentTypes = ["Full Time", "Internship", "Contract", "Freelance"];

  return (
    <Intro
      title="Pengalaman Kerja (Opsional)"
      text="Tambahkan pekerjaan yang paling relevan. Jika belum memiliki pengalaman kerja formal (misalnya fresh graduate atau mahasiswa), langkah ini opsional dan dapat langsung dilewati dengan menekan tombol Lanjut."
    >
      <div className="space-y-4">
        {items.map((item, index) => (
          <Card key={index} className="p-5 border-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  Pengalaman {index + 1}
                </span>
                {item.employmentType && (
                  <span className="bg-secondary text-primary text-[11px] font-bold px-2 py-0.5 rounded-md">
                    {item.employmentType}
                  </span>
                )}
              </div>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-xs font-semibold text-muted-foreground hover:text-destructive"
                >
                  Hapus
                </button>
              )}
            </div>

            {/* Row 1: Company Name & Position */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama Perusahaan" optional>
                <input
                  className={inputClass}
                  value={item.company}
                  onChange={(event) => update(index, "company", event.target.value)}
                  placeholder="Contoh: PT GoTo Gojek Tokopedia"
                />
              </Field>
              <Field label="Jabatan / Posisi" optional>
                <input
                  className={inputClass}
                  value={item.role}
                  onChange={(event) => update(index, "role", event.target.value)}
                  placeholder="Contoh: Senior UI/UX Designer"
                />
              </Field>
            </div>

            {/* Row 2: Employment Type */}
            <Field label="Tipe Pekerjaan" optional>
              <select
                className={inputClass}
                value={item.employmentType || "Full Time"}
                onChange={(event) => update(index, "employmentType", event.target.value)}
              >
                {employmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>

            {/* Row 3: Start Date, End Date, & Current Position Checkbox */}
            <div className="space-y-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tanggal / Tahun Mulai (Start Date)" optional>
                  <input
                    className={inputClass}
                    value={item.startDate || ""}
                    onChange={(event) => update(index, "startDate", event.target.value)}
                    placeholder="Contoh: Jan 2021 atau 2021"
                  />
                </Field>

                <Field label="Tanggal / Tahun Selesai (End Date)" optional>
                  <input
                    className={inputClass}
                    disabled={Boolean(item.currentPosition)}
                    value={item.currentPosition ? "Sekarang" : item.endDate || ""}
                    onChange={(event) => update(index, "endDate", event.target.value)}
                    placeholder={item.currentPosition ? "Sekarang" : "Contoh: Des 2023 atau 2023"}
                  />
                </Field>
              </div>

              {/* Current Position Checkbox */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-xs text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={Boolean(item.currentPosition)}
                  onChange={(event) => update(index, "currentPosition", event.target.checked)}
                  className="size-4 rounded border-input text-primary focus:ring-primary"
                />
                <span>Masih Bekerja di Sini (Current Position)</span>
              </label>
            </div>

            {/* Row 4: Job Description */}
            <Field
              label="Deskripsi Pekerjaan & Tanggung Jawab"
              optional
              hint="Jelaskan peran utama dan tanggung jawab harianmu"
            >
              <textarea
                rows={3}
                className={`${textareaClass} min-h-24`}
                value={item.description || ""}
                onChange={(event) => update(index, "description", event.target.value)}
                placeholder="Contoh: Bertanggung jawab merancang design system produk dari tahap discovery, wireframing, hingga usability testing bersama tim engineer dan product manager..."
              />
            </Field>

            {/* Row 5: Achievement */}
            <Field
              label="Pencapaian Utama (Achievement)"
              optional
              hint="Tuliskan hasil konkret, metrik atau capaian terbaik selama bekerja di sini"
            >
              <textarea
                rows={2}
                className={`${textareaClass} min-h-20`}
                value={Array.isArray(item.achievements) ? item.achievements[0] ?? "" : (item.achievements ?? "")}
                onChange={(event) => update(index, "achievements", event.target.value)}
                placeholder="Contoh: Meningkatkan task completion rate sebesar 28% dan memangkas waktu onboarding pengguna hingga 15%"
              />
            </Field>
          </Card>
        ))}
        <Button type="button" variant="outline" onClick={add} className="border-border">
          <Plus className="size-4" />
          Tambah Pengalaman Kerja
        </Button>
      </div>
    </Intro>
  );
}

function EducationStep({
  items,
  update,
  add,
  remove,
  educationError,
}: {
  items: EducationItem[];
  update: (index: number, key: keyof EducationItem, value: unknown) => void;
  add: () => void;
  remove: (index: number) => void;
  educationError?: string | null;
}) {
  const educationLevels = ["SMA/SMK", "Diploma", "S1", "S2", "S3"];

  return (
    <Intro
      title="Latar belajarmu"
      text="Pendidikan formal atau kampus. Fitur verifikasi resmi terintegrasi dengan kampus mitra akan segera hadir."
    >
      <div className="space-y-4">
        {educationError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-xs text-destructive animate-fade-up"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{educationError}</span>
          </div>
        )}
        {/* Partner campus quick suggestions */}
        <div className="rounded-xl border border-primary/20 bg-secondary/60 p-3.5 text-xs">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
            <p className="font-semibold text-primary flex items-center gap-1.5">
              <GraduationCap className="size-3.5" /> Pilih dari Kampus Mitra Resmi:
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <Clock className="size-2.5" /> Verifikasi Kampus Segera Hadir
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PARTNER_CAMPUSES.map((campus) => (
              <button
                key={campus}
                type="button"
                onClick={() => {
                  if (items.length === 0) {
                    add();
                    setTimeout(() => update(0, "school", campus), 0);
                  } else {
                    update(0, "school", campus);
                  }
                }}
                className="rounded-lg border border-primary/20 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-secondary transition-colors"
              >
                + {campus}
              </button>
            ))}
          </div>
        </div>

        {items.map((item, index) => {
          const partnerMatch = PARTNER_CAMPUSES.find(
            (c) => item.school.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(item.school.toLowerCase())
          );

          return (
            <Card key={index} className="p-5 border-border">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    Pendidikan {index + 1}
                  </span>
                  {item.level && (
                    <span className="bg-secondary text-primary text-[11px] font-bold px-2 py-0.5 rounded-md">
                      {item.level}
                    </span>
                  )}
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-xs font-semibold text-muted-foreground hover:text-destructive"
                  >
                    Hapus
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Education Level & Institution */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Jenjang pendidikan" required>
                    <select
                      className={inputClass}
                      value={item.level || "S1"}
                      onChange={(event) => update(index, "level", event.target.value)}
                    >
                      {educationLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Institusi / Universitas" required id={`education-school-${index}`}>
                      <input
                        id={`input-education-school-${index}`}
                        className={inputClass}
                        value={item.school}
                        onChange={(event) => update(index, "school", event.target.value)}
                        placeholder="Contoh: Universitas Indonesia / SMKN 1 Jakarta"
                      />
                    </Field>
                  </div>
                </div>

                {/* Major & GPA */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Field label="Jurusan / Program Studi" required id={`education-program-${index}`}>
                      <input
                        id={`input-education-program-${index}`}
                        className={inputClass}
                        value={item.program}
                        onChange={(event) => update(index, "program", event.target.value)}
                        placeholder="Contoh: Teknik Informatika / Ilmu Komputer"
                      />
                    </Field>
                  </div>

                  <Field label="IPK / Nilai Akhir (GPA)" optional>
                    <input
                      className={inputClass}
                      value={item.gpa || ""}
                      onChange={(event) => update(index, "gpa", event.target.value)}
                      placeholder="Contoh: 3.85 / 4.00"
                    />
                  </Field>
                </div>

                {/* Dates & Currently Studying */}
                <div className="space-y-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Tahun / Bulan Mulai (Start Date)" optional>
                      <input
                        className={inputClass}
                        value={item.startDate || ""}
                        onChange={(event) => update(index, "startDate", event.target.value)}
                        placeholder="Contoh: Agu 2020 atau 2020"
                      />
                    </Field>

                    <Field label="Tahun / Bulan Selesai (End Date)" optional>
                      <input
                        className={inputClass}
                        disabled={Boolean(item.currentlyStudying)}
                        value={item.currentlyStudying ? "Sekarang" : item.endDate || ""}
                        onChange={(event) => update(index, "endDate", event.target.value)}
                        placeholder={item.currentlyStudying ? "Sekarang" : "Contoh: Jul 2024 atau 2024"}
                      />
                    </Field>
                  </div>

                  {/* Currently Studying Checkbox */}
                  <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-xs text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={Boolean(item.currentlyStudying)}
                      onChange={(event) => update(index, "currentlyStudying", event.target.checked)}
                      className="size-4 rounded border-input text-primary focus:ring-primary"
                    />
                    <span>Masih Menempuh Pendidikan (Currently Studying)</span>
                  </label>
                </div>

                {partnerMatch && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50/70 p-2.5 text-xs text-amber-900 font-medium border border-amber-200/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <GraduationCap className="size-4 shrink-0 text-amber-700" />
                      <span className="truncate">
                        Terhubung ke Career Center <strong>{partnerMatch}</strong>.
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 shrink-0 text-[10px] font-semibold text-amber-700 bg-white/80 border border-amber-200 px-2 py-0.5 rounded-full">
                      <Clock className="size-2.5" /> Verifikasi Segera Hadir
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
        <Button type="button" variant="outline" onClick={add} className="border-border">
          <Plus className="size-4" />
          Tambah pendidikan
        </Button>
      </div>
    </Intro>
  );
}

function TagsStep({
  form,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
  skillsError,
}: {
  form: FormState;
  tagInput: { skills: string; tools: string; softSkills: string };
  setTagInput: React.Dispatch<React.SetStateAction<{ skills: string; tools: string; softSkills: string }>>;
  addTag: (kind: "skills" | "tools" | "softSkills") => void;
  removeTag: (kind: "skills" | "tools" | "softSkills", tag: string) => void;
  skillsError?: string | null;
}) {
  const group = (
    kind: "skills" | "tools" | "softSkills",
    label: string,
    placeholder: string,
    required?: boolean,
    optional?: boolean,
    hint?: string,
    error?: string | null
  ) => (
    <Field
      label={label}
      required={required}
      optional={optional}
      hint={hint}
      error={error ?? undefined}
      id={`input-tags-${kind}`}
    >
      <div
        className={`rounded-md border bg-transparent p-2 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 ${
          error ? "border-destructive ring-1 ring-destructive/30" : ""
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {form[kind].map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-secondary border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary"
            >
              {tag}
              <button type="button" aria-label={`Hapus ${tag}`} onClick={() => removeTag(kind, tag)}>
                <X className="size-3" />
              </button>
            </span>
          ))}
          <input
            id={`input-tags-${kind}`}
            className="h-7 min-w-[140px] flex-1 border-0 bg-transparent px-1 text-sm outline-none"
            value={tagInput[kind]}
            onChange={(event) => setTagInput((current) => ({ ...current, [kind]: event.target.value }))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTag(kind);
              }
            }}
            placeholder={placeholder}
          />
        </div>
      </div>
    </Field>
  );

  return (
    <Intro
      title="Framework Kompetensi (Competencies)"
      text="Klasifikasikan keahlianmu ke dalam Hard Competencies, Tools, dan Soft Skills untuk memudahkan pencocokan cerdas dengan kriteria rekruter."
    >
      <div className="space-y-6">
        {group(
          "skills",
          "Hard Competencies (Kompetensi Teknis)",
          "Ketik kompetensi teknis lalu Enter (Contoh: UI/UX Design, Data Analysis, Backend Development)",
          true,
          false,
          `Tekan Enter untuk menambahkan. Minimal 3 kompetensi teknis (${form.skills.length}/3 ditambahkan).`,
          skillsError
        )}
        {group(
          "tools",
          "Tools & Software Pendukung",
          "Ketik nama software/tools lalu Enter (Contoh: Figma, VS Code, Docker, Notion, Postman)",
          false,
          true,
          "Tekan Enter untuk menambahkan tools dan software yang kamu kuasai."
        )}
        {group(
          "softSkills",
          "Soft Skills (Kompetensi Interpersonal)",
          "Ketik soft skill lalu Enter (Contoh: Problem Solving, Public Speaking, Leadership, Team Collaboration)",
          false,
          true,
          "Tekan Enter untuk menambahkan kompetensi komunikasi dan interpersonal."
        )}
      </div>
    </Intro>
  );
}

function ArrangementStep({
  value,
  onChange,
}: {
  value: CvProfile["workArrangement"];
  onChange: (value: CvProfile["workArrangement"]) => void;
}) {
  const options: { value: CvProfile["workArrangement"]; title: string; text: string }[] = [
    { value: "remote", title: "Remote", text: "Bekerja sepenuhnya dari lokasi pilihanmu" },
    { value: "hybrid", title: "Hybrid", text: "Menggabungkan kerja remote dan dari kantor" },
    { value: "onsite", title: "On-site", text: "Bekerja dari lokasi kantor" },
  ];

  return (
    <Intro title="Cara kerja seperti apa yang cocok?" text="Preferensi ini membantu percakapan awal terasa lebih relevan.">
      <div className="space-y-3">
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`flex w-full items-start gap-4 rounded-xl border p-5 text-left transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              value === option.value ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "bg-card border-border"
            }`}
          >
            <span
              className={`mt-0.5 flex size-5 items-center justify-center rounded-full border ${
                value === option.value ? "border-primary bg-primary text-primary-foreground" : "border-input"
              }`}
            >
              {value === option.value && <Check className="size-3.5" />}
            </span>
            <span>
              <strong className="block text-sm font-semibold">{option.title}</strong>
              <span className="mt-1 block text-xs text-muted-foreground">{option.text}</span>
            </span>
          </button>
        ))}
      </div>
    </Intro>
  );
}

function ReviewStep({ form }: { form: FormState }) {
  const talentConfig = TALENT_CATEGORY_CONFIG[form.talentCategory];

  return (
    <Intro title="Satu langkah lagi." text="Tinjau detailmu sebelum profil ini ditemukan recruiter.">
      <Card className="overflow-hidden border-border shadow-sm">
        <div className="bg-dark-navy p-6 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded-full font-medium text-emerald-300">
              {careerLabels[form.careerStatus]}
            </span>
            <span className="text-xs bg-white/10 text-purple-200 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              <span>{talentConfig.badge}</span> {talentConfig.label}
            </span>
          </div>
          <h3 className="mt-3 text-2xl font-bold">{form.fullName || "Nama kamu"}</h3>
          <p className="mt-1 text-sm text-slate-300">{form.headline || "Headline profesional"}</p>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <MapPin className="size-3.5 text-emerald-400" />
            <span>{form.location || "Lokasi belum diisi"}</span>
            <span className="text-slate-500">•</span>
            <span>{form.workArrangement}</span>
            <span className="text-slate-500">•</span>
            <span>{form.phone ? `${form.phone} (Verifikasi Segera Hadir)` : "No. Telepon belum diisi"}</span>
          </p>
        </div>
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <Summary label="Target role" value={form.targetRole} />
          <Summary label="Kategori profil" value={talentConfig.label} />
          <Summary
            label="Pengalaman"
            value={`${form.experience.filter((item) => item.company || item.role).length} entri`}
          />
          <Summary
            label="Pendidikan"
            value={`${form.education.filter((item) => item.school || item.program).length} entri`}
          />
          <Summary label="Skill & tools" value={`${form.skills.length + form.tools.length} item`} />
          <Summary
            label="Status kontak & verifikasi"
            value={`${form.email} (Email) • ${form.phone || "No. Telepon"} (Telepon - Verifikasi Segera Hadir)`}
          />
        </div>
      </Card>
      <div className="mt-5 flex gap-3 rounded-xl bg-secondary/50 border border-primary/20 p-4 text-sm text-foreground">
        <ShieldCheck className="size-5 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed">
          Dengan mempublikasikan, profilmu akan langsung terdaftar di Talent Network sesuai status karier, preferensi kerja, dan kategori yang kamu pilih.
        </p>
      </div>
    </Intro>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value || "Belum diisi"}</p>
    </div>
  );
}
