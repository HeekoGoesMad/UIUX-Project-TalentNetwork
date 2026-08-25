import { CandidateApplicationDetailPage } from "@/components/applications/application-ui";
export default async function Page({ params }: { params: Promise<{ applicationId: string }> }) { return <CandidateApplicationDetailPage applicationId={(await params).applicationId} />; }
