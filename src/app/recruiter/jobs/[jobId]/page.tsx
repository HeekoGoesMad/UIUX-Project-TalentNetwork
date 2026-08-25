import { JobManagePage } from "@/components/jobs/job-ui";
export default async function Page({ params }: { params: Promise<{ jobId: string }> }) { return <JobManagePage jobId={(await params).jobId} />; }
