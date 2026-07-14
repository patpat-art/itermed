import type { ReactNode } from "react";
import { DashboardSidebar } from "../../components/dashboard/DashboardSidebar";
import { fetchMedicalSpecialtyOptions } from "../../lib/dashboard-queries";
import { buildSsmSpecialtyLinks } from "../../lib/ssm-specialties";
import { requireUser } from "../../lib/require-user";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await requireUser();
  const label = user.name || user.email || "Account";

  let ssmSpecialties = buildSsmSpecialtyLinks([]);
  try {
    const dbSpecialties = await fetchMedicalSpecialtyOptions();
    ssmSpecialties = buildSsmSpecialtyLinks(dbSpecialties);
  } catch {
    // Fallback to canonical SSM list without DB ids.
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="flex min-h-screen max-w-7xl mx-auto px-6 py-10 gap-10">
        <DashboardSidebar
          userLabel={label}
          isAdmin={user.role === "ADMIN"}
          ssmSpecialties={ssmSpecialties}
        />
        <main className="flex-1 flex flex-col gap-8 min-h-0">{children}</main>
      </div>
    </div>
  );
}
