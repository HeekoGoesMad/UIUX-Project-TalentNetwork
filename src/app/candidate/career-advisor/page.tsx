import { AiTool } from "@/components/candidate/ai-tool";
import { ProtectedRoute } from "@/components/auth/protected-route";
export default function Page() { return <ProtectedRoute role="candidate"><AiTool title="Career Advisor" description="Tanya langkah karier berdasarkan profile yang kamu pilih untuk dibagikan." endpoint="/api/ai/career-advisor" /></ProtectedRoute>; }
