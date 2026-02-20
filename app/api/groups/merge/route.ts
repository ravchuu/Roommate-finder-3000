import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { approveMerge, createMergeRequest } from "@/lib/group";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { toGroupId } = await req.json();
  if (!toGroupId) {
    return NextResponse.json({ error: "Target group ID required" }, { status: 400 });
  }

  const myMembership = await db.groupMember.findUnique({
    where: { studentId: session.user.id },
    include: { group: true },
  });

  if (!myMembership) {
    return NextResponse.json({ error: "You are not in a group" }, { status: 400 });
  }

  if (myMembership.group.leaderId !== session.user.id) {
    return NextResponse.json({ error: "Only the group leader can initiate merges" }, { status: 403 });
  }

  const result = await createMergeRequest(myMembership.groupId, toGroupId, session.user.id);
  if (!result) {
    return NextResponse.json({ error: "Cannot merge (locked, too large, or groups not found)" }, { status: 409 });
  }

  return NextResponse.json(result, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mergeRequestId, action } = await req.json();
  if (!mergeRequestId || !["approve", "decline"].includes(action)) {
    return NextResponse.json({ error: "Merge request ID and action required" }, { status: 400 });
  }

  if (action === "decline") {
    const mr = await db.mergeRequest.findUnique({ where: { id: mergeRequestId } });
    if (!mr || mr.status !== "pending") {
      return NextResponse.json({ error: "Merge request not found or not pending" }, { status: 404 });
    }
    const updated = await db.mergeRequest.update({
      where: { id: mergeRequestId },
      data: { status: "declined" },
    });
    return NextResponse.json(updated);
  }

  const result = await approveMerge(mergeRequestId, session.user.id);
  if (!result) {
    return NextResponse.json({ error: "Cannot approve (expired, not a leader, or already processed)" }, { status: 409 });
  }

  return NextResponse.json(result);
}
