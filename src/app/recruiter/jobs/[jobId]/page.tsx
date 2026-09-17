import { JobManagePage } from "@/components/recruiter/jobs-manage";
export default async function Page({ params }: { params: Promise<{ jobId: string }> }) { return <JobManagePage jobId={(await params).jobId} />; }
