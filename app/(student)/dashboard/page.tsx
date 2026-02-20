import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  ClipboardList,
  UserSearch,
  DoorOpen,
  ArrowRight,
  Pencil,
  Sparkles,
  Users,
  Mail,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileEditor } from "@/components/profile/profile-editor";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const student = await db.student.findUnique({
    where: { id: session.user.id },
    include: {
      surveyResponse: true,
      matchWeights: true,
      roomMemberships: {
        include: {
          room: {
            include: { members: { include: { student: true } } },
          },
        },
      },
    },
  });

  if (!student) redirect("/login");

  if (!student.preferredRoomSize) {
    redirect("/onboarding");
  }

  const hasSurvey = !!student.surveyResponse;
  const room = student.roomMemberships[0]?.room;

  const profileData = {
    id: student.id,
    name: student.name,
    email: student.email,
    age: student.age,
    gender: student.gender,
    bio: student.bio,
    photo: student.photo,
    preferredRoomSize: student.preferredRoomSize,
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
      <div className="mb-10">
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

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <div className="rounded-2xl bg-pastel-teal/50 border border-pastel-teal p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-pastel-teal/40 rounded-full -translate-y-6 translate-x-6" />
          <DoorOpen className="h-5 w-5 text-primary mb-3 relative z-10" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Room Preference
          </p>
          <p className="text-2xl font-bold mt-1">
            {student.preferredRoomSize}-person
          </p>
        </div>

        <div className="rounded-2xl bg-pastel-lavender/50 border border-pastel-lavender p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-pastel-lavender/40 rounded-full -translate-y-6 translate-x-6" />
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
            <Link
              href="/survey"
              className="text-primary hover:underline"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-pastel-green/50 border border-pastel-green p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-pastel-green/40 rounded-full -translate-y-6 translate-x-6" />
          <Users className="h-5 w-5 text-primary mb-3 relative z-10" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Room Status
          </p>
          <Badge
            variant={room ? "default" : "secondary"}
            className="mt-1 rounded-full"
          >
            {room
              ? `In Room (${room.members.length}/${room.roomSize})`
              : "Not in a room yet"}
          </Badge>
        </div>
      </div>

      {!hasSurvey && (
        <Link href="/survey" className="block mb-8">
          <div className="rounded-2xl bg-gradient-to-r from-pastel-peach/60 to-pastel-amber/60 border border-pastel-peach p-6 flex items-center justify-between hover:shadow-lg transition-all group">
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
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <ProfileEditor profile={profileData} />

        <div className="space-y-3">
          <h2 className="text-lg font-semibold mb-1">Quick Actions</h2>
          <QuickActionCard
            title="Browse Potential Roommates"
            description="See ranked matches based on your compatibility"
            href="/roommates"
            icon={<UserSearch className="h-5 w-5" />}
            color="bg-pastel-sky/50 border-pastel-sky"
          />
          <QuickActionCard
            title="Check Your Requests"
            description="View incoming and outgoing roommate requests"
            href="/requests"
            icon={<Mail className="h-5 w-5" />}
            color="bg-pastel-rose/50 border-pastel-rose"
          />
          {room && (
            <QuickActionCard
              title="View Your Room"
              description={`Room with ${room.members.length} member${room.members.length === 1 ? "" : "s"}`}
              href="/room"
              icon={<DoorOpen className="h-5 w-5" />}
              color="bg-pastel-mint/50 border-pastel-mint"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
  color,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Link href={href}>
      <div
        className={`rounded-2xl border p-5 flex items-center justify-between hover:shadow-md transition-all cursor-pointer group ${color}`}
      >
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-white/60 flex items-center justify-center text-primary">
            {icon}
          </div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
