import { db } from "./db";

export type PendingStudentAdd = {
  name: string;
  email: string;
  age?: number | null;
  gender?: string | null;
};

export type DraftRoomConfig = { roomSize: number; totalRooms: number };

export type DraftSettings = {
  name?: string;
  deadline?: string | null;
  housingType?: string;
};

/** Prisma client may not have orgDraft until after `npx prisma generate` + schema has OrgDraft. */
function getOrgDraftModel(): { findUnique: (args: unknown) => Promise<unknown>; delete: (args: unknown) => Promise<unknown>; upsert: (args: unknown) => Promise<unknown> } | null {
  return "orgDraft" in db ? (db as { orgDraft: { findUnique: (args: unknown) => Promise<unknown>; delete: (args: unknown) => Promise<unknown>; upsert: (args: unknown) => Promise<unknown> } }).orgDraft : null;
}

/** True if draft feature is available (OrgDraft table exists and client was generated). */
export function isDraftAvailable(): boolean {
  return getOrgDraftModel() != null;
}

/** Upsert draft row. No-op and returns false if draft model not available. */
export async function upsertDraft(
  organizationId: string,
  data: { pendingStudentAdds?: string; roomConfigs?: string; settings?: string }
): Promise<boolean> {
  const model = getOrgDraftModel();
  if (!model) return false;
  await model.upsert({
    where: { organizationId },
    create: {
      organizationId,
      pendingStudentAdds: data.pendingStudentAdds ?? "[]",
      roomConfigs: data.roomConfigs ?? null,
      settings: data.settings ?? null,
    },
    update: data,
  });
  return true;
}

export async function getDraft(organizationId: string) {
  const model = getOrgDraftModel();
  if (!model) return null;
  return model.findUnique({ where: { organizationId } }) as Promise<{
    pendingStudentAdds: string;
    roomConfigs: string | null;
    settings: string | null;
  } | null>;
}

export function parsePendingStudents(json: string): PendingStudentAdd[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function parseRoomConfigs(json: string | null): DraftRoomConfig[] | null {
  if (json == null) return null;
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

export function parseSettings(json: string | null): DraftSettings | null {
  if (json == null) return null;
  try {
    return JSON.parse(json) as DraftSettings;
  } catch {
    return null;
  }
}

export function hasDraftChanges(draft: { pendingStudentAdds: string; roomConfigs: string | null; settings: string | null } | null): boolean {
  if (!draft) return false;
  const adds = parsePendingStudents(draft.pendingStudentAdds);
  const rooms = parseRoomConfigs(draft.roomConfigs);
  const settings = parseSettings(draft.settings);
  return adds.length > 0 || (rooms != null && rooms.length > 0) || (settings != null && Object.keys(settings).length > 0);
}

/** Apply draft to live: create pending students, replace room configs, update org settings. Then clear draft. */
export async function applyDraftAndClear(organizationId: string) {
  const model = getOrgDraftModel();
  if (!model) return;
  const draft = await model.findUnique({ where: { organizationId } }) as { pendingStudentAdds: string; roomConfigs: string | null; settings: string | null } | null;
  if (!draft) return;

  const pendingAdds = parsePendingStudents(draft.pendingStudentAdds);
  const roomConfigs = parseRoomConfigs(draft.roomConfigs);
  const settings = parseSettings(draft.settings);

  await db.$transaction(async (t) => {
    const txn = t as typeof db & { orgDraft?: { delete: (args: { where: { organizationId: string } }) => Promise<unknown> } };
    if (pendingAdds.length > 0) {
      const existingEmails = new Set(
        (await txn.student.findMany({ where: { organizationId }, select: { email: true } })).map((s) => s.email.toLowerCase())
      );
      for (const row of pendingAdds) {
        const email = (row.email || "").trim().toLowerCase();
        if (!email || !row.name?.trim()) continue;
        if (existingEmails.has(email)) continue;
        existingEmails.add(email);
        await txn.student.create({
          data: {
            organizationId,
            name: row.name.trim(),
            email,
            age: row.age != null && !Number.isNaN(Number(row.age)) ? Number(row.age) : null,
            gender: typeof row.gender === "string" ? row.gender.trim() || null : null,
          },
        });
      }
    }

    if (roomConfigs != null && roomConfigs.length > 0) {
      await txn.roomConfig.deleteMany({ where: { organizationId } });
      for (const rc of roomConfigs) {
        const size = Number(rc.roomSize);
        const total = Number(rc.totalRooms);
        if (size >= 2 && total >= 1) {
          await txn.roomConfig.create({
            data: { organizationId, roomSize: size, totalRooms: total },
          });
        }
      }
    }

    if (settings != null && Object.keys(settings).length > 0) {
      const data: { name?: string; deadline?: Date | null; housingType?: string } = {};
      if (typeof settings.name === "string") data.name = settings.name.trim();
      if (settings.deadline !== undefined) data.deadline = settings.deadline ? new Date(settings.deadline) : null;
      if (settings.housingType !== undefined && ["coed", "single_gender"].includes(settings.housingType)) {
        data.housingType = settings.housingType;
      }
      if (Object.keys(data).length > 0) {
        await txn.organization.update({ where: { id: organizationId }, data });
      }
    }

    if (txn.orgDraft) await txn.orgDraft.delete({ where: { organizationId } });
  });
}
