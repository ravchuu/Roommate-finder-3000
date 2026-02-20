import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createGroupFromPair,
  createJoinInvite,
  createMergeRequest,
  expireStaleItems,
} from "@/lib/group";

const REQUEST_EXPIRY_HOURS = 48;

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await expireStaleItems();

  const [sent, received] = await Promise.all([
    db.roommateRequest.findMany({
      where: { fromStudentId: session.user.id },
      include: {
        toStudent: {
          select: { id: true, name: true, photo: true, email: true, preferredRoomSizes: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.roommateRequest.findMany({
      where: { toStudentId: session.user.id },
      include: {
        fromStudent: {
          select: { id: true, name: true, photo: true, email: true, preferredRoomSizes: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ sent, received });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { toStudentId } = await req.json();
  if (!toStudentId) {
    return NextResponse.json({ error: "Target student ID required" }, { status: 400 });
  }
  if (toStudentId === session.user.id) {
    return NextResponse.json({ error: "Cannot send request to yourself" }, { status: 400 });
  }

  const existing = await db.roommateRequest.findFirst({
    where: { fromStudentId: session.user.id, toStudentId, status: "pending" },
  });
  if (existing) {
    return NextResponse.json({ error: "Request already sent" }, { status: 409 });
  }

  const request = await db.roommateRequest.create({
    data: {
      fromStudentId: session.user.id,
      toStudentId,
      expiresAt: new Date(Date.now() + REQUEST_EXPIRY_HOURS * 60 * 60 * 1000),
    },
  });

  return NextResponse.json(request, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId, action } = await req.json();
  if (!requestId || !["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "Request ID and action (accept/decline) required" }, { status: 400 });
  }

  const request = await db.roommateRequest.findUnique({ where: { id: requestId } });
  if (!request || request.toStudentId !== session.user.id) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (request.status !== "pending") {
    return NextResponse.json({ error: "Request is no longer pending" }, { status: 409 });
  }

  const updated = await db.roommateRequest.update({
    where: { id: requestId },
    data: { status: action === "accept" ? "accepted" : "declined" },
  });

  if (action === "accept") {
    await handleAccept(request.fromStudentId, request.toStudentId);
  }

  return NextResponse.json(updated);
}

// ---------------------------------------------------------------------------
// Three-way branching on accept
// ---------------------------------------------------------------------------
async function handleAccept(fromStudentId: string, toStudentId: string) {
  // Check for mutual acceptance (both directions accepted)
  const mutual = await db.roommateRequest.findFirst({
    where: { fromStudentId: toStudentId, toStudentId: fromStudentId, status: "accepted" },
  });
  if (!mutual) return; // not mutual yet — wait for the other side

  const [fromMembership, toMembership, fromStudent] = await Promise.all([
    db.groupMember.findUnique({
      where: { studentId: fromStudentId },
      include: { group: { include: { members: true } } },
    }),
    db.groupMember.findUnique({
      where: { studentId: toStudentId },
      include: { group: { include: { members: true } } },
    }),
    db.student.findUnique({ where: { id: fromStudentId }, select: { organizationId: true } }),
  ]);

  if (!fromStudent) return;
  const orgId = fromStudent.organizationId;
  const fromGroup = fromMembership?.group;
  const toGroup = toMembership?.group;

  if (!fromGroup && !toGroup) {
    // SOLO + SOLO → create new group
    await createGroupFromPair(fromStudentId, toStudentId, orgId);
  } else if (fromGroup && !toGroup) {
    // toStudent is solo, fromStudent is in a group → invite toStudent into fromStudent's group
    await createJoinInvite(fromGroup.id, toStudentId, fromStudentId);
  } else if (!fromGroup && toGroup) {
    // fromStudent is solo, toStudent is in a group → invite fromStudent into toStudent's group
    await createJoinInvite(toGroup.id, fromStudentId, toStudentId);
  } else if (fromGroup && toGroup && fromGroup.id !== toGroup.id) {
    // Both in different groups → merge request
    await createMergeRequest(fromGroup.id, toGroup.id, fromStudentId);
  }
  // If same group — do nothing
}
