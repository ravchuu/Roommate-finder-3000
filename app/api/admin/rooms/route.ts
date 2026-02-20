import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configs = await db.roomConfig.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { roomSize: "asc" },
  });

  return NextResponse.json(configs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { roomSize, totalRooms } = await req.json();

    if (!roomSize || !totalRooms || roomSize < 2 || totalRooms < 1) {
      return NextResponse.json(
        { error: "Room size (min 2) and total rooms (min 1) are required" },
        { status: 400 }
      );
    }

    const existing = await db.roomConfig.findFirst({
      where: {
        organizationId: session.user.organizationId,
        roomSize: parseInt(roomSize),
      },
    });

    if (existing) {
      const updated = await db.roomConfig.update({
        where: { id: existing.id },
        data: { totalRooms: parseInt(totalRooms) },
      });
      return NextResponse.json(updated);
    }

    const config = await db.roomConfig.create({
      data: {
        organizationId: session.user.organizationId,
        roomSize: parseInt(roomSize),
        totalRooms: parseInt(totalRooms),
      },
    });

    return NextResponse.json(config, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save room config" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Config ID required" }, { status: 400 });
  }

  await db.roomConfig.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
