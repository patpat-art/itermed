"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  BookOpen,
  ChevronDown,
  FilePlus,
  LayoutDashboard,
  Settings,
  Trophy,
  Users,
  TestTubeDiagonal,
  type LucideIcon,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { initialsFromLabel } from "@/lib/avatar-initials";
import { specialtyFilterHref, type SsmSpecialtyLink } from "@/lib/ssm-specialties";
import { cn } from "@/app/utils/cn";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefixes?: string[];
  /** Paths that must NOT activate this item (e.g. case creation under /cases). */
  excludePathPrefixes?: string[];
};

type DashboardSidebarProps = {
  userLabel: string;
  isAdmin: boolean;
  ssmSpecialties?: SsmSpecialtyLink[];
};

const CREATE_CASE_HREF = "/dashboard/cases/create";

/** Case-creation routes — highlight Crea Caso, not Prassi Clinica. */
function isCaseCreationPath(pathname: string): boolean {
  return (
    pathname === CREATE_CASE_HREF ||
    pathname.startsWith(`${CREATE_CASE_HREF}/`) ||
    pathname === "/dashboard/cases/new" ||
    pathname.startsWith("/dashboard/cases/new/") ||
    pathname === "/dashboard/prassi/create" ||
    pathname.startsWith("/dashboard/prassi/create/")
  );
}

const primaryNavItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  {
    href: "/dashboard/prassi",
    label: "Prassi Clinica",
    icon: Activity,
    matchPrefixes: ["/dashboard/prassi", "/dashboard/cases", "/dashboard/simulator"],
    excludePathPrefixes: [
      "/dashboard/cases/create",
      "/dashboard/cases/new",
      "/dashboard/prassi/create",
    ],
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: Trophy,
    matchPrefixes: ["/dashboard/analytics", "/dashboard/classifiche", "/dashboard/statistics"],
  },
  {
    href: "/dashboard/guidelines",
    label: "Linee Guida",
    icon: BookOpen,
    matchPrefixes: ["/dashboard/guidelines", "/admin/knowledge"],
  },
];

const adminNavItems: NavItem[] = [
  { href: "/admin/users", label: "Utenti", icon: Users },
  { href: "/admin/exams", label: "Valori esami", icon: TestTubeDiagonal },
];

function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/dashboard") {
    return pathname === "/dashboard";
  }

  const excluded = item.excludePathPrefixes?.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (excluded || (item.href === "/dashboard/prassi" && isCaseCreationPath(pathname))) {
    return false;
  }

  const prefixes = item.matchPrefixes ?? [item.href];
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = isNavItemActive(item, pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive ? "bg-[#1E324E] text-white" : "text-slate-600 hover:bg-slate-100",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-white" : "text-slate-400")} />
      <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  );
}

export function DashboardSidebar({ userLabel, isAdmin, ssmSpecialties = [] }: DashboardSidebarProps) {
  const pathname = usePathname();
  const isCreateActive = isCaseCreationPath(pathname);
  const [ssmOpen, setSsmOpen] = useState(false);

  return (
    <aside className="flex h-full w-full min-w-0 flex-col justify-between overflow-hidden bg-white">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="px-3 pb-4 pt-6">
          <Link
            href={CREATE_CASE_HREF}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold shadow-sm transition-colors",
              isCreateActive
                ? "bg-[#1E324E] text-white"
                : "bg-[#1E324E] text-white hover:bg-[#2A486D]",
            )}
            aria-current={isCreateActive ? "page" : undefined}
          >
            <FilePlus className="h-4 w-4 shrink-0" />
            <span>Crea Caso</span>
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-2">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Menu
          </p>
          <nav className="space-y-1" aria-label="Navigazione principale">
            {primaryNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          {isAdmin ? (
            <>
              <p className="mt-5 px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Admin
              </p>
              <nav className="space-y-1" aria-label="Navigazione amministratore">
                {adminNavItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </nav>
            </>
          ) : null}

          {ssmSpecialties.length > 0 ? (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setSsmOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-expanded={ssmOpen}
              >
                <span className="truncate">Reparti (SSM)</span>
                <ChevronDown
                  className={cn("h-3.5 w-3.5 shrink-0 transition-transform", ssmOpen ? "rotate-180" : "rotate-0")}
                />
              </button>
              {ssmOpen ? (
                <nav className="mt-1 space-y-0.5" aria-label="Reparti SSM">
                  {ssmSpecialties.map((specialty) => (
                    <Link
                      key={specialty.name}
                      href={specialtyFilterHref(specialty)}
                      className="block truncate rounded-lg px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
                      title={specialty.name}
                    >
                      {specialty.name}
                    </Link>
                  ))}
                </nav>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-100 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
            {initialsFromLabel(userLabel)}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800" title={userLabel}>
              {userLabel}
            </p>
            <Link href="/dashboard/profile" className="text-xs text-slate-400 hover:text-slate-600">
              Profilo
            </Link>
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Impostazioni"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-1 flex items-center justify-between px-2">
          <nav className="flex gap-x-3 text-xs text-slate-400" aria-label="Documenti legali">
            <Link href="/terms" className="hover:text-slate-600 hover:underline">
              Termini
            </Link>
            <Link href="/privacy" className="hover:text-slate-600 hover:underline">
              Privacy
            </Link>
          </nav>
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
