import type Stripe from "stripe";
import { ApiError } from "../../../server/errors/api-error";
import { usersRepository } from "../../users/repositories/users-repository";
import { getStripeClient, isStripeEnabled } from "../services/stripe-client";

type ProcessWebhookInput = {
  rawBody: Buffer;
  signature: string | string[] | undefined;
};

type ProcessWebhookResult = {
  eventId: string;
  eventType: string;
  acknowledged: boolean;
};

export async function processWebhook(input: ProcessWebhookInput): Promise<ProcessWebhookResult> {
  if (!isStripeEnabled()) {
    throw new ApiError(503, "STRIPE_DISABLED", "Billing is not configured yet.");
  }

  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    throw new ApiError(503, "STRIPE_DISABLED", "Billing is not configured yet.");
  }

  if (!input.signature || Array.isArray(input.signature)) {
    throw new ApiError(400, "STRIPE_WEBHOOK_INVALID", "Missing or invalid stripe-signature header.");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(input.rawBody, input.signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature.";
    throw new ApiError(400, "STRIPE_WEBHOOK_INVALID", message);
  }

  if (event.type === "checkout.session.completed") {
    await handleCheckoutSessionCompleted(event);
  }

  return {
    eventId: event.id,
    eventType: event.type,
    acknowledged: true
  };
}

async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.payment_status !== "paid") {
    return;
  }

  const userId = session.metadata?.userId;
  if (!userId) {
    // Defensive: every checkout we initiate sets this. Stripe Dashboard manual
    // sessions could be missing it; skip silently rather than crash.
    return;
  }

  const profile = await usersRepository.findByUserId(userId);
  if (!profile) {
    return;
  }

  if (profile.plan === "gold") {
    // Idempotent: webhook may retry. Skip if already upgraded.
    return;
  }

  await usersRepository.markGold(userId, new Date().toISOString());
}
