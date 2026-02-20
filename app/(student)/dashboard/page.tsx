import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ClipboardList, ArrowRight, Sparkles } from "lucide-react";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { FadeIn } from "@/components/motion/animated-section";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const student = await db.student.findUnique({
    where: { id: session.user.id },
    include: {
      surveyResponse: true,
      matchWeights: true,
      groupMemberships: {
        include: {
          group: {
            include: { members: true },
          },
        },
      },
    },
  });

  if (!student) redirect("/login");

  if (!student.onboardingComplete) {
    redirect("/onboarding");
  }

  const hasSurvey = !!student.surveyResponse;
  const group = student.groupMemberships[0]?.group;
  const preferredRoomSizes = student.preferredRoomSizes
    ? (JSON.parse(student.preferredRoomSizes) as number[])
    : [];
  const roomStatusLabel = group
    ? `In Group (${group.members.length}${group.targetRoomSize ? `/${group.targetRoomSize}` : ""}) — ${group.status}`
    : "Not in a group yet";

  const profileData = {
    id: student.id,
    name: student.name,
    email: student.email,
    age: student.age,
    gender: student.gender,
    bio: student.bio,
    photo: student.photo,
    preferredRoomSizes: student.preferredRoomSizes
      ? JSON.parse(student.preferredRoomSizes)
      : [],
    bigFiveScores: student.bigFiveScores
      ? (JSON.parse(student.bigFiveScores) as { O: number; C: number; E: number; A: number; N: number })
      : null,
    surveyAnswers: student.surveyResponse
      ? JSON.parse(student.surveyResponse.answers)
      : null,
    matchWeights: student.matchWeights.reduce(
      (acc, w) => ({ ...acc, [w.traitKey]: w.weight }),
      {} as Record<string, number>
    ),
  };

  return (
    <div>
      <FadeIn>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-2xl bg-pastel-teal flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Hey, {student.name.split(" ")[0]}!
              </h1>
              <p className="text-muted-foreground">
                Here&apos;s what&apos;s happening with your roommate search
              </p>
            </div>
          </div>
        </div>
      </FadeIn>

      <DashboardCards
        preferredRoomSizes={preferredRoomSizes}
        hasSurvey={hasSurvey}
        roomStatusLabel={roomStatusLabel}
      />

      {!hasSurvey && (
        <FadeIn delay={0.3}>
          <Link href="/survey" className="block mb-8">
            <div className="rounded-2xl bg-gradient-to-r from-pastel-peach/40 to-pastel-amber/40 border border-pastel-peach/50 p-6 flex items-center justify-between hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/60 flex items-center justify-center">
                  <ClipboardList className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    Complete Your Lifestyle Survey
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Answer a few questions so we can find your best roommate
                    matches
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </FadeIn>
      )}

      <FadeIn delay={0.35}>
        <ProfileEditor profile={profileData} />
      </FadeIn>
    </div>
  );
}
