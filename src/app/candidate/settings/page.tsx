import { eq } from "drizzle-orm";

import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  CandidateSettingsView,
  type CandidateProfileData,
  type NotificationPrefs,
} from "@/components/candidate/candidate-settings-view";
import { getCurrentAppUser } from "@/lib/api/auth";
import { schema } from "@/db";

export default async function CandidateSettingsPage() {
  let initialProfile: CandidateProfileData | null = null;
  let initialPreferences: NotificationPrefs | null = null;

  try {
    const auth = await getCurrentAppUser();
    if (!("error" in auth) && auth.user.role === "candidate") {
      const [profile, candidateProfile, preferences] = await Promise.all([
        auth.db
          .select({
            displayName: schema.profiles.displayName,
            avatarUrl: schema.profiles.avatarUrl,
            phone: schema.profiles.phone,
            createdAt: schema.profiles.createdAt,
          })
          .from(schema.profiles)
          .where(eq(schema.profiles.userId, auth.user.id))
          .limit(1)
          .then(([p]) =>
            p
              ? {
                  displayName: p.displayName,
                  avatarUrl: p.avatarUrl,
                  phone: p.phone,
                  createdAt: p.createdAt?.toISOString(),
                }
              : null
          ),
        auth.db
          .select({
            id: schema.candidateProfiles.id,
            headline: schema.candidateProfiles.headline,
            targetRole: schema.candidateProfiles.targetRole,
            location: schema.candidateProfiles.location,
            summary: schema.candidateProfiles.summary,
            isPublished: schema.candidateProfiles.isPublished,
            completeness: schema.candidateProfiles.completeness,
          })
          .from(schema.candidateProfiles)
          .where(eq(schema.candidateProfiles.userId, auth.user.id))
          .limit(1)
          .then(([cp]) => cp ?? null),
        auth.db
          .select({
            inAppEnabled: schema.notificationPreferences.inAppEnabled,
            emailEnabled: schema.notificationPreferences.emailEnabled,
            quietHours: schema.notificationPreferences.quietHours,
          })
          .from(schema.notificationPreferences)
          .where(eq(schema.notificationPreferences.userId, auth.user.id))
          .limit(1)
          .then(([pref]) => pref ?? null),
      ]);

      initialProfile = {
        user: {
          id: auth.user.id,
          email: auth.user.email,
          role: auth.user.role,
        },
        profile,
        candidateProfile,
      };

      if (preferences) {
        const qh = preferences.quietHours as { start?: string; end?: string } | null;
        initialPreferences = {
          inAppEnabled: preferences.inAppEnabled ?? true,
          emailEnabled: preferences.emailEnabled ?? true,
          quietHours: {
            start: qh?.start || "",
            end: qh?.end || "",
          },
        };
      }
    }
  } catch {
    // Graceful fallback if database connection or session is unavailable during SSR
  }

  return (
    <ProtectedRoute role="candidate">
      <CandidateSettingsView
        initialProfile={initialProfile}
        initialPreferences={initialPreferences}
      />
    </ProtectedRoute>
  );
}
