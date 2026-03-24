import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth-options";

export type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
};

export async function requireUser(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) redirect("/login");
  return {
    id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
    role: session.user.role ?? "STUDENT",
  };
}
