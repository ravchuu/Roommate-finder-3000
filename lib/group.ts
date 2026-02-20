import { db } from "./db";
import { tryReserveGroup } from "./reservation";

const INVITE_EXPIRY_HOURS = 48;
const MERGE_EXPIRY_HOURS = 48;

// ---------------------------------------------------------------------------
// Solo + Solo → create a brand-new group
// ---------------------------------------------------------------------------
export async function createGroupFromPair(
  studentAId: string,
  studentBId: string,
  organizationId: string
) {
  const [a, b] = await Promise.all([
    db.student.findUnique({ where: { id: studentAId }, select: { preferredRoomSizes: true } }),
    db.student.findUnique({ where: { id: studentBId }, select: { preferredRoomSizes: true } }),
  ]);

  const sizesA: number[] = a?.preferredRoomSizes ? JSON.parse(a.preferredRoomSizes) : [];
  const sizesB: number[] = b?.preferredRoomSizes ? JSON.parse(b.preferredRoomSizes) : [];
  const overlap = sizesA.filter((s) => sizesB.includes(s));

  const targetRoomSize = overlap.length === 1 ? overlap[0] : null;

  const group = await db.group.create({
    data: {
      organizationId,
      targetRoomSize,
      leaderId: studentAId,
      status: "unreserved",
      members: {
        create: [
          { studentId: studentAId },
          { studentId: studentBId },
        ],
      },
    },
    include: { members: true },
  });

  await tryReserveGroup(group.id);
  return group;
}

// ---------------------------------------------------------------------------
// Solo → Group join (creates a pending invite that the leader must approve)
// ---------------------------------------------------------------------------
export async function createJoinInvite(
  groupId: string,
  studentId: string,
  invitedByStudentId: string
) {
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);

  return db.invite.create({
    data: {
      groupId,
      studentId,
      invitedByStudentId,
      status: "pending",
      expiresAt,
    },
  });
}

// ---------------------------------------------------------------------------
// Leader approves an invite → student joins the group
// ---------------------------------------------------------------------------
export async function approveInvite(inviteId: string) {
  const invite = await db.invite.findUnique({
    where: { id: inviteId },
    include: {
      group: { include: { members: true } },
    },
  });

  if (!invite || invite.status !== "pending") return null;
  if (new Date() > invite.expiresAt) {
    await db.invite.update({ where: { id: inviteId }, data: { status: "expired" } });
    return null;
  }

  const group = invite.group;

  if (group.targetRoomSize && group.members.length >= group.targetRoomSize) {
    return null; // group already at capacity
  }

  const alreadyInGroup = await db.groupMember.findUnique({
    where: { studentId: invite.studentId },
  });
  if (alreadyInGroup) {
    await db.invite.update({ where: { id: inviteId }, data: { status: "declined" } });
    return null;
  }

  const [updatedInvite] = await db.$transaction([
    db.invite.update({ where: { id: inviteId }, data: { status: "accepted" } }),
    db.groupMember.create({ data: { groupId: group.id, studentId: invite.studentId } }),
  ]);

  await tryReserveGroup(group.id);
  return updatedInvite;
}

// ---------------------------------------------------------------------------
// Group + Group → merge request
// ---------------------------------------------------------------------------
export async function createMergeRequest(
  fromGroupId: string,
  toGroupId: string,
  initiatedByStudentId: string
) {
  const [fromGroup, toGroup] = await Promise.all([
    db.group.findUnique({ where: { id: fromGroupId }, include: { members: true } }),
    db.group.findUnique({ where: { id: toGroupId }, include: { members: true } }),
  ]);

  if (!fromGroup || !toGroup) return null;
  if (fromGroup.status === "locked" || toGroup.status === "locked") return null;

  const combinedSize = fromGroup.members.length + toGroup.members.length;
  const targetSize = fromGroup.targetRoomSize || toGroup.targetRoomSize;

  if (targetSize && combinedSize > targetSize) return null;

  const expiresAt = new Date(Date.now() + MERGE_EXPIRY_HOURS * 60 * 60 * 1000);

  const isFromLeader = fromGroup.leaderId === initiatedByStudentId;

  return db.mergeRequest.create({
    data: {
      fromGroupId,
      toGroupId,
      initiatedByStudentId,
      fromLeaderApproved: isFromLeader,
      toLeaderApproved: false,
      expiresAt,
    },
  });
}

// ---------------------------------------------------------------------------
// Leader approves their side of a merge → if both approved, execute merge
// ---------------------------------------------------------------------------
export async function approveMerge(mergeRequestId: string, approvingStudentId: string) {
  const mr = await db.mergeRequest.findUnique({
    where: { id: mergeRequestId },
    include: {
      fromGroup: { include: { members: true } },
      toGroup: { include: { members: true } },
    },
  });

  if (!mr || mr.status !== "pending") return null;
  if (new Date() > mr.expiresAt) {
    await db.mergeRequest.update({ where: { id: mergeRequestId }, data: { status: "expired" } });
    return null;
  }

  const isFromLeader = mr.fromGroup.leaderId === approvingStudentId;
  const isToLeader = mr.toGroup.leaderId === approvingStudentId;
  if (!isFromLeader && !isToLeader) return null;

  const updated = await db.mergeRequest.update({
    where: { id: mergeRequestId },
    data: {
      fromLeaderApproved: mr.fromLeaderApproved || isFromLeader,
      toLeaderApproved: mr.toLeaderApproved || isToLeader,
    },
  });

  if (updated.fromLeaderApproved && updated.toLeaderApproved) {
    await executeMerge(mr.fromGroup.id, mr.toGroup.id);
    await db.mergeRequest.update({ where: { id: mergeRequestId }, data: { status: "accepted" } });
  }

  return updated;
}

