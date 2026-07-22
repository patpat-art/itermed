"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AequanLogo } from "@/components/AequanLogo";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import type { SsmSpecialtyLink } from "@/lib/ssm-specialties";

type DashboardChromeProps = {
  userLabel: string;
  isAdmin: boolean;
  ssmSpecialties?: SsmSpecialtyLink[];
  children: ReactNode;
};

export function DashboardChrome({ userLabel, isAdmin, ssmSpecialties = [], children }: DashboardChromeProps) {
  const pathname = usePathname() ?? "";
  const isImmersivePlay = /\/dashboard\/prassi\/play\//.test(pathname);
  const hideTopBarSearch = pathname.startsWith("/dashboard/prassi");

  if (isImmersivePlay) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-[#F4F6F8] text-text-primary">
        <main className="h-full min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#F4F6F8] p-0">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#F4F6F8] text-text-primary">
      <aside className="flex h-full w-60 min-w-[15rem] shrink-0 flex-col border-r border-slate-200 bg-white">
        <DashboardSidebar userLabel={userLabel} isAdmin={isAdmin} ssmSpecialties={ssmSpecialties} />
      </aside>
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar userLabel={userLabel} showSearch={!hideTopBarSearch} />
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#F4F6F8]">
          {children}
        </main>
      </div>

      {/* Logo centered relative to the full page width, independent of the sidebar.
          When the search bar is visible, nudge the logo a bit further from the left
          so it doesn't sit right next to the search input. */}
      <Link
        href="/dashboard"
        aria-label="Vai alla dashboard"
        className="pointer-events-auto absolute left-1/2 top-0 z-20 flex h-16 items-center"
        style={{ transform: `translateX(calc(-50% + ${hideTopBarSearch ? 0 : 28}px))` }}
      >
        <AequanLogo height={28} />
      </Link>
    </div>
  );
}
