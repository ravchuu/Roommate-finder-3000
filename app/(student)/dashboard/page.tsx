import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  ClipboardList,
  DoorOpen,
  ArrowRight,
  Pencil,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { FadeIn, StaggerParent, StaggerChild } from "@/components/motion/animated-section";

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

      <StaggerParent className="grid sm:grid-cols-3 gap-4 mb-8">
        <StaggerChild>
          <div className="rounded-2xl bg-pastel-teal/30 border border-pastel-teal/50 p-5 relative overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-pastel-teal/20 rounded-full -translate-y-6 translate-x-6" />
            <DoorOpen className="h-5 w-5 text-primary mb-3 relative z-10" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Room Preferences
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(student.preferredRoomSizes
                ? JSON.parse(student.preferredRoomSizes) as number[]
                : []
              ).map((size: number) => (
                <span key={size} className="text-sm font-bold bg-white/60 rounded-full px-2.5 py-0.5">
                  {size}-person
                </span>
              ))}
            </div>
          </div>
        </StaggerChild>

        <StaggerChild>
          <div className="rounded-2xl bg-pastel-mint/30 border border-pastel-mint/50 p-5 relative overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-pastel-mint/20 rounded-full -translate-y-6 translate-x-6" />
            <ClipboardList className="h-5 w-5 text-primary mb-3 relative z-10" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Lifestyle Survey
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={hasSurvey ? "default" : "secondary"}
                className="rounded-full"
              >
                {hasSurvey ? "Completed" : "Not Started"}
              </Badge>
              <Link href="/survey" className="text-primary hover:underline">
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </StaggerChild>

        <StaggerChild>
          <div className="rounded-2xl bg-pastel-green/30 border border-pastel-green/50 p-5 relative overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-pastel-green/20 rounded-full -translate-y-6 translate-x-6" />
            <Users className="h-5 w-5 text-primary mb-3 relative z-10" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Room Status
            </p>
            <Badge
              variant={group ? "default" : "secondary"}
              className="mt-1 rounded-full"
            >
              {group
                ? `In Group (${group.members.length}${group.targetRoomSize ? `/${group.targetRoomSize}` : ""}) — ${group.status}`
                : "Not in a group yet"}
            </Badge>
          </div>
        </StaggerChild>
      </StaggerParent>

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
