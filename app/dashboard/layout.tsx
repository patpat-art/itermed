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
    <div className="flex h-screen w-full overflow-hidden overflow-x-hidden bg-slate-50 text-text-primary dark:bg-slate-950">
      <aside className="flex h-full w-64 min-w-[16rem] shrink-0 flex-col justify-between overflow-hidden border-r border-slate-200 dark:border-slate-800">
        <DashboardSidebar
          userLabel={label}
          isAdmin={user.role === "ADMIN"}
          ssmSpecialties={ssmSpecialties}
        />
      </aside>
      <main className="h-full min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
        {children}
      </main>
    </div>
  );
}
