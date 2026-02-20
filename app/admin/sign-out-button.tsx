"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground w-full"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </button>
  );
}
