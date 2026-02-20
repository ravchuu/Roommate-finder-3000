import { db } from "./db";
import { computeCompatibility } from "./compatibility";
import type { SurveyAnswers } from "./survey-questions";

export async function autoAssignStudents(organizationId: string) {
  const unassigned = await db.student.findMany({
    where: {
      organizationId,
      claimed: true,
      roomMemberships: { none: {} },
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

  const formingRooms = await db.room.findMany({
    where: { organizationId, status: "forming" },
    include: { members: true },
  });

  for (const room of formingRooms) {
    const spotsLeft = room.roomSize - room.members.length;
    if (spotsLeft <= 0) continue;

    const remaining = unassigned.filter((s) => !assignedIds.has(s.id));
    if (remaining.length === 0) break;

    const toAdd = remaining.slice(0, spotsLeft);
    for (const student of toAdd) {
      await db.roomMember.create({
        data: { roomId: room.id, studentId: student.id },
      });
      assignedIds.add(student.id);
      assignedCount++;
    }

    if (room.members.length + toAdd.length >= room.roomSize) {
      await db.room.update({
        where: { id: room.id },
        data: { status: "full" },
      });
    }
  }

  const stillUnassigned = unassigned.filter((s) => !assignedIds.has(s.id));

  if (stillUnassigned.length > 0) {
    const withSurvey = stillUnassigned.filter((s) => s.surveyResponse);
    const withoutSurvey = stillUnassigned.filter((s) => !s.surveyResponse);

    const grouped: string[][] = [];
    const used = new Set<string>();

    for (const student of withSurvey) {
      if (used.has(student.id)) continue;

      const group = [student.id];
      used.add(student.id);

      const myAnswers: SurveyAnswers = JSON.parse(
        student.surveyResponse!.answers
      );

      const candidates = withSurvey
        .filter((s) => !used.has(s.id))
        .map((s) => ({
          id: s.id,
          score: computeCompatibility(
            myAnswers,
            JSON.parse(s.surveyResponse!.answers)
          ),
        }))
        .sort((a, b) => b.score - a.score);

      for (const candidate of candidates) {
        if (used.has(candidate.id)) continue;
        group.push(candidate.id);
        used.add(candidate.id);
        if (group.length >= 4) break;
      }

      grouped.push(group);
    }

    for (const student of withoutSurvey) {
      if (used.has(student.id)) continue;
      grouped.push([student.id]);
      used.add(student.id);
    }

    for (const group of grouped) {
      const config = configs.find((c) => c.roomSize >= group.length);
      if (!config) continue;

      const existingRooms = await db.room.count({
        where: { roomConfigId: config.id },
      });
      if (existingRooms >= config.totalRooms) continue;

      const room = await db.room.create({
        data: {
          organizationId,
          roomConfigId: config.id,
          roomSize: config.roomSize,
          leaderId: group[0],
          status: group.length >= config.roomSize ? "full" : "forming",
        },
      });

      for (const studentId of group) {
        await db.roomMember.create({
          data: { roomId: room.id, studentId },
        });
        assignedCount++;
      }
    }
  }

  return { assigned: assignedCount };
}

export async function lockAllRooms(organizationId: string) {
  await db.room.updateMany({
    where: { organizationId },
    data: { status: "locked" },
  });
}
