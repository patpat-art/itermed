import type { ReactNode } from "react";
import Link from "next/link";
import { AequanLogo } from "@/components/AequanLogo";

type LegalPageShellProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

/** Shared responsive shell for /terms and /privacy. */
export function LegalPageShell({ title, lastUpdated, children }: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href="/" className="inline-flex items-center hover:opacity-90">
            <AequanLogo height={36} />
          </Link>
          <Link
            href="/signup"
            className="text-xs font-medium text-slate-600 underline-offset-2 hover:text-[#1E324E] hover:underline"
          >
            Registrati
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Documento legale
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[#2F4156] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">Ultimo aggiornamento: {lastUpdated}</p>

        <article className="prose-legal mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
          {children}
        </article>
      </main>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-[#1E324E]">{title}</h2>
      <div className="space-y-2 text-slate-600">{children}</div>
    </section>
  );
}
