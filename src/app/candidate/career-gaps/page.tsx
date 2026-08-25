import { AiTool } from "@/components/candidate/ai-tool";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function Page() {
  return (
    <ProtectedRoute role="candidate">
      <AiTool
        title="Career Gaps"
        description="Analisis skill yang belum terpenuhi, belum memiliki bukti, atau dapat dialihkan (transferable)."
        endpoint="/api/ai/gap-analysis"
      />
    </ProtectedRoute>
  );
}