// ---------------------------------------------------------------------------
// Execute the actual merge: absorb toGroup into fromGroup
// ---------------------------------------------------------------------------
async function executeMerge(fromGroupId: string, toGroupId: string) {
  const toGroup = await db.group.findUnique({
    where: { id: toGroupId },
    include: { members: true },
  });
  if (!toGroup) return;

  await db.$transaction([
    ...toGroup.members.map((m) =>
      db.groupMember.update({
        where: { id: m.id },
        data: { groupId: fromGroupId },
      })
    ),
    db.endorsement.deleteMany({ where: { groupId: toGroupId } }),
    db.invite.updateMany({ where: { groupId: toGroupId, status: "pending" }, data: { status: "expired" } }),
    db.mergeRequest.updateMany({
      where: { OR: [{ fromGroupId: toGroupId }, { toGroupId: toGroupId }], status: "pending" },
      data: { status: "expired" },
    }),
    db.group.delete({ where: { id: toGroupId } }),
  ]);

  // Release old reservation if the absorbed group had one
  const fromGroup = await db.group.findUnique({ where: { id: fromGroupId } });
  if (fromGroup?.reservedRoomConfigId) {
    await db.group.update({
      where: { id: fromGroupId },
      data: { reservedRoomConfigId: null, reservedAt: null, status: "unreserved", thresholdDroppedAt: null },
    });
  }

  await tryReserveGroup(fromGroupId);
}

// ---------------------------------------------------------------------------
// Endorsement → unanimous auto-join
// ---------------------------------------------------------------------------
export async function addEndorsement(
  groupId: string,
  endorsedStudentId: string,
  endorsedByStudentId: string
) {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });

  if (!group || group.status === "locked") return null;
  if (group.targetRoomSize && group.members.length >= group.targetRoomSize) return null;

  const isMember = group.members.some((m) => m.studentId === endorsedByStudentId);
  if (!isMember) return null;

  const alreadyInGroup = await db.groupMember.findUnique({ where: { studentId: endorsedStudentId } });
  if (alreadyInGroup) return null;

  await db.endorsement.upsert({
    where: {
      groupId_endorsedStudentId_endorsedByStudentId: {
        groupId,
        endorsedStudentId,
        endorsedByStudentId,
      },
    },
    update: {},
    create: { groupId, endorsedStudentId, endorsedByStudentId },
  });

  const endorsementCount = await db.endorsement.count({
    where: { groupId, endorsedStudentId },
  });

  if (endorsementCount >= group.members.length) {
    await db.$transaction([
      db.groupMember.create({ data: { groupId, studentId: endorsedStudentId } }),
      db.endorsement.deleteMany({ where: { groupId, endorsedStudentId } }),
    ]);
    await tryReserveGroup(groupId);
    return { joined: true };
  }

  return { joined: false, endorsements: endorsementCount, needed: group.members.length };
}

// ---------------------------------------------------------------------------
// Leave group
// ---------------------------------------------------------------------------
export async function leaveGroup(studentId: string) {
  const membership = await db.groupMember.findUnique({
    where: { studentId },
    include: { group: { include: { members: true } } },
  });

  if (!membership) return null;
  const group = membership.group;
  if (group.status === "locked") return null;

  await db.$transaction([
    db.groupMember.delete({ where: { id: membership.id } }),
    db.endorsement.deleteMany({ where: { groupId: group.id, endorsedByStudentId: studentId } }),
  ]);

  const remaining = group.members.length - 1;

  if (remaining === 0) {
    await db.group.delete({ where: { id: group.id } });
    return { dissolved: true };
  }

  const updates: Parameters<typeof db.group.update>[0]["data"] = {};
  if (group.leaderId === studentId) {
    const newLeader = group.members.find((m) => m.studentId !== studentId);
    updates.leaderId = newLeader?.studentId ?? null;
  }

  await db.group.update({ where: { id: group.id }, data: updates });
  await tryReserveGroup(group.id);

  return { dissolved: false };
}

// ---------------------------------------------------------------------------
// Transfer leadership
// ---------------------------------------------------------------------------
export async function transferLeadership(groupId: string, currentLeaderId: string, newLeaderId: string) {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });

  if (!group || group.leaderId !== currentLeaderId) return null;
  if (!group.members.some((m) => m.studentId === newLeaderId)) return null;

  return db.group.update({ where: { id: groupId }, data: { leaderId: newLeaderId } });
}

// ---------------------------------------------------------------------------
// Leader locks the group (manual lock)
// ---------------------------------------------------------------------------
export async function leaderLockGroup(groupId: string, leaderId: string) {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });

  if (!group || group.leaderId !== leaderId) return null;
  if (group.status === "locked") return null;
  if (group.members.length < 2) return null;

  return db.group.update({
    where: { id: groupId },
    data: { status: "locked" },
  });
}

// ---------------------------------------------------------------------------
// Expire stale invites and merge requests
// ---------------------------------------------------------------------------
export async function expireStaleItems() {
  const now = new Date();
  await Promise.all([
    db.invite.updateMany({
      where: { status: "pending", expiresAt: { lt: now } },
      data: { status: "expired" },
    }),
    db.mergeRequest.updateMany({
      where: { status: "pending", expiresAt: { lt: now } },
      data: { status: "expired" },
    }),
    db.roommateRequest.updateMany({
      where: { status: "pending", expiresAt: { lt: now } },
      data: { status: "expired" },
    }),
  ]);
}
