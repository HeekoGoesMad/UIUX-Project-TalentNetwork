import { JobDetailPage } from "@/components/jobs/job-ui";
export default async function Page({ params }: { params: Promise<{ jobId: string }> }) { return <JobDetailPage jobId={(await params).jobId} />; }
