import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { autoAssignStudents, lockAllRooms } from "@/lib/auto-assign";

export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;

  const { assigned } = await autoAssignStudents(orgId);
  await lockAllRooms(orgId);

  return NextResponse.json({
    success: true,
    message: `Auto-assigned ${assigned} students and locked all rooms.`,
  });
}
