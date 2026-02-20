import { db } from "./db";
import { computeCompatibility } from "./compatibility";
import type { SurveyAnswers } from "./survey-questions";

export async function autoAssignStudents(organizationId: string) {
  const unassigned = await db.student.findMany({
    where: {
      organizationId,
      claimed: true,
      groupMemberships: { none: {} },
    },
    include: { surveyResponse: true },
  });

  if (unassigned.length === 0) return { assigned: 0 };

  const configs = await db.roomConfig.findMany({
    where: { organizationId },
    orderBy: { roomSize: "asc" },
  });

  let assignedCount = 0;
  const assignedIds = new Set<string>();

  // Phase 1: fill existing unreserved/reserved/waitlisted groups that aren't full
  const openGroups = await db.group.findMany({
    where: { organizationId, status: { not: "locked" } },
    include: { members: true },
  });

  for (const group of openGroups) {
    const capacity = group.targetRoomSize || configs.find((c) => c.roomSize >= group.members.length)?.roomSize || 0;
    const spotsLeft = capacity - group.members.length;
    if (spotsLeft <= 0) continue;

    const remaining = unassigned.filter((s) => !assignedIds.has(s.id));
    if (remaining.length === 0) break;

    const toAdd = remaining.slice(0, spotsLeft);
    for (const student of toAdd) {
      await db.groupMember.create({
        data: { groupId: group.id, studentId: student.id },
      });
      assignedIds.add(student.id);
      assignedCount++;
    }
  }

  // Phase 2: create new groups for remaining unassigned students
  const stillUnassigned = unassigned.filter((s) => !assignedIds.has(s.id));

  if (stillUnassigned.length > 0) {
    const withSurvey = stillUnassigned.filter((s) => s.surveyResponse);
    const withoutSurvey = stillUnassigned.filter((s) => !s.surveyResponse);

    const grouped: string[][] = [];
    const used = new Set<string>();

    for (const student of withSurvey) {
      if (used.has(student.id)) continue;

      const cluster = [student.id];
      used.add(student.id);

      const myAnswers: SurveyAnswers = JSON.parse(student.surveyResponse!.answers);

      const candidates = withSurvey
        .filter((s) => !used.has(s.id))
        .map((s) => ({
          id: s.id,
          score: computeCompatibility(myAnswers, JSON.parse(s.surveyResponse!.answers)),
        }))
        .sort((a, b) => b.score - a.score);

      for (const candidate of candidates) {
        if (used.has(candidate.id)) continue;
        cluster.push(candidate.id);
        used.add(candidate.id);
        if (cluster.length >= 4) break;
      }

      grouped.push(cluster);
    }

    for (const student of withoutSurvey) {
      if (used.has(student.id)) continue;
      grouped.push([student.id]);
      used.add(student.id);
    }

    for (const cluster of grouped) {
      const config = configs.find((c) => c.roomSize >= cluster.length);
      if (!config) continue;

      // Check inventory: count reserved+locked groups for this config
      const reservedCount = await db.group.count({
        where: {
          organizationId,
          reservedRoomConfigId: config.id,
          status: { in: ["reserved", "locked"] },
        },
      });
      if (reservedCount >= config.totalRooms) continue;

      await db.group.create({
        data: {
          organizationId,
          targetRoomSize: config.roomSize,
          leaderId: cluster[0],
          status: "unreserved",
          members: {
            create: cluster.map((studentId) => ({ studentId })),
          },
        },
      });

      assignedCount += cluster.length;
    }
  }

  return { assigned: assignedCount };
}

export async function lockAllGroups(organizationId: string) {
  // Reserve any unreserved groups that qualify before locking
  const unreserved = await db.group.findMany({
    where: { organizationId, status: { not: "locked" } },
    include: { members: true },
  });

  const configs = await db.roomConfig.findMany({ where: { organizationId } });

  for (const group of unreserved) {
    if (group.members.length === 0) continue;
    const config =
      configs.find((c) => c.roomSize === group.targetRoomSize) ||
      configs.find((c) => c.roomSize >= group.members.length);

    await db.group.update({
      where: { id: group.id },
      data: {
        status: "locked",
        reservedRoomConfigId: config?.id ?? group.reservedRoomConfigId,
        targetRoomSize: group.targetRoomSize ?? config?.roomSize ?? null,
      },
    });
  }
}
