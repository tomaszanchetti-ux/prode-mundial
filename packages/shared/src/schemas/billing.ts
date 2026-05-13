import { z } from "zod";

export const createBillingCheckoutResponseSchema = z.object({
  url: z.string().url()
});

export type CreateBillingCheckoutResponse = z.infer<typeof createBillingCheckoutResponseSchema>;
