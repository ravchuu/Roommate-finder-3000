"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  UserSearch,
  Mail,
  DoorOpen,
  LogOut,
  ClipboardList,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/survey", label: "Survey", icon: ClipboardList },
  { href: "/roommates", label: "Find Roommates", icon: UserSearch },
  { href: "/requests", label: "Requests", icon: Mail },
  { href: "/room", label: "My Room", icon: DoorOpen },
];

export function StudentNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border/60 bg-background/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold hidden sm:inline">RF3000</span>
          </Link>
          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl transition-colors",
                  pathname === link.href
                    ? "bg-pastel-teal/60 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-pastel-teal/30"
                )}
              >
                <link.icon className="h-4 w-4" />
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl text-muted-foreground hover:text-foreground hover:bg-pastel-rose/40 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
