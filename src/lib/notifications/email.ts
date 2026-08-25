import "server-only";

export type NotificationEmail = {
  to: string;
  subject: string;
  text: string;
};

export type EmailDeliveryResult = {
  providerMessageId: string;
  mode: "brevo" | "mock";
};

type BrevoConfig = {
  apiKey: string;
  senderEmail: string;
  senderName: string;
};

function getBrevoConfig(): BrevoConfig {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName = process.env.BREVO_SENDER_NAME?.trim();

  if (provider !== "brevo") {
    throw new Error("Production email delivery requires EMAIL_PROVIDER=brevo.");
  }
  if (!apiKey || !senderEmail || !senderName) {
    throw new Error(
      "Production email delivery requires BREVO_API_KEY, BREVO_SENDER_EMAIL, and BREVO_SENDER_NAME.",
    );
  }

  return { apiKey, senderEmail, senderName };
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

function getEmailProvider(): "mock" | "brevo" {
  if (process.env.NODE_ENV !== "production") return "mock";
  return "brevo";
}

export async function sendNotificationEmail(input: NotificationEmail): Promise<EmailDeliveryResult> {
  const provider = getEmailProvider();
  if (provider === "mock") {
    return { providerMessageId: `mock-demo-${Date.now()}`, mode: "mock" };
  }

  const config = getBrevoConfig();
  let response: Response;

  try {
    response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": config.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: config.senderEmail, name: config.senderName },
        to: [{ email: input.to }],
        subject: input.subject,
        textContent: input.text,
        htmlContent: `<p>${escapeHtml(input.text).replace(/\n/g, "<br />")}</p>`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error("[email] Brevo request failed.", error);
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("Brevo email request timed out.");
    }
    throw new Error("Brevo email request failed before a response was received.");
  }

  if (!response.ok) {
    console.error("[email] Brevo responded with a non-OK status.", { status: response.status });
    throw new Error(`Brevo email request failed with status ${response.status}.`);
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("Brevo email response was not valid JSON.");
  }

  if (
    typeof result !== "object" ||
    result === null ||
    !("messageId" in result) ||
    typeof result.messageId !== "string" ||
    !result.messageId
  ) {
    throw new Error("Brevo email response did not include a messageId.");
  }

  return { providerMessageId: result.messageId, mode: "brevo" };
}
