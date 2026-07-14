import "server-only";
import type Stripe from "stripe";
import { config } from "@/lib/config";
import type { PlanType } from "@/lib/billing/plans";
import {
  appendPurchasedBundle,
  applySubscriptionUpdate,
  revokeSubscription,
} from "@/lib/billing/user-billing";
import { createLogger } from "@/lib/logger";

const log = createLogger("stripe-webhook");

function planFromPriceId(priceId: string | undefined): PlanType | null {
  if (!priceId) return null;
  if (priceId === config.STRIPE_PRICE_STUDENT) return "STUDENT";
  if (priceId === config.STRIPE_PRICE_PREMIUM) return "PREMIUM";
  return null;
}

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

  if (!userId || !customerId) {
    log.warn("checkout.session.completed missing metadata", { sessionId: session.id });
    return;
  }

  if (session.mode === "subscription" && session.subscription) {
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription.id;
    const planType = (session.metadata?.planType as PlanType | undefined) ?? "STUDENT";

    await applySubscriptionUpdate({
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: "active",
      planType,
    });
    return;
  }

  if (session.mode === "payment") {
    const bundleId = session.metadata?.bundleId;
    if (bundleId) {
      await appendPurchasedBundle(userId, bundleId);
    }
  }
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  if (!customerId) return;

  const priceId = subscription.items.data[0]?.price?.id;
  const planType = planFromPriceId(priceId) ?? "STUDENT";

  await applySubscriptionUpdate({
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    planType,
  });
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  if (!customerId) return;
  await revokeSubscription(customerId);
}
