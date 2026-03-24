"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 transition-colors"
    >
      <LogOut className="h-3.5 w-3.5" />
      Esci
    </button>
  );
}
