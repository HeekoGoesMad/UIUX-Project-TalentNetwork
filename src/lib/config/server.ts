import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

type ServiceName = "database" | "supabase" | "billing" | "storage" | "email";

export type ProductionConfig = {
  isProduction: boolean;
  flags: {
    billingEnabled: boolean;
    documentStorageEnabled: boolean;
    emailDeliveryEnabled: boolean;
  };
  readiness: Record<ServiceName, boolean>;
};

function isEnabled(value: string | undefined, defaultValue: boolean) {
  return value === undefined ? defaultValue : value.trim().toLowerCase() === "true";
}

function hasValue(name: string) {
  return Boolean(process.env[name]?.trim());
}

export function getProductionConfig(): ProductionConfig {
  const isProduction = process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";
  const flags = {
    // Billing is part of the application surface; local development uses its mock adapter.
    billingEnabled: isEnabled(process.env.BILLING_ENABLED, true),
    documentStorageEnabled: isEnabled(process.env.DOCUMENT_STORAGE_ENABLED, true),
    emailDeliveryEnabled: isEnabled(process.env.EMAIL_DELIVERY_ENABLED, false),
  };

  return {
    isProduction,
    flags,
    readiness: {
      database: hasValue("DATABASE_URL"),
      supabase: hasValue("NEXT_PUBLIC_SUPABASE_URL") && hasValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      billing: !flags.billingEnabled || (hasValue("PAYMENT_PROVIDER") && hasValue("PAYMENT_WEBHOOK_SECRET")),
      storage: !flags.documentStorageEnabled || hasValue("SUPABASE_CV_BUCKET"),
      email:
        !flags.emailDeliveryEnabled ||
        (process.env.EMAIL_PROVIDER?.trim().toLowerCase() === "brevo" &&
          hasValue("BREVO_API_KEY") &&
          hasValue("BREVO_SENDER_EMAIL") &&
          hasValue("BREVO_SENDER_NAME")),
    },
  };
}

export function validateProductionConfig() {
  const config = getProductionConfig();
  if (!config.isProduction) return config;

  const missing: string[] = [];
  if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true") missing.push("NEXT_PUBLIC_DEV_AUTH_BYPASS must not be true");
  if (process.env.DEV_TOKEN_GRANT_ENABLED === "true") missing.push("DEV_TOKEN_GRANT_ENABLED must not be true");
  if (!config.readiness.database) missing.push("DATABASE_URL");
  if (!config.readiness.supabase) missing.push("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!config.readiness.billing) missing.push("PAYMENT_PROVIDER and PAYMENT_WEBHOOK_SECRET");
  if (config.flags.billingEnabled && process.env.PAYMENT_PROVIDER?.trim().toLowerCase() === "mock") missing.push("PAYMENT_PROVIDER must not be mock");
  if (!config.readiness.storage) missing.push("SUPABASE_CV_BUCKET");
  if (!config.readiness.email) {
    missing.push("EMAIL_PROVIDER=brevo, BREVO_API_KEY, BREVO_SENDER_EMAIL, and BREVO_SENDER_NAME");
  }
  if (config.flags.emailDeliveryEnabled && process.env.EMAIL_PROVIDER?.trim().toLowerCase() === "mock") {
    missing.push("EMAIL_PROVIDER must not be mock");
  }

  if (missing.length > 0) {
    throw new Error(`Production configuration is invalid: ${missing.join(", ")}.`);
  }

  return config;
}

export function isHealthTokenValid(token: string | null) {
  const expected = process.env.HEALTHCHECK_TOKEN?.trim();
  if (!expected || !token) return false;
  const left = createHmac("sha256", "healthcheck").update(expected).digest();
  const right = createHmac("sha256", "healthcheck").update(token).digest();
  return timingSafeEqual(left, right);
}
