import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await req.json();
  if (!studentId) {
    return NextResponse.json(
      { error: "Student ID required" },
      { status: 400 }
    );
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

  if (room.status === "full" || room.status === "locked") {
    return NextResponse.json(
      { error: "Room is already full or locked" },
      { status: 400 }
    );
  }

  const candidateMembership = await db.roomMember.findUnique({
    where: { studentId },
  });
  if (candidateMembership) {
    return NextResponse.json(
      { error: "This student is already in a room" },
      { status: 400 }
    );
  }

  await db.endorsement.upsert({
    where: {
      roomId_endorsedStudentId_endorsedByStudentId: {
        roomId: room.id,
        endorsedStudentId: studentId,
        endorsedByStudentId: session.user.id,
      },
    },
    create: {
      roomId: room.id,
      endorsedStudentId: studentId,
      endorsedByStudentId: session.user.id,
    },
    update: {},
  });

  const endorsementCount = await db.endorsement.count({
    where: { roomId: room.id, endorsedStudentId: studentId },
  });

  const memberCount = room.members.length;

  if (endorsementCount >= memberCount) {
    await db.roomMember.create({
      data: { roomId: room.id, studentId },
    });

    await db.endorsement.deleteMany({
      where: { roomId: room.id, endorsedStudentId: studentId },
    });

    const newMemberCount = memberCount + 1;
    if (newMemberCount >= room.roomSize) {
      await db.room.update({
        where: { id: room.id },
        data: { status: "full" },
      });
    }

    return NextResponse.json({ joined: true, message: "Student has joined the room!" });
  }

  return NextResponse.json({
    joined: false,
    message: `Endorsement recorded (${endorsementCount}/${memberCount} needed)`,
  });
}
