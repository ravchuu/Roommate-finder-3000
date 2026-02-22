import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ClipboardList, ArrowRight, Sparkles, UserSearch } from "lucide-react";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { FadeIn } from "@/components/motion/animated-section";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    const parsed = JSON.parse(raw as string);
    return parsed as T;
  } catch {
    return fallback;
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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
  const preferredRoomSizes = safeJsonParse<number[]>(student.preferredRoomSizes, []);
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
    preferredRoomSizes: Array.isArray(preferredRoomSizes) ? preferredRoomSizes : [],
    bigFiveScores: safeJsonParse<{ O: number; C: number; E: number; A: number; N: number } | null>(
      student.bigFiveScores,
      null
    ),
    surveyAnswers: student.surveyResponse
      ? safeJsonParse<Record<string, string | number> | null>(
          student.surveyResponse.answers,
          null
        )
      : null,
    matchWeights: Array.isArray(student.matchWeights)
      ? student.matchWeights.reduce(
          (acc, w) => ({ ...acc, [w.traitKey]: w.weight }),
          {} as Record<string, number>
        )
      : {},
  };

  return (
    <div>
      <FadeIn>
        <div className="mb-6">
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

      <FadeIn delay={0.05}>
        <Link
          href="/roommates"
          className="block mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
        >
          <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground p-6 shadow-lg hover:shadow-xl transition-all group border-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <UserSearch className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xl">Find a roommate</p>
                  <p className="text-primary-foreground/90 text-sm mt-0.5">
                    Browse compatible matches and send requests
                  </p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 shrink-0 opacity-90 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
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
