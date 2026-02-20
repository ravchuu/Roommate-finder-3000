import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db.roomMember.findUnique({
    where: { studentId: session.user.id },
    include: { room: { include: { members: true } } },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "You are not in a room" },
      { status: 400 }
    );
  }

  const room = membership.room;

  if (room.status === "locked") {
    return NextResponse.json(
      { error: "Cannot leave a locked room" },
      { status: 400 }
    );
  }

  await db.roomMember.delete({
    where: { id: membership.id },
  });

  await db.endorsement.deleteMany({
    where: { roomId: room.id, endorsedByStudentId: session.user.id },
  });

  const remainingMembers = room.members.filter(
    (m) => m.studentId !== session.user.id
  );

  if (remainingMembers.length === 0) {
    await db.endorsement.deleteMany({ where: { roomId: room.id } });
    await db.room.delete({ where: { id: room.id } });
    return NextResponse.json({ success: true, roomDeleted: true });
  }

  if (room.leaderId === session.user.id) {
    await db.room.update({
      where: { id: room.id },
      data: { leaderId: remainingMembers[0].studentId },
    });
  }

  if (room.status === "full") {
    await db.room.update({
      where: { id: room.id },
      data: { status: "forming" },
    });
  }

  return NextResponse.json({ success: true, roomDeleted: false });
}
