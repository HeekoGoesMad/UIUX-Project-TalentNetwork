export const DEFAULT_CAREER_HUB_COOLDOWN_DAYS = 30;

export function getCareerHubCooldownDays(): number {
  const envVal = process.env.NEXT_PUBLIC_CAREER_HUB_COOLDOWN_DAYS;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
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
  nextAvailableDate: Date | null;
  nextAvailableFormatted: string;
};

export function checkCareerAdvisorCooldown(generatedAt: string | null | undefined): CooldownStatus {
  if (!generatedAt) {
    return {
      isCooldown: false,
      daysRemaining: 0,
      hoursRemaining: 0,
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
      nextAvailableDate: new Date(nextAvailableTime),
      nextAvailableFormatted: "",
    };
  }

  const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  const hoursRemaining = Math.ceil(diffMs / (60 * 60 * 1000));
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
    nextAvailableDate: nextDate,
    nextAvailableFormatted: formattedDate,
  };
}
