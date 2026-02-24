import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDraft, parseRoomConfigs, upsertDraft, isDraftAvailable, type DraftRoomConfig } from "@/lib/draft";

function withDraftIds(configs: DraftRoomConfig[]) {
  return configs.map((rc) => ({
    id: `draft-${rc.roomSize}`,
    roomSize: rc.roomSize,
    totalRooms: rc.totalRooms,
  }));
}

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;

  const [liveConfigs, draft] = await Promise.all([
    db.roomConfig.findMany({
      where: { organizationId: orgId },
      orderBy: { roomSize: "asc" },
    }),
    getDraft(orgId),
  ]);

  const draftConfigs = draft ? parseRoomConfigs(draft.roomConfigs) : null;
  if (draftConfigs != null && draftConfigs.length > 0) {
    return NextResponse.json(withDraftIds(draftConfigs));
  }
  return NextResponse.json(liveConfigs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;

  try {
    const { roomSize, totalRooms } = await req.json();

    const size = parseInt(roomSize, 10);
    const total = parseInt(totalRooms, 10);
    if (!roomSize || !totalRooms || size < 2 || total < 1) {
      return NextResponse.json(
        { error: "Room size (min 2) and total rooms (min 1) are required" },
        { status: 400 }
      );
    }

    if (!isDraftAvailable()) {
      const existing = await db.roomConfig.findFirst({
        where: { organizationId: orgId, roomSize: size },
      });
      if (existing) {
        const updated = await db.roomConfig.update({
          where: { id: existing.id },
          data: { totalRooms: total },
        });
        return NextResponse.json(updated, { status: 200 });
      }
      const config = await db.roomConfig.create({
        data: { organizationId: orgId, roomSize: size, totalRooms: total },
      });
      return NextResponse.json(config, { status: 201 });
    }

    const [liveConfigs, draft] = await Promise.all([
      db.roomConfig.findMany({ where: { organizationId: orgId }, orderBy: { roomSize: "asc" } }),
      getDraft(orgId),
    ]);

    let list: DraftRoomConfig[] =
      draft && parseRoomConfigs(draft.roomConfigs)?.length
        ? parseRoomConfigs(draft.roomConfigs)!
        : liveConfigs.map((rc) => ({ roomSize: rc.roomSize, totalRooms: rc.totalRooms }));

    const idx = list.findIndex((r) => r.roomSize === size);
    if (idx >= 0) {
      list[idx] = { roomSize: size, totalRooms: total };
    } else {
      list.push({ roomSize: size, totalRooms: total });
      list.sort((a, b) => a.roomSize - b.roomSize);
    }

    await upsertDraft(orgId, { roomConfigs: JSON.stringify(list) });

    return NextResponse.json(
      { id: `draft-${size}`, roomSize: size, totalRooms: total },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to save room config" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Config ID required" }, { status: 400 });
  }

  if (!isDraftAvailable()) {
    const config = await db.roomConfig.findFirst({ where: { id, organizationId: orgId } });
    if (!config) return NextResponse.json({ error: "Config not found" }, { status: 404 });
    await db.roomConfig.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  if (id.startsWith("draft-")) {
    const roomSize = parseInt(id.replace("draft-", ""), 10);
    if (Number.isNaN(roomSize)) {
      return NextResponse.json({ error: "Invalid draft id" }, { status: 400 });
    }
    const draft = await getDraft(orgId);
    const list = draft ? parseRoomConfigs(draft.roomConfigs) ?? [] : [];
    const liveConfigs = await db.roomConfig.findMany({
      where: { organizationId: orgId },
      orderBy: { roomSize: "asc" },
    });
    const currentList = list.length > 0 ? list : liveConfigs.map((r) => ({ roomSize: r.roomSize, totalRooms: r.totalRooms }));
    const nextList = currentList.filter((r) => r.roomSize !== roomSize);
    await upsertDraft(orgId, { roomConfigs: JSON.stringify(nextList) });
    return NextResponse.json({ success: true });
  }

  const config = await db.roomConfig.findFirst({ where: { id, organizationId: orgId } });
  if (!config) {
    return NextResponse.json({ error: "Config not found" }, { status: 404 });
  }

  const draft = await getDraft(orgId);
  const list = draft ? parseRoomConfigs(draft.roomConfigs) : null;
  if (list != null && list.length > 0) {
    const nextList = list.filter((r) => r.roomSize !== config.roomSize);
    await upsertDraft(orgId, { roomConfigs: JSON.stringify(nextList) });
  } else {
    await db.roomConfig.delete({ where: { id } });
  }
  return NextResponse.json({ success: true });
}
