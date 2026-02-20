import { db } from "./db";

// ---------------------------------------------------------------------------
// Try to reserve a slot for a group after membership changes.
// Called after every add/remove/merge operation.
// ---------------------------------------------------------------------------
export async function tryReserveGroup(groupId: string) {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });
  if (!group || group.status === "locked") return;

  const memberCount = group.members.length;
  const targetSize = group.targetRoomSize;

  // If group has no target size yet, find the smallest config that fits
  const config = targetSize
    ? await db.roomConfig.findFirst({
        where: { organizationId: group.organizationId, roomSize: targetSize },
      })
    : await db.roomConfig.findFirst({
        where: { organizationId: group.organizationId, roomSize: { gte: memberCount } },
        orderBy: { roomSize: "asc" },
      });

  if (!config) {
    // No matching config — stay unreserved
    if (group.reservedRoomConfigId) {
      await releaseReservation(groupId);
    }
    return;
  }

  const threshold = Math.ceil(config.roomSize * config.reservationThresholdPercent);
  const meetsThreshold = memberCount >= threshold;

  // --- Currently reserved ---
  if (group.status === "reserved") {
    if (!meetsThreshold) {
      // Dropped below threshold — start grace period
      if (!group.thresholdDroppedAt) {
        await db.group.update({
          where: { id: groupId },
          data: { thresholdDroppedAt: new Date() },
        });
      } else {
        const hoursSinceDrop =
          (Date.now() - new Date(group.thresholdDroppedAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceDrop >= config.gracePeriodHours) {
          await releaseReservation(groupId);
          await promoteWaitlisted(group.organizationId);
        }
      }
    } else if (group.thresholdDroppedAt) {
      // Back above threshold — clear grace timer
      await db.group.update({
        where: { id: groupId },
        data: { thresholdDroppedAt: null },
      });
    }
    return;
  }

  // --- Not yet reserved (unreserved or waitlisted) ---
  if (!meetsThreshold) {
    if (group.status !== "unreserved") {
      await db.group.update({ where: { id: groupId }, data: { status: "unreserved", thresholdDroppedAt: null } });
    }
    return;
  }

  // Meets threshold — try to claim a slot
  const reservedCount = await db.group.count({
    where: {
      organizationId: group.organizationId,
      reservedRoomConfigId: config.id,
      status: { in: ["reserved", "locked"] },
    },
  });

  if (reservedCount < config.totalRooms) {
    await db.group.update({
      where: { id: groupId },
      data: {
        status: "reserved",
        reservedRoomConfigId: config.id,
        reservedAt: new Date(),
        thresholdDroppedAt: null,
      },
    });
  } else {
    // No slots — waitlist
    if (group.status !== "waitlisted") {
      await db.group.update({ where: { id: groupId }, data: { status: "waitlisted" } });
    }
  }

  // Auto-lock if group is at full capacity for its reserved config
  if (meetsThreshold && memberCount >= config.roomSize) {
    await db.group.update({
      where: { id: groupId },
      data: { status: "locked", reservedRoomConfigId: config.id, reservedAt: group.reservedAt ?? new Date() },
    });
  }
}

// ---------------------------------------------------------------------------
// Release a reservation and reset group to unreserved
// ---------------------------------------------------------------------------
async function releaseReservation(groupId: string) {
  await db.group.update({
    where: { id: groupId },
    data: {
      status: "unreserved",
      reservedRoomConfigId: null,
      reservedAt: null,
      thresholdDroppedAt: null,
    },
  });
}

// ---------------------------------------------------------------------------
// Promote the highest-priority waitlisted group when a slot opens.
// Priority: higher member count → earlier createdAt → random.
// ---------------------------------------------------------------------------
export async function promoteWaitlisted(organizationId: string) {
  // Find all room configs for this org that have open slots
  const configs = await db.roomConfig.findMany({
    where: { organizationId },
  });

  for (const config of configs) {
    const reservedCount = await db.group.count({
      where: {
        organizationId,
        reservedRoomConfigId: config.id,
        status: { in: ["reserved", "locked"] },
      },
    });

    if (reservedCount >= config.totalRooms) continue;

    const slotsOpen = config.totalRooms - reservedCount;

    // Find waitlisted groups that target this config size
    const waitlisted = await db.group.findMany({
      where: {
        organizationId,
        status: "waitlisted",
        OR: [
          { targetRoomSize: config.roomSize },
          { targetRoomSize: null }, // flexible groups
        ],
      },
      include: { members: true },
      orderBy: [{ createdAt: "asc" }],
    });

    // Sort: higher member count first, then earlier createdAt
    waitlisted.sort((a, b) => {
      const countDiff = b.members.length - a.members.length;
      if (countDiff !== 0) return countDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    let promoted = 0;
    for (const group of waitlisted) {
      if (promoted >= slotsOpen) break;

      const threshold = Math.ceil(config.roomSize * config.reservationThresholdPercent);
      if (group.members.length < threshold) continue;

      await db.group.update({
        where: { id: group.id },
        data: {
          status: "reserved",
          reservedRoomConfigId: config.id,
          reservedAt: new Date(),
          thresholdDroppedAt: null,
        },
      });
      promoted++;
    }
  }
}

// ---------------------------------------------------------------------------
// Get reservation stats for an organization (for admin dashboard)
// ---------------------------------------------------------------------------
export async function getReservationStats(organizationId: string) {
  const configs = await db.roomConfig.findMany({
    where: { organizationId },
  });

  const stats = await Promise.all(
    configs.map(async (config) => {
      const reserved = await db.group.count({
        where: { organizationId, reservedRoomConfigId: config.id, status: "reserved" },
      });
      const locked = await db.group.count({
        where: { organizationId, reservedRoomConfigId: config.id, status: "locked" },
      });
      const waitlisted = await db.group.count({
        where: {
          organizationId,
          status: "waitlisted",
          OR: [{ targetRoomSize: config.roomSize }, { targetRoomSize: null }],
        },
      });

      return {
        roomSize: config.roomSize,
        totalSlots: config.totalRooms,
        reserved,
        locked,
        available: config.totalRooms - reserved - locked,
        waitlisted,
        threshold: config.reservationThresholdPercent,
      };
    })
  );

  return stats;
}
