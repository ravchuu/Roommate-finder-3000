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
    include: {
      group: {
        include: {
          members: {
            include: {
              student: {
                select: { id: true, name: true, photo: true, email: true, bio: true, preferredRoomSizes: true },
              },
            },
          },
          leader: {
            select: { id: true, name: true },
          },
          endorsements: {
            include: {
              endorsedStudent: { select: { id: true, name: true, photo: true } },
              endorsedBy: { select: { id: true, name: true } },
            },
          },
          invites: {
            where: { status: "pending" },
            include: {
              student: { select: { id: true, name: true, photo: true } },
              invitedBy: { select: { id: true, name: true } },
            },
          },
          mergeRequestsFrom: {
            where: { status: "pending" },
            include: {
              toGroup: {
                include: {
                  members: {
                    include: { student: { select: { id: true, name: true, photo: true } } },
                  },
                  leader: { select: { id: true, name: true } },
                },
              },
            },
          },
          mergeRequestsTo: {
            where: { status: "pending" },
            include: {
              fromGroup: {
                include: {
                  members: {
                    include: { student: { select: { id: true, name: true, photo: true } } },
                  },
                  leader: { select: { id: true, name: true } },
                },
              },
            },
          },
          reservedConfig: {
            select: { roomSize: true, totalRooms: true, reservationThresholdPercent: true },
          },
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ group: null });
  }

  return NextResponse.json({ group: membership.group });
}
