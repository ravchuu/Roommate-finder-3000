import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { leaveGroup } from "@/lib/group";
import { getDeadlineStatus, isChangeRestricted } from "@/lib/deadline";

export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getDeadlineStatus(session.user.organizationId);
  if (status.isPast) {
    return NextResponse.json({ error: "Deadline has passed" }, { status: 403 });
  }
  if (isChangeRestricted(status.hoursRemaining)) {
    return NextResponse.json({ error: "Changes restricted near deadline" }, { status: 403 });
  }

  const result = await leaveGroup(session.user.id);
  if (!result) {
    return NextResponse.json({ error: "Not in a group or group is locked" }, { status: 400 });
  }

  return NextResponse.json(result);
}
