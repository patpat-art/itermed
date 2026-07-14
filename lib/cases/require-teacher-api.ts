import { isDevAuthBypass } from "@/lib/require-user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

const TEACHER_ROLES = new Set(["INSTRUCTOR", "ADMIN"]);

export async function requireTeacherApi(): Promise<Response | null> {
  if (isDevAuthBypass()) return null;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const role = session.user.role ?? "STUDENT";
  if (!TEACHER_ROLES.has(role)) {
    return new Response(
      JSON.stringify({
        error: "Solo docenti (INSTRUCTOR) o amministratori possono creare casi avanzati.",
        code: "TEACHER_REQUIRED",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  return null;
}

export function isTeacherRole(role: string): boolean {
  return TEACHER_ROLES.has(role);
}

