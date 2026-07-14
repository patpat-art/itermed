import { isDevAuthBypass } from "./require-user";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";

export async function requireAdminApi(): Promise<Response | null> {
  if (isDevAuthBypass()) {
    return null;
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}
