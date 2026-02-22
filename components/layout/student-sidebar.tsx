"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  UserSearch,
  Mail,
  MessageCircle,
  DoorOpen,
  LogOut,
  ClipboardList,
  Leaf,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/survey", label: "Lifestyle Survey", icon: ClipboardList },
  { href: "/roommates", label: "Find Roommates", icon: UserSearch },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/requests", label: "Requests", icon: Mail },
  { href: "/room", label: "My Group", icon: DoorOpen },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-gradient-to-r from-pastel-teal/50 to-pastel-mint/40 border-b border-pastel-teal/20 backdrop-blur-md flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="h-9 w-9 rounded-xl bg-white/50 flex items-center justify-center hover:bg-white/70 transition-colors"
        >
          <Menu className="h-5 w-5 text-primary" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <Leaf className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">RF3000</span>
        </Link>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-50 w-64 shrink-0 bg-gradient-to-b from-pastel-teal/40 via-pastel-teal/25 to-pastel-mint/20 flex flex-col transition-transform duration-300 ease-in-out overflow-hidden",
          "lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo section */}
        <div className="px-5 pt-6 pb-5 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5"
            onClick={() => setOpen(false)}
          >
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Leaf className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight">Roommate Finder</span>
              <span className="text-[10px] text-muted-foreground leading-tight">3000</span>
            </div>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden h-8 w-8 rounded-lg hover:bg-white/50 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Soft divider */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-pastel-teal/50 to-transparent" />

        {/* Navigation section */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Menu
          </p>
          {links.map((link, i) => {
            const active = pathname === link.href;
            return (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all",
                    active
                      ? "bg-white/70 text-primary font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/40 hover:translate-x-0.5"
                  )}
                >
                  <link.icon className={cn("h-4 w-4 transition-transform", active && "scale-110")} />
                  {link.label}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Soft divider */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-pastel-teal/50 to-transparent" />

        {/* Sign out — pinned to bottom */}
        <div className="px-3 py-4">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/40 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
