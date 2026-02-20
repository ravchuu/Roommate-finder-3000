import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db.groupMember.findUnique({
    where: { studentId: session.user.id },
    include: { group: { include: { members: true } } },
  });

  if (!membership) {
    return NextResponse.json({ groups: [] });
  }

  const group = membership.group;
  if (group.leaderId !== session.user.id) {
    return NextResponse.json({ groups: [] });
  }
  if (group.status === "locked") {
    return NextResponse.json({ groups: [] });
  }

  const maxCombined = group.targetRoomSize || 10;
  const mySize = group.members.length;

  const candidates = await db.group.findMany({
    where: {
      organizationId: group.organizationId,
      id: { not: group.id },
      status: { notIn: ["locked"] },
    },
    include: {
      members: {
        include: {
          student: { select: { id: true, name: true, photo: true } },
        },
      },
      leader: { select: { id: true, name: true } },
    },
  });

  const mergeable = candidates.filter((c) => mySize + c.members.length <= maxCombined);

  return NextResponse.json({ groups: mergeable });
}
