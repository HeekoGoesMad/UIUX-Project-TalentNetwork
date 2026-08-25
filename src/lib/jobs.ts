export const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "internship", "temporary"] as const;
export const WORK_ARRANGEMENTS = ["onsite", "hybrid", "remote"] as const;
export const JOB_STATUSES = ["draft", "published", "closed", "archived"] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type WorkArrangement = (typeof WORK_ARRANGEMENTS)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];
export type JobRequirement = { id: string; type: "required" | "preferred"; name: string };
export type Job = {
  id: string;
  organizationId?: string;
  organizationName: string;
  title: string;
  description: string;
  status: JobStatus;
  employmentType: EmploymentType;
  workArrangement: WorkArrangement;
  location: string | null;
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  requirements: JobRequirement[];
};

export const DEMO_JOBS: Job[] = [
  {
    id: "demo-job-product-designer",
    organizationName: "Nusantara Labs",
    title: "Product Designer",
    description: "Rancang pengalaman produk end-to-end bersama product dan engineering team untuk pengguna di Indonesia.",
    status: "published",
    employmentType: "full_time",
    workArrangement: "hybrid",
    location: "Jakarta Selatan",
    publishedAt: "2026-08-10T08:00:00.000Z",
    closedAt: null,
    createdAt: "2026-08-08T08:00:00.000Z",
    updatedAt: "2026-08-10T08:00:00.000Z",
    requirements: [
      { id: "demo-req-1", type: "required", name: "Product Design" },
      { id: "demo-req-2", type: "required", name: "Figma" },
      { id: "demo-req-3", type: "preferred", name: "UX Research" },
    ],
  },
  {
    id: "demo-job-growth-engineer",
    organizationName: "Karya Digital",
    title: "Frontend Engineer",
    description: "Bangun interface yang cepat dan accessible untuk platform karier generasi berikutnya.",
    status: "published",
    employmentType: "contract",
    workArrangement: "remote",
    location: "Indonesia",
    publishedAt: "2026-08-06T08:00:00.000Z",
    closedAt: null,
    createdAt: "2026-08-05T08:00:00.000Z",
    updatedAt: "2026-08-06T08:00:00.000Z",
    requirements: [
      { id: "demo-req-4", type: "required", name: "React" },
      { id: "demo-req-5", type: "required", name: "TypeScript" },
      { id: "demo-req-6", type: "preferred", name: "Next.js" },
    ],
  },
];

export const employmentLabels: Record<EmploymentType, string> = {
  full_time: "Full-time", part_time: "Part-time", contract: "Contract", internship: "Internship", temporary: "Temporary",
};
export const arrangementLabels: Record<WorkArrangement, string> = { onsite: "On-site", hybrid: "Hybrid", remote: "Remote" };
export const statusLabels: Record<JobStatus, string> = { draft: "Draft", published: "Published", closed: "Closed", archived: "Archived" };
