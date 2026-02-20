import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transferLeadership } from "@/lib/group";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, newLeaderId } = await req.json();
  if (!groupId || !newLeaderId) {
    return NextResponse.json({ error: "Group ID and new leader ID required" }, { status: 400 });
  }

  const result = await transferLeadership(groupId, session.user.id, newLeaderId);
  if (!result) {
    return NextResponse.json({ error: "Cannot transfer (not the leader or target not in group)" }, { status: 403 });
  }

  return NextResponse.json(result);
}
