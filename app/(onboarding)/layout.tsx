import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "student") redirect("/login");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="absolute top-4 right-4 z-10">
        <SignOutButton />
      </div>
      <div className="flex-1 flex flex-col justify-center p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}
