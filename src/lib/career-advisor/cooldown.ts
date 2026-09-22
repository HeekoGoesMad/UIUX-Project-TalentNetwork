export const CAREER_HUB_BURST_LIMIT = 3;
export const CAREER_HUB_BURST_WINDOW_MINUTES = 30;
export const CAREER_HUB_DAILY_LIMIT = 10;
export const CAREER_HUB_MAX_OUTPUT_TOKENS = 4000;

// Legacy cooldown config kept for backward compatibility (defaults to 0 to disable rigid multi-day lockout)
export const DEFAULT_CAREER_HUB_COOLDOWN_DAYS = 0;

export function getCareerHubCooldownDays(): number {
  const envVal = process.env.NEXT_PUBLIC_CAREER_HUB_COOLDOWN_DAYS;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed >= 0) return parsed;
  }
  return DEFAULT_CAREER_HUB_COOLDOWN_DAYS;
}

export function getCareerHubCooldownMs(): number {
  return getCareerHubCooldownDays() * 24 * 60 * 60 * 1000;
}

export type CooldownStatus = {
  isCooldown: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining?: number;
  nextAvailableDate: Date | null;
  nextAvailableFormatted: string;
};

/**
 * Checks cooldown status. Under the new 4-layer control model,
 * multi-day rigid lockouts are disabled (defaulting to 0 days) in favor of
 * dynamic Burst (3x/30m) and Daily (10x/day) rate limits handled by the API.
 */
export function checkCareerAdvisorCooldown(generatedAt: string | null | undefined): CooldownStatus {
  const cooldownDays = getCareerHubCooldownDays();
  if (!generatedAt || cooldownDays <= 0) {
    return {
      isCooldown: false,
      daysRemaining: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      nextAvailableDate: null,
      nextAvailableFormatted: "",
    };
  }

  const generatedTime = new Date(generatedAt).getTime();
  if (isNaN(generatedTime)) {
    return {
      isCooldown: false,
      daysRemaining: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      nextAvailableDate: null,
      nextAvailableFormatted: "",
    };
  }

  const cooldownMs = getCareerHubCooldownMs();
  const nextAvailableTime = generatedTime + cooldownMs;
  const now = Date.now();
  const diffMs = nextAvailableTime - now;

  if (diffMs <= 0) {
    return {
      isCooldown: false,
      daysRemaining: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      nextAvailableDate: new Date(nextAvailableTime),
      nextAvailableFormatted: "",
    };
  }

  const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  const hoursRemaining = Math.ceil(diffMs / (60 * 60 * 1000));
  const minutesRemaining = Math.ceil(diffMs / (60 * 1000));
  const nextDate = new Date(nextAvailableTime);

  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(nextDate);

  return {
    isCooldown: true,
    daysRemaining,
    hoursRemaining,
    minutesRemaining,
    nextAvailableDate: nextDate,
    nextAvailableFormatted: formattedDate,
  };
}

