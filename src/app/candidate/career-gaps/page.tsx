import { AiTool } from "@/components/candidate/ai-tool";
import { ProtectedRoute } from "@/components/auth/protected-route";
export default function Page() { return <ProtectedRoute role="candidate"><AiTool title="Career Gaps" description="Bedakan skill yang missing, belum punya evidence, atau transferable." endpoint="/api/ai/gap-analysis" /></ProtectedRoute>; }
