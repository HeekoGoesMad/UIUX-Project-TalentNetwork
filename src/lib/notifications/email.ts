import "server-only";

export type NotificationEmail = {
  to: string;
  subject: string;
  text: string;
};

export type EmailDeliveryResult = {
  providerMessageId: string;
  mode: "mock";
};

type EmailProvider = { kind: "mock" } | { kind: "configured"; name: string };

function getEmailProvider(): EmailProvider {
  if (process.env.NODE_ENV !== "production") return { kind: "mock" };

  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  const webhookSecret = process.env.EMAIL_WEBHOOK_SECRET?.trim();
  if (!provider || !webhookSecret) {
    throw new Error("Production email delivery requires EMAIL_PROVIDER and EMAIL_WEBHOOK_SECRET.");
  }
  if (provider === "mock") {
    throw new Error("Mock email provider is not available in production.");
  }
  return { kind: "configured", name: provider };
}

/**
 * Phase 1 intentionally has no network email implementation. Development is
 * observable through delivery rows; production fails explicitly until a
 * provider adapter is added and configured.
 */
export async function sendNotificationEmail(input: NotificationEmail): Promise<EmailDeliveryResult> {
  const provider = getEmailProvider();
  if (provider.kind === "mock") {
    void input;
    return { providerMessageId: `mock-demo-${Date.now()}`, mode: "mock" };
  }

  void input;
  throw new Error(`Email provider ${provider.name} has no adapter; no email was sent.`);
}
