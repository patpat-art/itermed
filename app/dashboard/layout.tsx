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
    <div className="min-h-screen bg-[#F8FAFC]/80 text-text-primary">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-10 px-6 py-10">
        <DashboardSidebar
          userLabel={label}
          isAdmin={user.role === "ADMIN"}
          ssmSpecialties={ssmSpecialties}
        />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-8">{children}</main>
      </div>
    </div>
  );
}
