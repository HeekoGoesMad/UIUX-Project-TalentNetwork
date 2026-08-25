import { RecruiterPipelinePage } from "@/components/applications/application-ui";
export default async function Page({ params }: { params: Promise<{ jobId: string }> }) { return <RecruiterPipelinePage jobId={(await params).jobId} />; }
