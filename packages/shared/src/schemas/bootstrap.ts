import { z } from "zod";

export const publicBootstrapSchema = z.object({
  productName: z.string().min(1),
  tagline: z.string().min(1),
  features: z.array(z.string().min(1)).min(1),
  authProviders: z.object({
    google: z.boolean(),
    magicLink: z.boolean()
  })
});
