import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  ClipboardList,
  UserSearch,
  DoorOpen,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const student = await db.student.findUnique({
    where: { id: session.user.id },
    include: {
      surveyResponse: true,
      roomMemberships: { include: { room: { include: { members: { include: { student: true } } } } } },
    },
  });

  if (!student) redirect("/login");

  if (!student.preferredRoomSize) {
    redirect("/onboarding");
  }

  const hasSurvey = !!student.surveyResponse;
  const room = student.roomMemberships[0]?.room;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, {student.name}</h1>
        <p className="text-muted-foreground">
          Here&apos;s your roommate finding overview
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
                <Badge variant={hasSurvey ? "default" : "secondary"} className="mt-1">
                  {hasSurvey ? "Completed" : "Not Started"}
                </Badge>
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
                  {room ? `In Room (${room.members.length}/${room.roomSize})` : "Not in a room"}
                </Badge>
              </div>
              <UserSearch className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Next Steps</h2>
        {!hasSurvey && (
          <ActionCard
            title="Complete Your Lifestyle Survey"
            description="Answer questions about your habits so we can find your best matches"
            href="/survey"
            icon={<ClipboardList className="h-5 w-5" />}
          />
        )}
        <ActionCard
          title="Browse Potential Roommates"
          description="See ranked matches based on compatibility"
          href="/roommates"
          icon={<UserSearch className="h-5 w-5" />}
        />
        {!room && (
          <ActionCard
            title="Check Your Requests"
            description="View incoming and outgoing roommate requests"
            href="/requests"
            icon={<DoorOpen className="h-5 w-5" />}
          />
        )}
      </div>

      {student.bio && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Your Bio</h2>
          <p className="text-muted-foreground">{student.bio}</p>
        </div>
      )}
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
