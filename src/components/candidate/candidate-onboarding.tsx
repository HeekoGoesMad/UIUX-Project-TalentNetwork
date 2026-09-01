"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Check,
  GraduationCap,
  Hammer,
  MapPin,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import { ProfessionalSummaryModal } from "./professional-summary-modal";
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

const requiredLabels: Record<TextField, string> = {
  fullName: "Nama lengkap",
  email: "Email",
  phone: "Nomor telepon",
  headline: "Headline profesional",
  about: "Tentang kamu",
  location: "Domisili saat ini",
  targetRole: "Peran yang dituju",
};

const requiredByStep: Record<number, TextField[]> = {
  2: ["fullName", "email", "phone", "headline", "about"],
  3: ["location", "targetRole"],
};

const initialForm = (profile: CvProfile | null, careerStatus: CareerStatus, email: string): FormState => ({
  talentCategory: profile?.talentCategory ?? "public",
  careerStatus: profile?.careerStatus ?? careerStatus,
  fullName: profile?.fullName ?? "",
  headline: profile?.headline ?? "",
  about: profile?.about ?? "",
  location: profile?.location ?? "",
  targetRole: profile?.targetRole ?? "",
  email: profile?.email ?? email,
  phone: profile?.phone ?? "",
  experience: profile?.experience?.length ? profile.experience : [{ ...emptyHistory }],
  education: profile?.education?.length ? profile.education : [{ ...emptyEducation }],
  skills: profile?.hardCompetencies?.length ? profile.hardCompetencies : profile?.skills ?? [],
  tools: profile?.tools ?? [],
  softSkills: profile?.softSkills ?? [],
  workArrangement: profile?.workArrangement ?? "hybrid",
});

function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="block text-xs font-medium text-destructive">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
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
      value.experience.some((item) => item.company.trim() || item.role.trim() || item.dates?.trim() || item.description?.trim() || item.achievements?.some((entry) => entry.trim())) ||
      value.education.some((item) => item.school.trim() || item.program.trim() || item.dates?.trim() || item.gpa?.trim()),
  );
}

function isValidDraftPayload(value: unknown): value is { form: FormState; step: number } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { form?: Partial<FormState>; step?: unknown };
  return typeof candidate.form?.fullName === "string" && typeof candidate.form.email === "string" && typeof candidate.step === "number";
}

