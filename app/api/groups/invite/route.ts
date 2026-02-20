import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { approveInvite } from "@/lib/group";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invites = await db.invite.findMany({
    where: { studentId: session.user.id, status: "pending" },
    include: {
      group: {
        include: {
          members: {
            include: { student: { select: { id: true, name: true, photo: true } } },
          },
          leader: { select: { id: true, name: true } },
        },
      },
      invitedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invites });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inviteId, action } = await req.json();
  if (!inviteId || !["approve", "decline"].includes(action)) {
    return NextResponse.json({ error: "Invite ID and action required" }, { status: 400 });
  }

  const invite = await db.invite.findUnique({
    where: { id: inviteId },
    include: { group: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  // Leader of the group can approve/decline
  const isLeader = invite.group.leaderId === session.user.id;
  // The invited student can also decline
  const isInvitee = invite.studentId === session.user.id;

  if (!isLeader && !isInvitee) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (action === "decline") {
    const updated = await db.invite.update({
      where: { id: inviteId },
      data: { status: "declined" },
    });
    return NextResponse.json(updated);
  }

  // Approve — only leader can approve
  if (!isLeader) {
    return NextResponse.json({ error: "Only the group leader can approve invites" }, { status: 403 });
  }

  const result = await approveInvite(inviteId);
  if (!result) {
    return NextResponse.json({ error: "Could not approve invite (expired, full, or student already in a group)" }, { status: 409 });
  }

  return NextResponse.json(result);
}
