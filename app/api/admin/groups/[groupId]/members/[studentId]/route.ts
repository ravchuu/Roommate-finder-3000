import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ groupId: string; studentId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;
  const { groupId, studentId } = await params;

  const group = await db.group.findFirst({
    where: { id: groupId, organizationId: orgId },
    include: { members: true },
  });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const membership = group.members.find((m) => m.studentId === studentId);
  if (!membership) {
    return NextResponse.json(
      { error: "Student is not in this group" },
      { status: 404 }
    );
  }

  const wasLeader = group.leaderId === studentId;
  await db.groupMember.delete({ where: { id: membership.id } });

  if (wasLeader && group.members.length > 1) {
    const newLeaderId = group.members.find((m) => m.studentId !== studentId)?.studentId;
    if (newLeaderId) {
      await db.group.update({
        where: { id: groupId },
        data: { leaderId: newLeaderId },
      });
    } else {
      await db.group.update({
        where: { id: groupId },
        data: { leaderId: null },
      });
    }
  } else if (wasLeader) {
    await db.group.update({
      where: { id: groupId },
      data: { leaderId: null },
    });
  }

  return NextResponse.json({ success: true });
}
