import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db.roomMember.findUnique({
    where: { studentId: session.user.id },
    include: { room: { include: { members: true } } },
  });

  if (!membership) {
    return NextResponse.json({ rooms: [] });
  }

  const myRoom = membership.room;

  if (myRoom.leaderId !== session.user.id || myRoom.status === "locked") {
    return NextResponse.json({ rooms: [] });
  }

  const otherRooms = await db.room.findMany({
    where: {
      organizationId: myRoom.organizationId,
      id: { not: myRoom.id },
      status: { in: ["forming"] },
    },
    include: {
      members: { include: { student: { select: { name: true } } } },
      leader: { select: { name: true } },
    },
  });

  const mergeable = otherRooms.filter((room) => {
    const totalMembers = myRoom.members.length + room.members.length;
    return totalMembers <= 10;
  });

  return NextResponse.json({
    rooms: mergeable.map((r) => ({
      id: r.id,
      roomSize: r.roomSize,
      memberCount: r.members.length,
      leaderName: r.leader?.name,
      memberNames: r.members.map((m) => m.student.name),
    })),
  });
}
