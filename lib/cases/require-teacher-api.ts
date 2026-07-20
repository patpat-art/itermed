import { isDevAuthBypass } from "@/lib/require-user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

const TEACHER_ROLES = new Set(["INSTRUCTOR", "ADMIN"]);

/** Any authenticated user (or dev bypass). Used for case create / AI generation. */
export async function requireAuthApi(): Promise<Response | null> {
  if (isDevAuthBypass()) return null;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null;
}

/** Authenticated session only (role-agnostic). Alias kept for existing imports. */
export async function requireTeacherApi(): Promise<Response | null> {
  return requireAuthApi();
}

export function isTeacherRole(role: string): boolean {
  return TEACHER_ROLES.has(role);
}

