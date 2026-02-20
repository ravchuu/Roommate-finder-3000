import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentNav } from "@/components/layout/student-nav";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "student") redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <StudentNav />
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
