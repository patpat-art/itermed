import { SANDBOX_TEST_USER_ID } from "@/lib/require-user";
import type { Prisma } from "@prisma/client";

/** Legacy sandbox ids whose completed reports belong to the same tester session. */
const LEGACY_SANDBOX_USER_IDS = ["guest_test_user_id", "mock-dev-user-id"] as const;

/**
 * Resolves Prisma user filter for analytics — merges legacy guest ids with cl-tester-999
 * so statistics stay continuous after sandbox account migrations.
 */
export function sessionReportUserWhere(userId: string): Prisma.SessionReportWhereInput {
  if (userId === SANDBOX_TEST_USER_ID) {
    return {
      userId: { in: [SANDBOX_TEST_USER_ID, ...LEGACY_SANDBOX_USER_IDS] },
    };
  }
  return { userId };
}

export function statisticsUserIds(userId: string): string[] {
  if (userId === SANDBOX_TEST_USER_ID) {
    return [SANDBOX_TEST_USER_ID, ...LEGACY_SANDBOX_USER_IDS];
  }
  return [userId];
}
