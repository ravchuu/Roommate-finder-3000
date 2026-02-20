import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Users, UserCheck, DoorOpen, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const orgId = session.user.organizationId;

  const [totalStudents, claimedStudents, roomConfigs, org, totalRooms] =
    await Promise.all([
      db.student.count({ where: { organizationId: orgId } }),
      db.student.count({ where: { organizationId: orgId, claimed: true } }),
      db.roomConfig.findMany({ where: { organizationId: orgId } }),
      db.organization.findUnique({ where: { id: orgId } }),
      db.room.count({ where: { organizationId: orgId } }),
    ]);

  const totalCapacity = roomConfigs.reduce(
    (sum, rc) => sum + rc.roomSize * rc.totalRooms,
    0
  );

  const deadline = org?.deadline;
  const daysUntilDeadline = deadline
    ? Math.ceil(
        (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Overview of {org?.name || "your organization"}
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Students"
          value={totalStudents}
        />
        <StatCard
          icon={<UserCheck className="h-5 w-5" />}
          label="Claimed Profiles"
          value={`${claimedStudents} / ${totalStudents}`}
        />
        <StatCard
          icon={<DoorOpen className="h-5 w-5" />}
          label="Total Capacity"
          value={`${totalCapacity} beds`}
          subtitle={`${roomConfigs.length} configs, ${totalRooms} rooms formed`}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Deadline"
          value={
            daysUntilDeadline !== null ? `${daysUntilDeadline} days` : "Not set"
          }
          subtitle={
            deadline
              ? new Date(deadline).toLocaleDateString()
              : "Configure in settings"
          }
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Room Configurations</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {roomConfigs.map((rc) => (
            <Card key={rc.id}>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {rc.roomSize}-person rooms
                </div>
                <p className="text-muted-foreground">
                  {rc.totalRooms} rooms available ({rc.roomSize * rc.totalRooms}{" "}
                  beds)
                </p>
              </CardContent>
            </Card>
          ))}
          {roomConfigs.length === 0 && (
            <p className="text-muted-foreground col-span-3">
              No room configurations yet. Go to Room Config to set them up.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
