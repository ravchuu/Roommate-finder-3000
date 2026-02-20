import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  Users,
  UserCheck,
  DoorOpen,
  Clock,
  Lock,
  LayoutDashboard,
  BedDouble,
} from "lucide-react";
import { FinalizeButton } from "./finalize-button";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const orgId = session.user.organizationId;

  const [
    totalStudents,
    claimedStudents,
    roomConfigs,
    org,
    totalRooms,
    lockedRooms,
    studentsInRooms,
    unassignedStudents,
  ] = await Promise.all([
    db.student.count({ where: { organizationId: orgId } }),
    db.student.count({ where: { organizationId: orgId, claimed: true } }),
    db.roomConfig.findMany({ where: { organizationId: orgId } }),
    db.organization.findUnique({ where: { id: orgId } }),
    db.room.count({ where: { organizationId: orgId } }),
    db.room.count({ where: { organizationId: orgId, status: "locked" } }),
    db.roomMember.count({
      where: { room: { organizationId: orgId } },
    }),
    db.student.count({
      where: {
        organizationId: orgId,
        claimed: true,
        roomMemberships: { none: {} },
      },
    }),
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

  const allLocked = totalRooms > 0 && lockedRooms === totalRooms;

  const claimPercent =
    totalStudents > 0 ? Math.round((claimedStudents / totalStudents) * 100) : 0;

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-2xl bg-pastel-teal flex items-center justify-center">
          <LayoutDashboard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {org?.name || "Your organization"} overview
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Students"
          value={totalStudents}
          subtitle={`${studentsInRooms} in rooms, ${unassignedStudents} unassigned`}
          color="bg-pastel-teal/50 border-pastel-teal"
          iconBg="bg-pastel-teal"
        />
        <StatCard
          icon={<UserCheck className="h-5 w-5" />}
          label="Claimed Profiles"
          value={`${claimedStudents} / ${totalStudents}`}
          subtitle={`${claimPercent}% claimed`}
          color="bg-pastel-lavender/50 border-pastel-lavender"
          iconBg="bg-pastel-lavender"
        />
        <StatCard
          icon={<BedDouble className="h-5 w-5" />}
          label="Total Capacity"
          value={`${totalCapacity} beds`}
          subtitle={`${roomConfigs.length} configs, ${totalRooms} rooms formed`}
          color="bg-pastel-green/50 border-pastel-green"
          iconBg="bg-pastel-green"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Deadline"
          value={
            daysUntilDeadline !== null
              ? `${daysUntilDeadline} days`
              : "Not set"
          }
          subtitle={
            deadline
              ? new Date(deadline).toLocaleDateString()
              : "Configure in settings"
          }
          color="bg-pastel-peach/50 border-pastel-peach"
          iconBg="bg-pastel-peach"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Room Configurations</h2>
          <div className="space-y-3">
            {roomConfigs.map((rc, i) => {
              const colors = [
                "bg-pastel-sky/40 border-pastel-sky",
                "bg-pastel-mint/40 border-pastel-mint",
                "bg-pastel-amber/40 border-pastel-amber",
                "bg-pastel-rose/40 border-pastel-rose",
              ];
              return (
                <div
                  key={rc.id}
                  className={`rounded-2xl border p-5 ${colors[i % colors.length]}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold">
                        {rc.roomSize}-person rooms
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {rc.totalRooms} rooms &middot;{" "}
                        {rc.roomSize * rc.totalRooms} beds total
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-white/60 flex items-center justify-center">
                      <DoorOpen className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </div>
              );
            })}
            {roomConfigs.length === 0 && (
              <p className="text-muted-foreground text-sm py-4">
                No room configurations yet. Head to Room Config to add some.
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Finalization</h2>
          <div className="rounded-2xl border bg-pastel-rose/30 border-pastel-rose p-6 space-y-4">
            {allLocked ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-green-600" />
                </div>
                <p className="font-medium text-green-700">
                  All rooms are finalized and locked.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Auto-assign all unmatched students based on compatibility and
                  lock all rooms. This action cannot be easily undone.
                </p>
                <div className="flex gap-6 text-sm">
                  <div className="rounded-xl bg-white/60 px-4 py-3 text-center">
                    <p className="text-2xl font-bold">{unassignedStudents}</p>
                    <p className="text-xs text-muted-foreground">
                      need rooms
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/60 px-4 py-3 text-center">
                    <p className="text-2xl font-bold">{totalRooms}</p>
                    <p className="text-xs text-muted-foreground">
                      rooms formed
                    </p>
                  </div>
                </div>
                <FinalizeButton />
              </>
            )}
          </div>
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
  color,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
  iconBg: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 relative overflow-hidden ${color}`}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-30 -translate-y-8 translate-x-8" style={{ background: "currentColor" }} />
      <div className={`h-9 w-9 rounded-xl ${iconBg} flex items-center justify-center text-primary mb-3`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}
