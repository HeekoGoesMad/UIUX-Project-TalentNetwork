import type { CareerStatus, TalentCategory, IndustryCategory } from "@/types";

export const CAREER_STATUS_CONFIG: Record<CareerStatus, { label: string; color: string; dot: string; emoji: string }> = {
  "open-to-work": { label: "Open to Work", color: "bg-slate-50 text-[#7C3AED] border border-slate-200", dot: "bg-[#7C3AED]", emoji: "🟣" },
  "open-for-opportunities": { label: "Open for Opportunities", color: "bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/30", dot: "bg-[#F59E0B]", emoji: "🟡" },
  "freelance-available": { label: "Freelance", color: "bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]", dot: "bg-[#2563EB]", emoji: "🔵" },
  "internship-available": { label: "Internship", color: "bg-slate-50 text-[#7C3AED] border border-slate-200", dot: "bg-[#7C3AED]", emoji: "🟣" },
  "not-available": { label: "Not Available", color: "bg-slate-100 text-slate-700", dot: "bg-slate-500", emoji: "⚫" },
};

export const TALENT_CATEGORY_CONFIG: Record<TalentCategory, { label: string; badge: string; description: string; color: string; badgeBg: string }> = {
  "djoin-verified": {
    label: "DJoin Verified Talent",
    badge: "🏅",
    description: "Pernah dibina Djoin, memiliki histori evaluasi & rekam jejak performa",
    color: "text-[#7C3AED]",
    badgeBg: "bg-slate-50 border border-slate-200 text-[#7C3AED]",
  },
  "public": {
    label: "Public Talent",
    badge: "👤",
    description: "Registrasi mandiri, Career Fair, Campus Partnership, atau Referral",
    color: "text-slate-600",
    badgeBg: "bg-slate-50 border border-slate-200 text-slate-600",
  },
};

export const INDUSTRY_CATEGORY_CONFIG: Record<IndustryCategory, { label: string }> = {
  "human-capital": { label: "Human Capital / HR" },
  "marketing-digital": { label: "Marketing / Digital" },
  "product-design": { label: "Product / Design" },
  "sales-bizdev": { label: "Sales / Business Development" },
  "data-analytics": { label: "Data / Analytics" },
  "technology-software": { label: "Technology / Software" },
};
