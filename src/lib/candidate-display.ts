export function maskName(fullName: string): string {
  return fullName
    .split(" ")
    .map((word) => (word.length > 0 ? word[0] + "*****" : ""))
    .join(" ");
}

export function getDaysInCurrentStage(candidate: {
  stage?: string;
  appliedAt?: string;
  statusHistory?: Array<{ stage: string; timestamp?: string }>;
}): number {
  if (Array.isArray(candidate.statusHistory) && candidate.statusHistory.length > 0) {
    const sorted = [...candidate.statusHistory].sort(
      (a, b) => new Date(b.timestamp ?? "").getTime() - new Date(a.timestamp ?? "").getTime()
    );
    const latestStageEntry = sorted.find((h) => h.stage === candidate.stage);
    if (latestStageEntry && latestStageEntry.timestamp) {
      const time = new Date(latestStageEntry.timestamp).getTime();
      if (!isNaN(time)) {
        return Math.max(0, Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24)));
      }
    }
  }
  if (candidate.appliedAt) {
    const time = new Date(candidate.appliedAt).getTime();
    if (!isNaN(time)) {
      return Math.max(0, Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24)));
    }
  }
  return 0;
}

export function getDaysSinceDate(dateStr?: string | null): number {
  if (!dateStr) return 0;
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24)));
}

