"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  FilePlus,
  LayoutDashboard,
  Settings,
  Sparkles,
  UserCircle2,
  Database,
  Users,
  TestTubeDiagonal,
  type LucideIcon,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { specialtyFilterHref, type SsmSpecialtyLink } from "@/lib/ssm-specialties";
import { cn } from "@/app/utils/cn";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type DashboardSidebarProps = {
  userLabel: string;
  isAdmin: boolean;
  ssmSpecialties: SsmSpecialtyLink[];
};

const primaryNavItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/cases", label: "Casi clinici", icon: BookOpen },
  { href: "/dashboard/simulator", label: "Simulatore", icon: Sparkles },
  { href: "/dashboard/statistics", label: "Statistiche", icon: BarChart3 },
];

const adminNavItems: NavItem[] = [
  { href: "/admin/knowledge", label: "Guidelines", icon: Database },
  { href: "/admin/users", label: "Utenti", icon: Users },
  { href: "/admin/exams", label: "Valori esami", icon: TestTubeDiagonal },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-xl transition-colors",
        isActive
          ? "bg-zinc-950 text-zinc-50"
          : "text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100",
      )}
    >
      <Icon className={cn("h-4 w-4", isActive ? "text-zinc-200" : "text-zinc-600")} />
      <span>{item.label}</span>
    </Link>
  );
}

export function DashboardSidebar({ userLabel, isAdmin, ssmSpecialties }: DashboardSidebarProps) {
  const [ssmOpen, setSsmOpen] = useState(true);

  return (
    <aside className="flex flex-col w-72 rounded-3xl bg-white/80 border border-zinc-200/80 backdrop-blur-xl p-5 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 text-zinc-50 text-xl font-semibold">
          IM
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight">IterMed</span>
          <span className="text-xs text-zinc-500">Diagnostic & medico-legal lab</span>
        </div>
      </div>

      <Link
        href="/dashboard/cases/create"
        className="mb-5 flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-zinc-50 shadow-sm hover:bg-zinc-900 transition-colors"
      >
        <FilePlus className="h-4 w-4" />
        Crea Caso
      </Link>

      <nav className="space-y-1 text-sm">
        {primaryNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        {isAdmin
          ? adminNavItems.map((item) => <NavLink key={item.href} item={item} />)
          : null}
      </nav>

      <div className="mt-5 border-t border-zinc-200/80 pt-4">
        <button
          type="button"
          onClick={() => setSsmOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
          aria-expanded={ssmOpen}
        >
          <span>Specialità (SSM)</span>
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", ssmOpen ? "rotate-180" : "rotate-0")}
          />
        </button>
        {ssmOpen ? (
          <div className="mt-2 max-h-52 overflow-y-auto space-y-0.5 pr-1">
            {ssmSpecialties.map((specialty) => (
                <Link
                  key={specialty.name}
                  href={specialtyFilterHref(specialty)}
                  className="block rounded-lg px-3 py-1.5 text-[12px] text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition-colors truncate"
                  title={specialty.name}
                >
                  {specialty.name}
                </Link>
              ))}
          </div>
        ) : null}
      </div>

      <div className="mt-auto border-t border-zinc-200/80 pt-4 space-y-2 text-xs text-zinc-600">
        <p className="truncate px-1 text-[11px] text-zinc-500" title={userLabel}>
          {userLabel}
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
