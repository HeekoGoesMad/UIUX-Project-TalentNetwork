import { Suspense } from "react";
import { eq } from "drizzle-orm";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { RecruiterSettingsView } from "@/components/recruiter/recruiter-settings-view";
import { getCurrentAppUser } from "@/lib/api/auth";
import { schema } from "@/db";
import type { NotificationPrefs } from "@/components/settings/notification-settings";

export default async function RecruiterSettingsPage() {
  let initialPreferences: NotificationPrefs | null = null;

  try {
    const auth = await getCurrentAppUser();
    if (!("error" in auth) && auth.user.role === "recruiter") {
      const [preferences] = await auth.db
        .select({
          inAppEnabled: schema.notificationPreferences.inAppEnabled,
          emailEnabled: schema.notificationPreferences.emailEnabled,
          quietHours: schema.notificationPreferences.quietHours,
        })
        .from(schema.notificationPreferences)
        .where(eq(schema.notificationPreferences.userId, auth.user.id))
        .limit(1);

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
    <ProtectedRoute role="recruiter">
      <Suspense fallback={null}>
        <RecruiterSettingsView initialPreferences={initialPreferences} />
      </Suspense>
    </ProtectedRoute>
  );
}
