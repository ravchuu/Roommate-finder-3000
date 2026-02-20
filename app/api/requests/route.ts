import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const REQUEST_EXPIRY_HOURS = 48;

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await expireOldRequests();

  const [sent, received] = await Promise.all([
    db.roommateRequest.findMany({
      where: { fromStudentId: session.user.id },
      include: {
        toStudent: {
          select: { id: true, name: true, photo: true, email: true, preferredRoomSize: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.roommateRequest.findMany({
      where: { toStudentId: session.user.id },
      include: {
        fromStudent: {
          select: { id: true, name: true, photo: true, email: true, preferredRoomSize: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ sent, received });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { toStudentId } = await req.json();
  if (!toStudentId) {
    return NextResponse.json(
      { error: "Target student ID required" },
      { status: 400 }
    );
  }

  if (toStudentId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot send request to yourself" },
      { status: 400 }
    );
  }

  const existing = await db.roommateRequest.findFirst({
    where: {
      fromStudentId: session.user.id,
      toStudentId,
      status: "pending",
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Request already sent" },
      { status: 409 }
    );
  }

  const request = await db.roommateRequest.create({
    data: {
      fromStudentId: session.user.id,
      toStudentId,
      expiresAt: new Date(Date.now() + REQUEST_EXPIRY_HOURS * 60 * 60 * 1000),
    },
  });

  return NextResponse.json(request, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId, action } = await req.json();
  if (!requestId || !["accept", "decline"].includes(action)) {
    return NextResponse.json(
      { error: "Request ID and action (accept/decline) required" },
      { status: 400 }
    );
  }

  const request = await db.roommateRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.toStudentId !== session.user.id) {
    return NextResponse.json(
      { error: "Request not found" },
      { status: 404 }
    );
  }

  if (request.status !== "pending") {
    return NextResponse.json(
      { error: "Request is no longer pending" },
      { status: 409 }
    );
  }

  const updated = await db.roommateRequest.update({
    where: { id: requestId },
    data: { status: action === "accept" ? "accepted" : "declined" },
  });

  if (action === "accept") {
    const mutual = await db.roommateRequest.findFirst({
      where: {
        fromStudentId: request.toStudentId,
        toStudentId: request.fromStudentId,
        status: "accepted",
      },
    });

    if (mutual) {
      await tryFormRoom(request.fromStudentId, request.toStudentId);
    }
  }

  return NextResponse.json(updated);
}

async function tryFormRoom(studentAId: string, studentBId: string) {
  const [studentA, studentB] = await Promise.all([
    db.student.findUnique({
      where: { id: studentAId },
      include: { roomMemberships: true },
    }),
    db.student.findUnique({
      where: { id: studentBId },
      include: { roomMemberships: true },
    }),
  ]);

  if (!studentA || !studentB) return;
  if (studentA.roomMemberships.length > 0 || studentB.roomMemberships.length > 0) return;

  const roomSize = studentA.preferredRoomSize || studentB.preferredRoomSize;
  if (!roomSize) return;

  const config = await db.roomConfig.findFirst({
    where: {
      organizationId: studentA.organizationId,
      roomSize,
    },
  });

  if (!config) return;

  const formedRooms = await db.room.count({
    where: { roomConfigId: config.id },
  });

  if (formedRooms >= config.totalRooms) return;

  const room = await db.room.create({
    data: {
      organizationId: studentA.organizationId,
      roomConfigId: config.id,
      roomSize: config.roomSize,
      leaderId: studentAId,
      status: config.roomSize <= 2 ? "full" : "forming",
    },
  });

  await db.roomMember.createMany({
    data: [
      { roomId: room.id, studentId: studentAId },
      { roomId: room.id, studentId: studentBId },
    ],
  });
}

async function expireOldRequests() {
  await db.roommateRequest.updateMany({
    where: {
      status: "pending",
      expiresAt: { lt: new Date() },
    },
    data: { status: "expired" },
  });
}