export function CandidateOnboarding() {
  const router = useRouter();
  const { user, cvProfile, careerStatus, bootstrapped, saveCvProfile } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => {
    const profile = cvProfile ?? null;
    const initial = initialForm(profile, careerStatus, user?.email ?? "");
    return { ...initial, fullName: initial.fullName || user?.name || "" };
  });
  const [tagInput, setTagInput] = useState<{ skills: string; tools: string; softSkills: string }>({
    skills: "",
    tools: "",
    softSkills: "",
  });
  const [errors, setErrors] = useState<Partial<Record<TextField, string>>>({});
  const [edits, setEdits] = useState(0);
  const restoredRef = useRef(false);
  const draftAppliedRef = useRef(false);
  const publishedRef = useRef(false);

  useEffect(() => {
    if (!bootstrapped || !user || restoredRef.current) return;
    restoredRef.current = true;
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(draftKey);
        if (!raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (!isValidDraftPayload(parsed) || !isMeaningfulDraft(parsed.form)) return;
        draftAppliedRef.current = true;
        setForm(parsed.form);
        setStep(Math.min(Math.max(Math.trunc(parsed.step), 0), steps.length - 1));
        setEdits((current) => current + 1);
      } catch {
        window.localStorage.removeItem(draftKey);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [bootstrapped, user]);

  useEffect(() => {
    if (!user || !bootstrapped || !cvProfile || draftAppliedRef.current) return;
    const timer = window.setTimeout(() => {
      if (draftAppliedRef.current) return;
      setForm(initialForm(cvProfile, careerStatus, user.email));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [bootstrapped, careerStatus, cvProfile, user]);

  useEffect(() => {
    if (!user || !bootstrapped || cvProfile || draftAppliedRef.current) return;
    const timer = window.setTimeout(() => {
      if (draftAppliedRef.current) return;
      setForm((current) => ({
        ...current,
        fullName: current.fullName || user.name,
        email: current.email || user.email,
      }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [bootstrapped, cvProfile, user]);

  useEffect(() => {
    if (!restoredRef.current || publishedRef.current || !edits) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify({ form, step }));
      } catch {
        return;
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [form, step, edits]);

  useEffect(() => {
    if (!edits || publishedRef.current) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [edits]);

  const setValue = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setEdits((current) => current + 1);
    if (key in requiredLabels) setErrors((current) => ({ ...current, [key as TextField]: undefined }));
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

  const updateEducation = (index: number, key: keyof EducationItem, value: unknown) =>
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

  const addTag = (kind: "skills" | "tools" | "softSkills") => {
    const value = tagInput[kind].trim();
    if (!value || form[kind].includes(value)) return;
    setValue(kind, [...form[kind], value]);
    setTagInput((current) => ({ ...current, [kind]: "" }));
  };

  const removeTag = (kind: "skills" | "tools" | "softSkills", tag: string) => setValue(kind, form[kind].filter((item) => item !== tag));

  const validateFields = (fields: TextField[]) => {
    const found: Partial<Record<TextField, string>> = {};
    for (const field of fields) {
      const text = form[field].trim();
      if (!text) found[field] = `${requiredLabels[field]} wajib diisi.`;
      else if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) found[field] = "Format email belum valid.";
    }
    setErrors(found);
    return found;
  };

  const finish = async () => {
    const found = validateFields(Object.keys(requiredLabels) as TextField[]);
    const missing = Object.keys(found) as TextField[];
    if (missing.length > 0) {
      toast.error("Profil belum lengkap", { description: "Lengkapi isian wajib yang bertanda merah sebelum mempublikasikan." });
      setStep(missing.some((field) => requiredByStep[2]?.includes(field)) ? 2 : 3);
      return;
    }

    const hasValidEducation = form.education.some((item) => item.school.trim() && item.program.trim());
    if (!hasValidEducation) {
      toast.error("Pendidikan wajib diisi", { description: "Isi minimal 1 riwayat institusi dan program studi pada langkah pendidikan." });
      setStep(5);
      return;
    }

    if (form.skills.length < 3) {
      toast.error("Skill belum cukup", { description: "Tambahkan minimal 3 keahlian utama kamu." });
      setStep(6);
      return;
    }

    const profile: CvProfile = {
      id: cvProfile?.id ?? `cv-${Date.now()}`,
      fullName: form.fullName.trim(),
      headline: form.headline.trim(),
      about: form.about.trim(),
      location: form.location.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      skills: form.skills,
      tools: form.tools,
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
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveCvProfile(profile);
    } catch {
      toast.error("Gagal mempublikasikan", { description: "Coba lagi beberapa saat. Drafmu tetap tersimpan di perangkat ini." });
      return;
    }

    publishedRef.current = true;
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      return;
    }
    toast.success("Profil berhasil dipublikasikan", { description: "Recruiter sekarang dapat menemukan profilmu sesuai pengaturan." });
    router.push("/candidate");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (step === 2 || step === 3) {
      const found = validateFields(requiredByStep[step] ?? []);
      if ((Object.keys(found) as TextField[]).length > 0) {
        toast.error("Periksa kembali formulir", { description: "Ada isian wajib yang belum terisi dengan benar." });
        return;
      }
    }

    if (step === 5) {
      const hasValidEducation = form.education.some((item) => item.school.trim() && item.program.trim());
      if (!hasValidEducation) {
        toast.error("Pendidikan wajib diisi", { description: "Isi minimal 1 riwayat institusi dan program studi kamu." });
        return;
      }
    }

    if (step === 6) {
      if (form.skills.length < 3) {
        toast.error("Skill minimal 3", { description: "Tambahkan setidaknya 3 keahlian utama untuk memudahkan pencocokan." });
        return;
      }
    }

    if (step === steps.length - 1) {
      void finish();
      return;
    }
    setStep((current) => current + 1);
  };

  return (
    <ProtectedRoute role="candidate">
      <div className="fixed inset-0 z-10 overflow-hidden bg-background pt-20">
        <div className="mx-auto flex h-full max-w-7xl overflow-hidden border-x border-border bg-card shadow-xl">
          <aside className="hidden w-[285px] shrink-0 flex-col bg-[#0b2342] p-7 text-white md:flex">
            <div className="flex items-center gap-2 font-bold">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#7C3AED] text-white">
                <ShieldCheck className="size-5" />
              </span>
              ProofyLink
            </div>
            <div className="mt-16">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#7aaee0]">Onboarding kandidat</p>
              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight">Bangun profil yang terasa seperti kamu.</h1>
              <p className="mt-4 text-sm leading-6 text-[#b7c8dc]">Jawab beberapa pertanyaan singkat. Kamu tetap memegang kendali sebelum profil dipublikasikan.</p>
            </div>
            <div className="mt-auto space-y-2">
              {steps.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      index === step ? "bg-white text-foreground" : index < step ? "text-[#8de0be]" : "text-[#8fa7c0]"
                    }`}
                  >
                    <span
                      className={`flex size-6 items-center justify-center rounded-full text-xs ${
                        index === step ? "bg-secondary text-secondary-foreground" : "bg-white/10"
                      }`}
                    >
                      {index < step ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                    </span>
                    <span>
                      <strong className="block text-xs font-semibold">{item.title}</strong>
                      <small className={`text-[11px] ${index === step ? "text-muted-foreground" : "text-[#8fa7c0]"}`}>
                        {item.note}
                      </small>
                    </span>
                  </div>
                );
              })}
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col">
            <div className="border-b bg-card px-5 py-4 sm:px-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-[#7C3AED]">
                    Langkah {String(step + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-foreground md:text-2xl">{steps[step].title}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground">{Math.round(((step + 1) / steps.length) * 100)}% selesai</p>
                  <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-muted sm:w-40">
                    <div
                      className="h-full rounded-full bg-[#7C3AED] transition-all duration-300"
                      style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-1 md:hidden">
                {steps.map((item, index) => (
                  <span
                    key={item.title}
                    className={`h-1 flex-1 rounded-full ${index <= step ? "bg-[#7C3AED]" : "bg-muted"}`}
                  />
                ))}
              </div>
            </div>

            <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-7 sm:px-10">
                <div className="mx-auto max-w-2xl animate-fade-up">
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
                    />
                  )}
                  {step === 6 && (
                    <TagsStep
                      form={form}
                      tagInput={tagInput}
                      setTagInput={setTagInput}
                      addTag={addTag}
                      removeTag={removeTag}
                    />
                  )}
                  {step === 7 && <ArrangementStep value={form.workArrangement} onChange={(value) => setValue("workArrangement", value)} />}
                  {step === 8 && <ReviewStep form={form} />}
                </div>
              </div>

              <div className="flex items-center justify-between border-t bg-card px-5 py-4 sm:px-10">
                {step > 0 ? (
                  <Button type="button" variant="ghost" onClick={() => setStep((current) => current - 1)} className="rounded-xl text-xs font-semibold">
                    <ArrowLeft className="size-4 mr-1.5" />
                    Kembali
                  </Button>
                ) : (
                  <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#7C3AED]" />
                    <span>Langkah 1 dari {steps.length} (Wajib)</span>
                  </div>
                )}
                <Button type="submit" size="lg" className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl shadow-xs text-xs sm:text-sm">
                  {step === steps.length - 1 ? "Publikasikan Profil" : "Lanjut"}
                  <ArrowRight className="size-4 ml-1.5" />
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
          return (
            <button
              type="button"
              key={category}
              onClick={() => onChange(category)}
              aria-pressed={isSelected}
              className={`rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isSelected ? "border-[#7C3AED] bg-purple-50/50 ring-2 ring-[#7C3AED]/20 shadow-xs" : "bg-card border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{config.badge}</span>
                {isSelected && <span className="text-xs font-bold text-[#7C3AED] bg-purple-100 px-2 py-0.5 rounded-full">Dipilih</span>}
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
              className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                value === status ? "border-[#7C3AED] bg-secondary ring-2 ring-[#7C3AED]/20" : "bg-card"
              }`}
            >
              <span className="text-xl">{config.emoji}</span>
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
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

  return (
    <Intro title="Mari kenalan lebih dekat." text="Tulis ringkasan singkat agar recruiter langsung memahami kontak dan arah kariermu.">
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nama lengkap *" error={errors.fullName}>
            <input
              required
              aria-invalid={Boolean(errors.fullName)}
              autoComplete="name"
              className={inputClass}
              value={form.fullName}
              onChange={(event) => setValue("fullName", event.target.value)}
              placeholder="Contoh: Nadia Putri Rahayu"
            />
          </Field>
          <Field label="Email aktif *" error={errors.email}>
            <input
              required
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
          <Field label="Nomor telepon / WhatsApp *" error={errors.phone} hint="Digunakan recruiter untuk menghubungi saat screening disetujui">
            <input
              required
              aria-invalid={Boolean(errors.phone)}
              autoComplete="tel"
              className={inputClass}
              value={form.phone}
              onChange={(event) => setValue("phone", event.target.value)}
              placeholder="0812-xxxx-xxxx"
            />
          </Field>
          <Field label="Headline profesional *" hint="Contoh: Senior Product Designer | UX Research" error={errors.headline}>
            <input
              required
              aria-invalid={Boolean(errors.headline)}
              className={inputClass}
              value={form.headline}
              onChange={(event) => setValue("headline", event.target.value)}
              placeholder="Apa keahlian utamamu?"
            />
          </Field>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tentang kamu *
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSummaryModalOpen(true)}
              className="h-6 gap-1 border-primary/30 px-2 text-[11px] font-medium text-primary hover:bg-primary/5"
            >
              <Sparkles className="size-3" />
              Panduan Summary
            </Button>
          </div>
          <textarea
            required
            aria-invalid={Boolean(errors.about)}
            className={textareaClass}
            value={form.about}
            onChange={(event) => setValue("about", event.target.value)}
            placeholder="Ceritakan gambaran singkat profil profesionalmu..."
            rows={4}
          />
          {errors.about ? (
            <p className="text-xs text-destructive">{errors.about}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Ceritakan pengalaman, cara berpikir, atau hal yang sedang kamu cari
            </p>
          )}
        </div>
      </div>

      <ProfessionalSummaryModal
        open={summaryModalOpen}
        onOpenChange={setSummaryModalOpen}
        currentSummary={form.about}
        onApply={(newSummary) => {
          setValue("about", newSummary);
        }}
      />
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
        <Field label="Domisili saat ini *" error={errors.location}>
          <input
            required
            aria-invalid={Boolean(errors.location)}
            className={inputClass}
            value={form.location}
            onChange={(event) => setValue("location", event.target.value)}
            placeholder="Jakarta Selatan, DKI Jakarta"
          />
        </Field>
        <Field label="Peran yang dituju *" hint="Satu peran utama membantu profilmu tampil lebih fokus." error={errors.targetRole}>
          <input
            required
            aria-invalid={Boolean(errors.targetRole)}
            className={inputClass}
            value={form.targetRole}
            onChange={(event) => setValue("targetRole", event.target.value)}
            placeholder="Senior Product Designer"
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
      title="Pengalaman Kerja (Work Experience)"
      text="Tambahkan pekerjaan yang paling relevan. Jika belum memiliki pengalaman kerja formal, kamu bisa menambahkan pengalaman magang, freelance, atau organisasi."
    >
      <div className="space-y-4">
        {items.map((item, index) => (
          <Card key={index} className="p-5 border-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-widest text-[#7C3AED] font-bold">
                  Pengalaman {index + 1}
                </span>
                {item.employmentType && (
                  <span className="bg-purple-100 text-[#7C3AED] text-[11px] font-bold px-2 py-0.5 rounded-md">
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
              <Field label="Nama Perusahaan (Company Name) *">
                <input
                  required
                  className={inputClass}
                  value={item.company}
                  onChange={(event) => update(index, "company", event.target.value)}
                  placeholder="Contoh: PT GoTo Gojek Tokopedia"
                />
              </Field>
              <Field label="Jabatan / Posisi (Position) *">
                <input
                  required
                  className={inputClass}
                  value={item.role}
                  onChange={(event) => update(index, "role", event.target.value)}
                  placeholder="Contoh: Senior UI/UX Designer"
                />
              </Field>
            </div>

            {/* Row 2: Employment Type */}
            <Field label="Tipe Pekerjaan (Employment Type) *">
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
                <Field label="Tanggal / Tahun Mulai (Start Date) *">
                  <input
                    className={inputClass}
                    value={item.startDate || ""}
                    onChange={(event) => update(index, "startDate", event.target.value)}
                    placeholder="Contoh: Jan 2021 atau 2021"
                  />
                </Field>

                <Field label="Tanggal / Tahun Selesai (End Date)">
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
                  className="size-4 rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                />
                <span>Masih Bekerja di Sini (Current Position)</span>
              </label>
            </div>

            {/* Row 4: Job Description (Mandatory) */}
            <Field
              label="Deskripsi Pekerjaan & Tanggung Jawab (Job Description) *"
              hint="Jelaskan peran utama dan tanggung jawab harianmu (Wajib diisi)"
            >
              <textarea
                required
                rows={3}
                className={`${textareaClass} min-h-24`}
                value={item.description || ""}
                onChange={(event) => update(index, "description", event.target.value)}
                placeholder="Contoh: Bertanggung jawab merancang design system produk dari tahap discovery, wireframing, hingga usability testing bersama tim engineer dan product manager..."
              />
            </Field>

            {/* Row 5: Achievement (Optional) */}
            <Field
              label="Pencapaian Utama (Achievement - Opsional)"
              hint="Tuliskan hasil konkret, metrik atau capaian terbaik selama bekerja di sini (Opsional)"
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
}: {
  items: EducationItem[];
  update: (index: number, key: keyof EducationItem, value: unknown) => void;
  add: () => void;
  remove: (index: number) => void;
}) {
  const educationLevels = ["SMA/SMK", "Diploma", "S1", "S2", "S3"];

  return (
    <Intro
      title="Latar belajarmu *"
      text="Pendidikan formal atau kampus. Kampus mitra kami akan memverifikasi profilmu secara resmi!"
    >
      <div className="space-y-4">
        {/* Partner campus quick suggestions */}
        <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3.5 text-xs">
          <p className="font-semibold text-[#7C3AED] mb-1.5 flex items-center gap-1.5">
            <GraduationCap className="size-3.5" /> Pilih dari Kampus Mitra Resmi Djoin untuk Verifikasi Otomatis:
          </p>
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
                className="rounded-lg border border-purple-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-purple-100/70 transition-colors"
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
                  <span className="font-mono text-xs uppercase tracking-widest text-[#7C3AED] font-bold">
                    Pendidikan {index + 1}
                  </span>
                  {item.level && (
                    <span className="bg-purple-100 text-[#7C3AED] text-[11px] font-bold px-2 py-0.5 rounded-md">
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
                  <Field label="Jenjang Pendidikan *">
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
                    <Field label="Institusi / Universitas *">
                      <input
                        required
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
                    <Field label="Jurusan / Program Studi *">
                      <input
                        required
                        className={inputClass}
                        value={item.program}
                        onChange={(event) => update(index, "program", event.target.value)}
                        placeholder="Contoh: Teknik Informatika / Ilmu Komputer"
                      />
                    </Field>
                  </div>

                  <Field label="IPK / Nilai Akhir (GPA)">
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
                    <Field label="Tahun / Bulan Mulai (Start Date)">
                      <input
                        className={inputClass}
                        value={item.startDate || ""}
                        onChange={(event) => update(index, "startDate", event.target.value)}
                        placeholder="Contoh: Agu 2020 atau 2020"
                      />
                    </Field>

                    <Field label="Tahun / Bulan Selesai (End Date)">
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
                      className="size-4 rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                    <span>Masih Menempuh Pendidikan (Currently Studying)</span>
                  </label>
                </div>

                {partnerMatch && (
                  <div className="flex items-center gap-2 rounded-lg bg-purple-50 p-2.5 text-xs text-[#7C3AED] font-medium border border-purple-100">
                    <GraduationCap className="size-4 shrink-0" />
                    <span>
                      Terhubung ke Career Center <strong>{partnerMatch}</strong>. Profilmu akan masuk ke antrean verifikasi resmi!
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
}: {
  form: FormState;
  tagInput: { skills: string; tools: string; softSkills: string };
  setTagInput: React.Dispatch<React.SetStateAction<{ skills: string; tools: string; softSkills: string }>>;
  addTag: (kind: "skills" | "tools" | "softSkills") => void;
  removeTag: (kind: "skills" | "tools" | "softSkills", tag: string) => void;
}) {
  const group = (kind: "skills" | "tools" | "softSkills", label: string, placeholder: string, minNote?: string) => (
    <Field label={label} hint={`Tekan Enter untuk menambahkan tag. ${minNote ?? ""}`}>
      <div className="rounded-md border bg-transparent p-2 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
        <div className="flex flex-wrap gap-2">
          {form[kind].map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2.5 py-1 text-xs font-semibold text-[#7C3AED]"
            >
              {tag}
              <button type="button" aria-label={`Hapus ${tag}`} onClick={() => removeTag(kind, tag)}>
                <X className="size-3" />
              </button>
            </span>
          ))}
          <input
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
      title="Framework Kompetensi (Competencies) *"
      text="Klasifikasikan keahlianmu ke dalam Hard Competencies, Tools, dan Soft Skills untuk memudahkan pencocokan cerdas dengan kriteria rekruter."
    >
      <div className="space-y-6">
        {group(
          "skills",
          "1. Hard Competencies (Kompetensi Teknis) *",
          "Ketik kompetensi teknis lalu Enter (Contoh: UI/UX Design, Data Analysis, Backend Development)",
          "(Wajib, minimal 3 kompetensi)"
        )}
        {group(
          "tools",
          "2. Tools & Teknologi Pendukung",
          "Ketik nama software/tools lalu Enter (Contoh: Figma, VS Code, Docker, Notion, Postman)"
        )}
        {group(
          "softSkills",
          "3. Soft Skills (Kompetensi Interpersonal)",
          "Ketik soft skill lalu Enter (Contoh: Problem Solving, Public Speaking, Leadership, Team Collaboration)"
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
              value === option.value ? "border-[#7C3AED] bg-purple-50/50 ring-2 ring-[#7C3AED]/20" : "bg-card border-border"
            }`}
          >
            <span
              className={`mt-0.5 flex size-5 items-center justify-center rounded-full border ${
                value === option.value ? "border-[#7C3AED] bg-[#7C3AED] text-white" : "border-input"
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
        <div className="bg-[#0b2342] p-6 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded-full font-medium text-[#8de0be]">
              {careerLabels[form.careerStatus]}
            </span>
            <span className="text-xs bg-purple-500/30 text-purple-200 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              <span>{talentConfig.badge}</span> {talentConfig.label}
            </span>
          </div>
          <h3 className="mt-3 text-2xl font-bold">{form.fullName || "Nama kamu"}</h3>
          <p className="mt-1 text-sm text-[#b7c8dc]">{form.headline || "Headline profesional"}</p>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#b7c8dc]">
            <MapPin className="size-3.5 text-emerald-400" />
            <span>{form.location || "Lokasi belum diisi"}</span>
            <span className="text-[#55718f]">•</span>
            <span>{form.workArrangement}</span>
            <span className="text-[#55718f]">•</span>
            <span>{form.phone || "No. Telepon belum diisi"}</span>
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
          <Summary label="Status kontak" value={form.email} />
        </div>
      </Card>
      <div className="mt-5 flex gap-3 rounded-lg bg-purple-50 border border-purple-100 p-4 text-sm text-purple-900">
        <ShieldCheck className="size-5 shrink-0 text-[#7C3AED]" />
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
