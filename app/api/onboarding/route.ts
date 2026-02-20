import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configs = await db.roomConfig.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { roomSize: "asc" },
  });

  const availability = await Promise.all(
    configs.map(async (config) => {
      const formedRooms = await db.room.count({
        where: { roomConfigId: config.id },
      });
      return {
        roomSize: config.roomSize,
        totalRooms: config.totalRooms,
        roomsFormed: formedRooms,
        seatsRemaining:
          config.roomSize * config.totalRooms -
          (await db.roomMember.count({
            where: { room: { roomConfigId: config.id } },
          })),
        available: formedRooms < config.totalRooms ||
          (await db.room.count({
            where: { roomConfigId: config.id, status: "forming" },
          })) > 0,
      };
    })
  );

  return NextResponse.json(availability);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomSize } = await req.json();
  if (!roomSize) {
    return NextResponse.json(
      { error: "Room size is required" },
      { status: 400 }
    );
  }

  const config = await db.roomConfig.findFirst({
    where: {
      organizationId: session.user.organizationId,
      roomSize: parseInt(roomSize),
    },
  });

  if (!config) {
    return NextResponse.json(
      { error: "Invalid room size" },
      { status: 400 }
    );
  }

  await db.student.update({
    where: { id: session.user.id },
    data: { preferredRoomSize: parseInt(roomSize) },
  });

  return NextResponse.json({ success: true });
}
