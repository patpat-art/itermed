import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-session";
import { config } from "@/lib/config";
import { CheckoutBodySchema } from "@/lib/billing/schemas";
import { getOrCreateStripeCustomer, getUserBillingProfile } from "@/lib/billing/user-billing";
import { getStripeClient, isStripeConfigured } from "@/lib/billing/stripe-client";

export const runtime = "nodejs";

function resolvePriceId(body: { type: "subscription"; plan: "STUDENT" | "PREMIUM" } | { type: "bundle"; bundleId: string }) {
  if (body.type === "subscription") {
    return body.plan === "PREMIUM" ? config.STRIPE_PRICE_PREMIUM : config.STRIPE_PRICE_STUDENT;
  }
  return config.STRIPE_BUNDLE_PRICES[body.bundleId];
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe billing is not configured" }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CheckoutBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  const priceId = resolvePriceId(parsed.data);
  if (!priceId) {
    return NextResponse.json({ error: "Price not configured for this product" }, { status: 400 });
  }

  const profile = await getUserBillingProfile(userId);
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = parsed.data;
  const customerId = await getOrCreateStripeCustomer(profile);
  const stripe = getStripeClient();
  const origin = config.APP_URL.replace(/\/$/, "");

  if (body.type === "subscription") {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard/settings?billing=success`,
      cancel_url: `${origin}/dashboard/settings?billing=canceled`,
      metadata: { userId, planType: body.plan },
      subscription_data: {
        metadata: { userId, planType: body.plan },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard/settings?billing=success`,
    cancel_url: `${origin}/dashboard/settings?billing=canceled`,
    metadata: { userId, bundleId: body.bundleId },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
