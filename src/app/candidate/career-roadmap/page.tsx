import { AiTool } from "@/components/candidate/ai-tool";
import { ProtectedRoute } from "@/components/auth/protected-route";
export default function Page() { return <ProtectedRoute role="candidate"><AiTool title="Career Roadmap" description="Bangun fase belajar dan bukti kerja yang dapat kamu edit." endpoint="/api/ai/roadmap" /></ProtectedRoute>; }
