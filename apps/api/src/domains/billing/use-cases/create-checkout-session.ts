import { ApiError } from "../../../server/errors/api-error";
import { usersRepository } from "../../users/repositories/users-repository";
import { getStripeClient, isStripeEnabled } from "../services/stripe-client";

type CreateCheckoutSessionInput = {
  userId: string;
  email: string;
};

type CreateCheckoutSessionResult = {
  url: string;
};

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<CreateCheckoutSessionResult> {
  if (!isStripeEnabled()) {
    throw new ApiError(503, "STRIPE_DISABLED", "Billing is not configured yet.");
  }

  const stripe = getStripeClient();
  if (!stripe) {
    throw new ApiError(503, "STRIPE_DISABLED", "Billing is not configured yet.");
  }

  const profile = await usersRepository.findByUserId(input.userId);
  if (profile?.plan === "gold") {
    throw new ApiError(409, "STRIPE_ALREADY_GOLD", "User is already on Gold plan.");
  }

  // Reuse Stripe customer across sessions so the dashboard groups payments under
  // a single record and future upgrades (e.g. World Cup 2030) skip the data form.
  let stripeCustomerId = await usersRepository.findStripeCustomerId(input.userId);
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: input.email,
      metadata: { userId: input.userId }
    });
    stripeCustomerId = customer.id;
    await usersRepository.setStripeCustomerId(input.userId, stripeCustomerId);
  }

  const webUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";
  const priceId = process.env.STRIPE_GOLD_PRICE_ID!;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      userId: input.userId,
      purpose: "prode_gold_upgrade"
    },
    payment_intent_data: {
      metadata: {
        userId: input.userId,
        purpose: "prode_gold_upgrade"
      }
    },
    success_url: `${webUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${webUrl}/profile?upgrade=cancelled#planes`,
    allow_promotion_codes: true
  });

  if (!session.url) {
    throw new ApiError(502, "STRIPE_CHECKOUT_FAILED", "Stripe did not return a checkout URL.");
  }

  return { url: session.url };
}
