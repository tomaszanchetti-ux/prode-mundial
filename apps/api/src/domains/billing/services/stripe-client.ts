import Stripe from "stripe";

/**
 * Lazy singleton for the Stripe SDK. Returns null when STRIPE_SECRET_KEY is not
 * configured so the API can boot and the rest of the product keeps working
 * (controllers will short-circuit to 503 instead of crashing the server).
 */
let cachedClient: Stripe | null | undefined;

export function getStripeClient(): Stripe | null {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    cachedClient = null;
    return null;
  }

  cachedClient = new Stripe(secretKey, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true
  });
  return cachedClient;
}

export function isStripeEnabled(): boolean {
  return (
    process.env.STRIPE_ENABLED === "true" &&
    Boolean(process.env.STRIPE_SECRET_KEY) &&
    Boolean(process.env.STRIPE_WEBHOOK_SECRET) &&
    Boolean(process.env.STRIPE_GOLD_PRICE_ID)
  );
}

// Test-only: clear the cached client so unit tests can change env vars between cases.
export function resetStripeClientForTests(): void {
  cachedClient = undefined;
}
