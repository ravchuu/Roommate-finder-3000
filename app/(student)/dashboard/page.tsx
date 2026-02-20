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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, {student.name}</h1>
        <p className="text-muted-foreground">
          Manage your profile and find roommates
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Room Preference</p>
                <p className="text-2xl font-bold mt-1">
                  {student.preferredRoomSize}-person
                </p>
              </div>
              <DoorOpen className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Survey</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={hasSurvey ? "default" : "secondary"}>
                    {hasSurvey ? "Completed" : "Not Started"}
                  </Badge>
                  <Link href="/survey" className="text-primary hover:underline">
                    <Pencil className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Room Status</p>
                <Badge
                  variant={room ? "default" : "secondary"}
                  className="mt-1"
                >
                  {room
                    ? `In Room (${room.members.length}/${room.roomSize})`
                    : "Not in a room"}
                </Badge>
              </div>
              <UserSearch className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!hasSurvey && (
        <div className="mb-8">
          <ActionCard
            title="Complete Your Lifestyle Survey"
            description="Answer questions about your habits so we can find your best matches"
            href="/survey"
            icon={<ClipboardList className="h-5 w-5" />}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <ProfileEditor profile={profileData} />
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Quick Links</h2>
          <ActionCard
            title="Browse Potential Roommates"
            description="See ranked matches based on compatibility"
            href="/roommates"
            icon={<UserSearch className="h-5 w-5" />}
          />
          <ActionCard
            title="Check Your Requests"
            description="View incoming and outgoing roommate requests"
            href="/requests"
            icon={<DoorOpen className="h-5 w-5" />}
          />
          {room && (
            <ActionCard
              title="View Your Room"
              description={`Room with ${room.members.length} members`}
              href="/room"
              icon={<DoorOpen className="h-5 w-5" />}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              {icon}
            </div>
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
