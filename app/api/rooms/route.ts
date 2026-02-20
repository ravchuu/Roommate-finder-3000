import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db.roomMember.findUnique({
    where: { studentId: session.user.id },
    include: {
      room: {
        include: {
          members: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  photo: true,
                  email: true,
                  bio: true,
                },
              },
            },
          },
          leader: {
            select: { id: true, name: true },
          },
          endorsements: {
            include: {
              endorsedStudent: {
                select: { id: true, name: true, photo: true },
              },
              endorsedBy: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ room: null });
  }

  return NextResponse.json({ room: membership.room });
}
