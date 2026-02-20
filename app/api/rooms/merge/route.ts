import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetRoomId } = await req.json();
  if (!targetRoomId) {
    return NextResponse.json(
      { error: "Target room ID required" },
      { status: 400 }
    );
  }

  const myMembership = await db.roomMember.findUnique({
    where: { studentId: session.user.id },
    include: { room: { include: { members: true } } },
  });

  if (!myMembership) {
    return NextResponse.json(
      { error: "You are not in a room" },
      { status: 400 }
    );
  }

  const myRoom = myMembership.room;

  if (myRoom.leaderId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the room leader can initiate a merge" },
      { status: 403 }
    );
  }

  const targetRoom = await db.room.findUnique({
    where: { id: targetRoomId },
    include: { members: true },
  });

  if (!targetRoom) {
    return NextResponse.json(
      { error: "Target room not found" },
      { status: 404 }
    );
  }

  if (targetRoom.status === "locked" || myRoom.status === "locked") {
    return NextResponse.json(
      { error: "Cannot merge locked rooms" },
      { status: 400 }
    );
  }

  const totalMembers = myRoom.members.length + targetRoom.members.length;

  const config = await db.roomConfig.findFirst({
    where: {
      organizationId: myRoom.organizationId,
      roomSize: { gte: totalMembers },
    },
    orderBy: { roomSize: "asc" },
  });

  if (!config) {
    return NextResponse.json(
      { error: `No room configuration can fit ${totalMembers} members` },
      { status: 400 }
    );
  }

  const existingRoomsOfSize = await db.room.count({
    where: { roomConfigId: config.id },
  });

  const extraNeeded = config.id !== myRoom.roomConfigId && config.id !== targetRoom.roomConfigId ? 1 : 0;
  if (existingRoomsOfSize + extraNeeded > config.totalRooms) {
    return NextResponse.json(
      { error: "Not enough room inventory for this merge" },
      { status: 400 }
    );
  }

  for (const member of targetRoom.members) {
    await db.roomMember.update({
      where: { id: member.id },
      data: { roomId: myRoom.id },
    });
  }

  await db.room.update({
    where: { id: myRoom.id },
    data: {
      roomSize: config.roomSize,
      roomConfigId: config.id,
      status: totalMembers >= config.roomSize ? "full" : "forming",
    },
  });

  await db.endorsement.deleteMany({ where: { roomId: targetRoom.id } });
  await db.room.delete({ where: { id: targetRoom.id } });

  return NextResponse.json({
    success: true,
    message: `Rooms merged! New room size: ${config.roomSize}-person (${totalMembers} members)`,
  });
}
