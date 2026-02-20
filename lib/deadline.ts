import { db } from "./db";

export async function getDeadlineStatus(organizationId: string) {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { deadline: true },
  });

  if (!org?.deadline) {
    return { deadline: null, isPast: false, isNear: false, hoursRemaining: null };
  }

  const now = Date.now();
  const deadlineTime = new Date(org.deadline).getTime();
  const hoursRemaining = (deadlineTime - now) / (1000 * 60 * 60);

  return {
    deadline: org.deadline,
    isPast: hoursRemaining <= 0,
    isNear: hoursRemaining > 0 && hoursRemaining <= 24,
    hoursRemaining: Math.max(0, hoursRemaining),
  };
}

export function isChangeRestricted(hoursRemaining: number | null): boolean {
  if (hoursRemaining === null) return false;
  return hoursRemaining <= 6;
}
