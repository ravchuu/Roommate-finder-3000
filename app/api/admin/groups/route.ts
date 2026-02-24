import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;

  const [groups, unassignedStudents] = await Promise.all([
    db.group.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "asc" },
      include: {
        members: {
          include: {
            student: {
              select: { id: true, name: true, email: true, claimed: true },
            },
          },
        },
        leader: { select: { id: true, name: true } },
        reservedConfig: { select: { id: true, roomSize: true, totalRooms: true } },
      },
    }),
    db.student.findMany({
      where: {
        organizationId: orgId,
        claimed: true,
        groupMemberships: { none: {} },
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    groups: groups.map((g) => ({
      id: g.id,
      targetRoomSize: g.targetRoomSize,
      status: g.status,
      leaderId: g.leaderId,
      leaderName: g.leader?.name ?? null,
      reservedRoomConfigId: g.reservedRoomConfigId,
      reservedConfig: g.reservedConfig,
      members: g.members.map((m) => ({
        id: m.student.id,
        name: m.student.name,
        email: m.student.email,
        claimed: m.student.claimed,
      })),
    })),
    unassignedStudents,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;

  try {
    const body = await req.json().catch(() => ({}));
    const studentIds = Array.isArray(body.studentIds) ? body.studentIds as string[] : [];

    const students = await db.student.findMany({
      where: {
        id: { in: studentIds },
        organizationId: orgId,
        claimed: true,
      },
      select: { id: true },
    });
    const validIds = students.map((s) => s.id);

    let toAdd: string[] = [];
    if (validIds.length > 0) {
      const existingMemberships = await db.groupMember.findMany({
        where: { studentId: { in: validIds } },
        select: { studentId: true },
      });
      const alreadyInGroup = new Set(existingMemberships.map((m) => m.studentId));
      toAdd = validIds.filter((id) => !alreadyInGroup.has(id));
      if (toAdd.length === 0) {
        return NextResponse.json(
          { error: "All selected students are already in a group." },
          { status: 400 }
        );
      }
    }

    const group = await db.group.create({
      data: {
        organizationId: orgId,
        status: "unreserved",
        leaderId: toAdd[0] ?? null,
        ...(toAdd.length > 0 && {
          members: { create: toAdd.map((studentId) => ({ studentId })) },
        }),
      },
      include: {
        members: {
          include: {
            student: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (e) {
    console.error("Admin create group error:", e);
    return NextResponse.json(
      { error: "Failed to create group." },
      { status: 500 }
    );
  }
}
