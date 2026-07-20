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
    <div className="flex h-screen w-full overflow-hidden bg-ui-bg text-text-primary">
      <div className="grid h-full w-full grid-cols-12 gap-4 overflow-hidden p-4">
        <aside className="col-span-2 flex h-full min-h-0 flex-col justify-between overflow-hidden">
          <DashboardSidebar
            userLabel={label}
            isAdmin={user.role === "ADMIN"}
            ssmSpecialties={ssmSpecialties}
          />
        </aside>
        <main className="col-span-10 h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
