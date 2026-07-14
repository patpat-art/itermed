import { z } from "zod";

export const CheckoutBodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("subscription"),
    plan: z.enum(["STUDENT", "PREMIUM"]),
  }),
  z.object({
    type: z.literal("bundle"),
    bundleId: z.string().min(1).max(80),
  }),
]);

export type CheckoutBody = z.infer<typeof CheckoutBodySchema>;
