import { DashboardSidebar } from "../../components/dashboard/DashboardSidebar";
import { fetchMedicalSpecialtyOptions } from "../../lib/dashboard-queries";
import { buildSsmSpecialtyLinks } from "../../lib/ssm-specialties";
import { requireAdmin } from "../../lib/require-user";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const label = user.name || user.email || "Admin";

  let ssmSpecialties = buildSsmSpecialtyLinks([]);
  try {
    const dbSpecialties = await fetchMedicalSpecialtyOptions();
    ssmSpecialties = buildSsmSpecialtyLinks(dbSpecialties);
  } catch {
    // Fallback to canonical SSM list without DB ids.
  }

  return (
    <div className="min-h-screen w-full bg-ui-bg text-text-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-[1800px] gap-4 px-3 py-4 md:gap-6 md:px-5 md:py-6 lg:gap-8">
        <div className="sticky top-4 flex h-[calc(100dvh-2rem)] w-72 shrink-0 flex-col self-start">
          <DashboardSidebar userLabel={label} isAdmin ssmSpecialties={ssmSpecialties} />
        </div>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-8 pb-12">{children}</main>
      </div>
    </div>
  );
}
