import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leaderLockGroup } from "@/lib/group";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await req.json();
  if (!groupId) {
    return NextResponse.json({ error: "Group ID required" }, { status: 400 });
  }

  const result = await leaderLockGroup(groupId, session.user.id);
  if (!result) {
    return NextResponse.json(
      { error: "Cannot lock (not the leader, already locked, or fewer than 2 members)" },
      { status: 403 }
    );
  }

  return NextResponse.json(result);
}
