import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";

export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
