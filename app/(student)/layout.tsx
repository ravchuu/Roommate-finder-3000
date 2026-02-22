import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { DeadlineBanner } from "@/components/layout/deadline-banner";
import { SurveyGate } from "@/components/survey-gate";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "student") redirect("/login");

  return (
    <SurveyGate>
      <div className="h-screen flex overflow-hidden bg-background">
        <StudentSidebar />
        <main className="flex-1 overflow-y-auto bg-white lg:rounded-l-3xl">
          <DeadlineBanner />
          <div className="p-6 lg:p-8 pt-20 lg:pt-8">{children}</div>
        </main>
      </div>
    </SurveyGate>
  );
}
