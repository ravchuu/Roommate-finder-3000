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

  const [fromStudent, toStudent, org] = await Promise.all([
    db.student.findUnique({ where: { id: session.user.id }, select: { gender: true } }),
    db.student.findUnique({ where: { id: toStudentId }, select: { gender: true, organizationId: true } }),
    db.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { housingType: true },
    }),
  ]);
  if (!toStudent || toStudent.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }
  if (org?.housingType === "single_gender" && fromStudent?.gender && toStudent.gender) {
    if (fromStudent.gender.toLowerCase() !== toStudent.gender.toLowerCase()) {
      return NextResponse.json({ error: "Your organization uses single-gender housing; you can only match with the same gender" }, { status: 400 });
    }
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

  let outcome: "group_formed" | "invite_sent" | "merge_requested" | null = null;
  if (action === "accept") {
    outcome = await handleAccept(request.fromStudentId, request.toStudentId);
  }

  return NextResponse.json({ ...updated, outcome });
}

// ---------------------------------------------------------------------------
// Three-way branching on accept; returns outcome for frontend (group_formed, invite_sent, merge_requested, or null).
// ---------------------------------------------------------------------------
async function handleAccept(
  fromStudentId: string,
  toStudentId: string
): Promise<"group_formed" | "invite_sent" | "merge_requested" | null> {
  const mutual = await db.roommateRequest.findFirst({
    where: { fromStudentId: toStudentId, toStudentId: fromStudentId, status: "accepted" },
  });
  if (!mutual) return null;

  const [fromMembership, toMembership, fromStudent, toStudent] = await Promise.all([
    db.groupMember.findUnique({
      where: { studentId: fromStudentId },
      include: { group: { include: { members: true } } },
    }),
    db.groupMember.findUnique({
      where: { studentId: toStudentId },
      include: { group: { include: { members: true } } },
    }),
    db.student.findUnique({ where: { id: fromStudentId }, select: { organizationId: true, gender: true } }),
    db.student.findUnique({ where: { id: toStudentId }, select: { gender: true } }),
  ]);

  const org = fromStudent
    ? await db.organization.findUnique({
        where: { id: fromStudent.organizationId },
        select: { housingType: true },
      })
    : null;

  if (!fromStudent || !toStudent) return null;
  const orgId = fromStudent.organizationId;
  const fromGroup = fromMembership?.group;
  const toGroup = toMembership?.group;

  const isSingleGender = org?.housingType === "single_gender";
  const sameGender = (a: string | null, b: string | null) =>
    a != null && b != null && a.toLowerCase() === b.toLowerCase();

  if (isSingleGender && !sameGender(fromStudent.gender, toStudent.gender)) {
    return null; // do not create group / invite / merge across genders
  }

  if (!fromGroup && !toGroup) {
    await createGroupFromPair(fromStudentId, toStudentId, orgId);
    return "group_formed";
  }
  if (fromGroup && !toGroup) {
    if (isSingleGender) {
      const groupGender = fromGroup.members.length
        ? (await db.student.findUnique({ where: { id: fromGroup.members[0].studentId }, select: { gender: true } }))?.gender
        : null;
      if (groupGender != null && toStudent.gender != null && groupGender.toLowerCase() !== toStudent.gender.toLowerCase()) return null;
    }
    await createJoinInvite(fromGroup.id, toStudentId, fromStudentId);
    return "invite_sent";
  }
  if (!fromGroup && toGroup) {
    if (isSingleGender) {
      const groupGender = toGroup.members.length
        ? (await db.student.findUnique({ where: { id: toGroup.members[0].studentId }, select: { gender: true } }))?.gender
        : null;
      if (groupGender != null && fromStudent.gender != null && groupGender.toLowerCase() !== fromStudent.gender.toLowerCase()) return null;
    }
    await createJoinInvite(toGroup.id, fromStudentId, toStudentId);
    return "invite_sent";
  }
  if (fromGroup && toGroup && fromGroup.id !== toGroup.id) {
    if (isSingleGender) {
      const [g1, g2] = await Promise.all([
        fromGroup.members.length ? db.student.findUnique({ where: { id: fromGroup.members[0].studentId }, select: { gender: true } }) : null,
        toGroup.members.length ? db.student.findUnique({ where: { id: toGroup.members[0].studentId }, select: { gender: true } }) : null,
      ]);
      if (g1?.gender == null || g2?.gender == null || g1.gender.toLowerCase() !== g2.gender.toLowerCase()) return null;
    }
    await createMergeRequest(fromGroup.id, toGroup.id, fromStudentId);
    return "merge_requested";
  }
  return null;
}
