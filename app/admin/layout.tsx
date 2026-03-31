import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth-options";
import DashboardLayout from "../dashboard/layout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/knowledge");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return <DashboardLayout>{children}</DashboardLayout>;
}
