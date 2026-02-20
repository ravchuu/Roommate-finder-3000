import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Student Dashboard</h1>
      <p className="text-muted-foreground mt-2">
        Welcome, {session.user.name}! Dashboard coming soon.
      </p>
    </div>
  );
}
