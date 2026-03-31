import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth-options";
import { LayoutDashboard, Database, Users, Settings, UserCircle2 } from "lucide-react";
import { SignOutButton } from "../../components/auth/SignOutButton";

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

  const label = session.user.name || session.user.email || "Admin";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="flex min-h-screen max-w-7xl mx-auto px-6 py-10 gap-10">
        <aside className="flex flex-col w-72 rounded-3xl bg-white/80 border border-zinc-200/80 backdrop-blur-xl p-5 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 text-zinc-50 text-xl font-semibold">
              IM
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">IterMed</span>
              <span className="text-xs text-zinc-500">Admin console</span>
            </div>
          </div>

          <nav className="flex-1 space-y-1 text-sm">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-zinc-600" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/admin/knowledge"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
            >
              <Database className="h-4 w-4 text-zinc-600" />
              <span>Guidelines</span>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
            >
              <Users className="h-4 w-4 text-zinc-600" />
              <span>Utenti</span>
            </Link>
          </nav>

          <div className="mt-6 border-t border-zinc-200/80 pt-4 space-y-2 text-xs text-zinc-600">
            <p className="truncate px-1 text-[11px] text-zinc-500" title={label}>
              {label}
            </p>
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-zinc-100 transition-colors"
              >
                <UserCircle2 className="h-4 w-4" />
                <span>Profilo</span>
              </Link>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center justify-center rounded-xl p-1.5 hover:bg-zinc-100 transition-colors"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
            <SignOutButton />
          </div>
        </aside>

        <main className="flex-1 flex flex-col gap-8 min-h-0">{children}</main>
      </div>
    </div>
  );
}
