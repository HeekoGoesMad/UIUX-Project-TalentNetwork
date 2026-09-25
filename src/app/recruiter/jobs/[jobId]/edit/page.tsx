import { JobEditPage } from "@/components/recruiter/jobs-manage";

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <JobEditPage jobId={jobId} />;
}
