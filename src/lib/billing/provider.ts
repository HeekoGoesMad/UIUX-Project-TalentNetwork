import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export type CheckoutRequest = { purchaseId: string; amountMinor: number; currency: string; description: string };
export type CheckoutResult = { providerReference: string; checkoutUrl: string | null };

export function getPaymentProvider() {
  const provider = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (!provider) {
    if (process.env.NODE_ENV === "development") return { kind: "mock" as const };
    throw new Error("PAYMENT_PROVIDER must be configured in production.");
  }
  if (provider === "mock") {
    if (process.env.NODE_ENV !== "development") throw new Error("Mock payment provider hanya tersedia di development.");
    return { kind: "mock" as const };
  }
  return { kind: "configured" as const, name: provider };
}

export function createCheckout(request: CheckoutRequest): CheckoutResult {
  const provider = getPaymentProvider();
  if (provider.kind === "mock") {
    return { providerReference: `mock_${request.purchaseId}`, checkoutUrl: `/recruiter/billing?mockPurchase=${request.purchaseId}` };
  }
  throw new Error(`Payment provider ${provider.name} has no adapter in Phase 1.`);
}

export function validateWebhookSecret(rawBody: string, signature: string | null) {
  const provider = getPaymentProvider();
  if (provider.kind === "mock") return process.env.NODE_ENV === "development";
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(signature.replace(/^sha256=/, ""));
  return left.length === right.length && timingSafeEqual(left, right);
}
