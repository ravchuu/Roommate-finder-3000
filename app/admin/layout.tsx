import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, Users, Home, Settings, DoorOpen, Leaf } from "lucide-react";
import { SignOutButton } from "./sign-out-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/admin/login");

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gradient-to-b from-pastel-teal/30 to-pastel-mint/20 border-r flex flex-col">
        <div className="p-6 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-sm">RF3000</span>
              <span className="text-[10px] font-medium text-muted-foreground ml-1.5 bg-pastel-teal px-1.5 py-0.5 rounded-full">
                Admin
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 truncate">
            {session.user.name}
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink href="/admin/dashboard" icon={<Home className="h-4 w-4" />}>
            Dashboard
          </NavLink>
          <NavLink href="/admin/students" icon={<Users className="h-4 w-4" />}>
            Students
          </NavLink>
          <NavLink href="/admin/rooms" icon={<DoorOpen className="h-4 w-4" />}>
            Room Config
          </NavLink>
          <NavLink
            href="/admin/settings"
            icon={<Settings className="h-4 w-4" />}
          >
            Settings
          </NavLink>
        </nav>
        <div className="p-3 border-t border-border/60">
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 bg-background">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-white/60 transition-colors text-muted-foreground hover:text-foreground"
    >
      {icon}
      {children}
    </Link>
  );
}
