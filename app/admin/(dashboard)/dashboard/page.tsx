import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  getDraft,
  parsePendingStudents,
  parseRoomConfigs,
  parseSettings,
  hasDraftChanges,
} from "@/lib/draft";
import {
  Users,
  UserCheck,
  DoorOpen,
  Clock,
  Lock,
  LayoutDashboard,
  BedDouble,
  CheckCircle2,
  Circle,
  ArrowRight,
  ChevronRight,
  Home,
} from "lucide-react";
import { FinalizeButton } from "./finalize-button";
import { GoLiveButton } from "./go-live-button";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/admin/login");

  const orgId = session.user.organizationId;

  const [
    liveStudentCount,
    claimedStudents,
    liveRoomConfigs,
    org,
    totalGroups,
    lockedGroups,
    studentsInGroups,
    unassignedStudents,
    draft,
  ] = await Promise.all([
    db.student.count({ where: { organizationId: orgId } }),
    db.student.count({ where: { organizationId: orgId, claimed: true } }),
    db.roomConfig.findMany({ where: { organizationId: orgId }, orderBy: { roomSize: "asc" } }),
    db.organization.findUnique({ where: { id: orgId } }),
    db.group.count({ where: { organizationId: orgId } }),
    db.group.count({ where: { organizationId: orgId, status: "locked" } }),
    db.groupMember.count({
      where: { group: { organizationId: orgId } },
    }),
    db.student.count({
      where: {
        organizationId: orgId,
        claimed: true,
        groupMemberships: { none: {} },
      },
    }),
    getDraft(orgId),
  ]);

  const pendingAdds = draft ? parsePendingStudents(draft.pendingStudentAdds) : [];
  const draftRoomConfigs = draft ? parseRoomConfigs(draft.roomConfigs) : null;
  const draftSettings = draft ? parseSettings(draft.settings) : null;

  type RoomConfigDisplay = { id: string; roomSize: number; totalRooms: number; reservationThresholdPercent: number };
  const roomConfigs: RoomConfigDisplay[] =
    draftRoomConfigs && draftRoomConfigs.length > 0
      ? draftRoomConfigs.map((r) => ({
          id: `draft-${r.roomSize}`,
          roomSize: r.roomSize,
          totalRooms: r.totalRooms,
          reservationThresholdPercent: 0.5,
        }))
      : liveRoomConfigs.map((rc) => ({
          id: rc.id,
          roomSize: rc.roomSize,
          totalRooms: rc.totalRooms,
          reservationThresholdPercent: rc.reservationThresholdPercent,
        }));

  const totalStudents = liveStudentCount + pendingAdds.length;
  const totalCapacity = roomConfigs.reduce(
    (sum, rc) => sum + rc.roomSize * rc.totalRooms,
    0
  );

  const effectiveDeadline = draftSettings?.deadline != null
    ? (draftSettings.deadline ? new Date(draftSettings.deadline) : null)
    : org?.deadline ?? null;
  const effectiveName = draftSettings?.name ?? org?.name ?? "Your organization";
  const effectiveHousingType = draftSettings?.housingType ?? org?.housingType ?? "coed";
  const deadline = effectiveDeadline;
  const daysUntilDeadline = deadline
    ? Math.ceil(
        (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const allLocked = totalGroups > 0 && lockedGroups === totalGroups;

  const claimPercent =
    totalStudents > 0 ? Math.round((claimedStudents / totalStudents) * 100) : 0;

  const setupComplete = totalStudents > 0 && roomConfigs.length > 0 && !!deadline;
  const setupSteps = [
    { done: totalStudents > 0, label: "Upload student roster", href: "/admin/students" },
    { done: !!deadline, label: "Set deadline & housing (Settings)", href: "/admin/settings" },
    { done: roomConfigs.length > 0, label: "Add room sizes & counts", href: "/admin/rooms" },
  ];

  const unpublishedChanges = draft && hasDraftChanges(draft);

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-2xl bg-pastel-teal flex items-center justify-center">
          <LayoutDashboard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {effectiveName} overview
          </p>
        </div>
      </div>

      {unpublishedChanges && (
        <div className="rounded-2xl border border-amber-500/60 bg-amber-500/10 p-4 mb-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            You have unpublished changes. Roster, room config, and standards will update for students only after you go live.
          </p>
          <GoLiveButton />
        </div>
      )}

      {!setupComplete && (
        <div className="rounded-2xl border border-pastel-teal bg-pastel-teal/20 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            Admin setup
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Complete these steps to run your rooming process: roster → standards → room config.
          </p>
          <ul className="space-y-2">
            {setupSteps.map((step) => (
              <li key={step.label}>
                <Link
                  href={step.href}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/60 transition-colors"
                >
                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <span className={step.done ? "text-muted-foreground" : "font-medium"}>
                    {step.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          href="/admin/students"
          icon={<Users className="h-5 w-5" />}
          label="Total Students"
          value={totalStudents}
          subtitle={`${studentsInGroups} in groups, ${unassignedStudents} unassigned`}
        />
        <StatCard
          href="/admin/students"
          icon={<UserCheck className="h-5 w-5" />}
          label="Claimed Profiles"
          value={`${claimedStudents} / ${totalStudents}`}
          subtitle={`${claimPercent}% claimed`}
        />
        <StatCard
          href="/admin/rooms"
          icon={<BedDouble className="h-5 w-5" />}
          label="Total Capacity"
          value={`${totalCapacity} beds`}
          subtitle={`${roomConfigs.length} configs, ${totalGroups} groups formed`}
        />
        <StatCard
          href="/admin/settings"
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
        />
        <StatCard
          href="/admin/settings"
          icon={<Home className="h-5 w-5" />}
          label="Housing type"
          value={effectiveHousingType === "single_gender" ? "Single gender" : "Co-ed"}
          subtitle="Who can room together. Click to change."
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Room Configurations</h2>
          <div className="space-y-3">
            {roomConfigs.map((rc) => (
              <Link
                key={rc.id}
                href="/admin/rooms"
                className="block rounded-2xl border border-pastel-mint bg-pastel-mint/30 p-5 hover:bg-pastel-mint/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold">
                      {rc.roomSize}-person rooms
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {rc.totalRooms} rooms &middot;{" "}
                      {rc.roomSize * rc.totalRooms} beds &middot;{" "}
                      {Math.round(rc.reservationThresholdPercent * 100)}% threshold
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-pastel-teal/60 flex items-center justify-center">
                    <ChevronRight className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </Link>
            ))}
            {roomConfigs.length === 0 && (
              <Link
                href="/admin/rooms"
                className="block rounded-2xl border border-dashed border-pastel-mint bg-pastel-mint/20 p-5 hover:bg-pastel-mint/40 transition-colors text-muted-foreground text-sm py-4"
              >
                No room configurations yet. Click to add some.
              </Link>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Finalization</h2>
          <div className="rounded-2xl border border-pastel-peach bg-pastel-peach/30 p-6 space-y-4">
            {allLocked ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-pastel-green flex items-center justify-center">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <p className="font-medium">
                  All groups are finalized and locked.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Auto-assign all unmatched students based on compatibility and
                  lock all groups. This action cannot be easily undone.
                </p>
                <div className="flex gap-6 text-sm">
                  <div className="rounded-xl bg-white/60 px-4 py-3 text-center">
                    <p className="text-2xl font-bold">{unassignedStudents}</p>
                    <p className="text-xs text-muted-foreground">
                      need groups
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/60 px-4 py-3 text-center">
                    <p className="text-2xl font-bold">{totalGroups}</p>
                    <p className="text-xs text-muted-foreground">
                      groups formed
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
  href,
  icon,
  label,
  value,
  subtitle,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  const content = (
    <>
      <div className="absolute top-0 right-0 w-24 h-24 bg-pastel-teal/25 rounded-full -translate-y-8 translate-x-8" />
      <div className="h-9 w-9 rounded-xl bg-pastel-teal/70 flex items-center justify-center text-primary mb-3">
        {icon}
      </div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
      {href && (
        <span className="absolute bottom-3 right-3 text-pastel-teal opacity-70">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </>
  );

  const className = "rounded-2xl border border-pastel-teal bg-pastel-teal/30 p-5 relative overflow-hidden block";
  if (href) {
    return (
      <Link
        href={href}
        className={`${className} hover:bg-pastel-teal/40 transition-colors`}
      >
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
