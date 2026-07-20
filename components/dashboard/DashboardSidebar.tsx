"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  ChevronDown,
  FilePlus,
  LayoutDashboard,
  Settings,
  UserCircle2,
  Database,
  Users,
  TestTubeDiagonal,
  type LucideIcon,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { AequanLogo } from "@/components/AequanLogo";
import { specialtyFilterHref, type SsmSpecialtyLink } from "@/lib/ssm-specialties";
import { cn } from "@/app/utils/cn";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefixes?: string[];
};

type DashboardSidebarProps = {
  userLabel: string;
  isAdmin: boolean;
  ssmSpecialties: SsmSpecialtyLink[];
};

const primaryNavItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  {
    href: "/dashboard/prassi",
    label: "Prassi Clinica",
    icon: Activity,
    matchPrefixes: ["/dashboard/prassi", "/dashboard/cases", "/dashboard/simulator"],
  },
  { href: "/dashboard/statistics", label: "Statistiche", icon: BarChart3 },
];

const adminNavItems: NavItem[] = [
  { href: "/admin/knowledge", label: "Guidelines", icon: Database },
  { href: "/admin/users", label: "Utenti", icon: Users },
  { href: "/admin/exams", label: "Valori esami", icon: TestTubeDiagonal },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const prefixes = item.matchPrefixes ?? [item.href];
  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : prefixes.some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
        );

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors aequan-interactive",
        isActive
          ? "bg-[#1E324E]/[0.06] text-[#1E324E]"
          : "text-slate-600 hover:bg-slate-50 hover:text-[#2A486D]",
      )}
    >
      {isActive ? (
        <span
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#1E324E]"
          aria-hidden
        />
      ) : null}
      <Icon className={cn("h-4 w-4", isActive ? "text-[#1E324E]" : "text-slate-500")} />
      <span className="font-display">{item.label}</span>
    </Link>
  );
}

export function DashboardSidebar({ userLabel, isAdmin, ssmSpecialties }: DashboardSidebarProps) {
  const [ssmOpen, setSsmOpen] = useState(true);

  return (
    <aside className="flex w-72 shrink-0 flex-col rounded-2xl border border-slate-100 bg-white shadow-sm">
      <header className="flex flex-col items-center px-6 pb-5 pt-8 text-center">
        <Link
          href="/dashboard"
          className="aequan-interactive inline-flex items-center justify-center hover:opacity-90"
        >
          <AequanLogo height={55} />
        </Link>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Medical-Legal Training Simulator
        </p>
      </header>

      <Link
        href="/dashboard/cases/create"
        className="aequan-btn-primary mx-6 mb-6 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm"
      >
        <FilePlus className="h-4 w-4" />
        Crea Caso
      </Link>

      <nav className="space-y-1 px-4 text-sm">
        {primaryNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        {isAdmin
          ? adminNavItems.map((item) => <NavLink key={item.href} item={item} />)
          : null}
      </nav>

      <div className="mt-5 border-t border-slate-100 px-4 pt-4">
        <button
          type="button"
          onClick={() => setSsmOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#2F4156] aequan-interactive"
          aria-expanded={ssmOpen}
        >
          <span>Specialità (SSM)</span>
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", ssmOpen ? "rotate-180" : "rotate-0")}
          />
        </button>
        {ssmOpen ? (
          <div className="mt-2 max-h-52 space-y-0.5 overflow-y-auto pr-1">
            {ssmSpecialties.map((specialty) => (
              <Link
                key={specialty.name}
                href={specialtyFilterHref(specialty)}
                className="block truncate rounded-lg px-3 py-1.5 text-[12px] text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#2F4156] aequan-interactive"
                title={specialty.name}
              >
                {specialty.name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-auto space-y-2 border-t border-slate-100 px-4 pb-5 pt-4 text-xs text-slate-500">
        <p className="truncate px-1 text-[11px] text-slate-400" title={userLabel}>
          {userLabel}
        </p>
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-slate-50 aequan-interactive"
          >
            <UserCircle2 className="h-4 w-4" />
            <span>Profilo</span>
          </Link>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center justify-center rounded-xl p-1.5 transition-colors hover:bg-slate-50 aequan-interactive"
            aria-label="Impostazioni"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
