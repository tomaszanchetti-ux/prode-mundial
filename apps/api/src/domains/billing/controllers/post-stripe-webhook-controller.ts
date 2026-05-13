import type { Request, Response } from "express";
import { ok } from "../../../server/http/respond";
import { processWebhook } from "../use-cases/process-webhook";

/**
 * Stripe webhook receiver. This route must be mounted with express.raw() so
 * the body is preserved as a Buffer for HMAC signature validation. Mounting it
 * after express.json() would mutate req.body and break constructEvent().
 */
export async function postStripeWebhookController(req: Request, res: Response) {
  const result = await processWebhook({
    rawBody: req.body as Buffer,
    signature: req.headers["stripe-signature"]
  });
  res.status(200).json(ok(result));
}
