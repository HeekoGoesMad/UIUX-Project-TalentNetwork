import { RecruiterOperationsPage } from "@/components/recruiter/recruiter-operations";

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <RecruiterOperationsPage initialJobId={jobId} />;
}
