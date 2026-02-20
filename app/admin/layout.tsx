import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, Users, Home, Settings, LogOut, DoorOpen } from "lucide-react";
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
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold">Admin Panel</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {session.user.name}
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
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
        <div className="p-4 border-t">
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
      className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
    >
      {icon}
      {children}
    </Link>
  );
}
