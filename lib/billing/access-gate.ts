import "server-only";
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  FREE_CHAT_MESSAGE_LIMIT,
  FREE_TRIAL_SIMULATION_LIMIT,
  isSubscriptionPlan,
  PAID_CHAT_MESSAGE_LIMIT,
} from "@/lib/billing/plans";
import type { UserBillingProfile } from "@/lib/billing/user-billing";

/** Patient chat always uses gpt-4o-mini. gpt-4o is reserved for evaluation/RAG. */
export type ChatModelId = "gpt-4o-mini";

export type GateResult =
  | { allowed: true }
  | { allowed: false; code: string; message: string; status: number };

function isAdmin(profile: UserBillingProfile): boolean {
  return profile.role === "ADMIN";
}

export function hasActiveSubscription(profile: UserBillingProfile): boolean {
  if (isAdmin(profile)) return true;
  if (!isSubscriptionPlan(profile.planType)) return false;
  if (!profile.subscriptionStatus) return false;
  return ACTIVE_SUBSCRIPTION_STATUSES.has(profile.subscriptionStatus);
}

export function assertCanStartSimulation(profile: UserBillingProfile): GateResult {
  if (isAdmin(profile) || hasActiveSubscription(profile)) {
    return { allowed: true };
  }

  if (profile.freeTrialUsageCount >= FREE_TRIAL_SIMULATION_LIMIT) {
    return {
      allowed: false,
      code: "TRIAL_EXHAUSTED",
      status: 403,
      message:
        "Hai esaurito le 2 simulazioni gratuite. Abbonati a IterMed per continuare ad allenarti.",
    };
  }

  return { allowed: true };
}

export function assertCanAccessBundle(
  profile: UserBillingProfile,
  bundleId: string | null | undefined,
): GateResult {
  if (!bundleId?.trim()) return { allowed: true };
  if (isAdmin(profile) || hasActiveSubscription(profile)) return { allowed: true };
  if (profile.purchasedBundleIds.includes(bundleId)) return { allowed: true };

  return {
    allowed: false,
    code: "BUNDLE_LOCKED",
    status: 402,
    message:
      "Questo pacchetto di casi è a pagamento. Acquista il bundle o abbonati per sbloccarlo.",
  };
}

export function countUserChatMessages(messages: { role: string; content: string }[]): number {
  return messages.filter((m) => m.role === "user" && m.content.trim().length > 0).length;
}

export function assertCanSendChatMessage(
  profile: UserBillingProfile,
  messages: { role: string; content: string }[],
): GateResult {
  const userMessageCount = countUserChatMessages(messages);

  if (hasActiveSubscription(profile) || isAdmin(profile)) {
    if (userMessageCount > PAID_CHAT_MESSAGE_LIMIT) {
      return {
        allowed: false,
        code: "CHAT_LIMIT_REACHED",
        status: 429,
        message: `Limite di ${PAID_CHAT_MESSAGE_LIMIT} messaggi per sessione raggiunto.`,
      };
    }
    return { allowed: true };
  }

  if (userMessageCount > FREE_CHAT_MESSAGE_LIMIT) {
    return {
      allowed: false,
      code: "FREE_CHAT_LIMIT",
      status: 403,
      message: `Piano gratuito: massimo ${FREE_CHAT_MESSAGE_LIMIT} messaggi per sessione. Passa a un abbonamento per chat illimitata.`,
    };
  }

  return { allowed: true };
}

/** Patient chat model — always gpt-4o-mini for every plan. */
export function resolveChatModel(_profile?: UserBillingProfile): ChatModelId {
  return "gpt-4o-mini";
}

export function assertAllowedChatModel(
  _profile: UserBillingProfile,
  _requestedModel: unknown,
): GateResult {
  // Client-requested model is ignored — chat is always gpt-4o-mini (resolveChatModel).
  return { allowed: true };
}

export function gateToResponse(gate: Extract<GateResult, { allowed: false }>): Response {
  return new Response(
    JSON.stringify({
      error: gate.message,
      code: gate.code,
    }),
    {
      status: gate.status,
      headers: { "Content-Type": "application/json" },
    },
  );
}
