import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { newLeaderId } = await req.json();
  if (!newLeaderId) {
    return NextResponse.json(
      { error: "New leader ID required" },
      { status: 400 }
    );
  }

  const membership = await db.roomMember.findUnique({
    where: { studentId: session.user.id },
    include: { room: true },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "You are not in a room" },
      { status: 400 }
    );
  }

  if (membership.room.leaderId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the room leader can transfer leadership" },
      { status: 403 }
    );
  }

  const targetMembership = await db.roomMember.findFirst({
    where: { roomId: membership.room.id, studentId: newLeaderId },
  });

  if (!targetMembership) {
    return NextResponse.json(
      { error: "Target is not a member of this room" },
      { status: 400 }
    );
  }

  await db.room.update({
    where: { id: membership.room.id },
    data: { leaderId: newLeaderId },
  });

  return NextResponse.json({ success: true });
}
