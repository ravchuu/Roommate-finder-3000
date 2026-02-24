import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;
  const { groupId } = await params;

  try {
    const body = await req.json();
    const studentId = typeof body.studentId === "string" ? body.studentId : null;
    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    const [group, student] = await Promise.all([
      db.group.findFirst({
        where: { id: groupId, organizationId: orgId },
        include: { members: true },
      }),
      db.student.findFirst({
        where: { id: studentId, organizationId: orgId, claimed: true },
      }),
    ]);

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    if (!student) {
      return NextResponse.json({ error: "Student not found or not claimed" }, { status: 404 });
    }
    if (group.members.some((m) => m.studentId === studentId)) {
      return NextResponse.json(
        { error: "Student is already in this group" },
        { status: 400 }
      );
    }

    await db.$transaction([
      db.groupMember.deleteMany({ where: { studentId } }),
      db.groupMember.create({
        data: { groupId: group.id, studentId },
      }),
    ]);

    const updated = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            student: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Admin add member error:", e);
    return NextResponse.json(
      { error: "Failed to add student to group." },
      { status: 500 }
    );
  }
}
