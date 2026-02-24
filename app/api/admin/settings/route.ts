import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDraft, parseSettings, upsertDraft, isDraftAvailable } from "@/lib/draft";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;

  const [org, draft] = await Promise.all([
    db.organization.findUnique({
      where: { id: orgId },
      select: { name: true, slug: true, deadline: true, housingType: true },
    }),
    getDraft(orgId),
  ]);

  const draftSettings = draft ? parseSettings(draft.settings) : null;
  const base = org
    ? {
        name: org.name,
        slug: org.slug,
        deadline: org.deadline,
        housingType: org.housingType,
      }
    : { name: "", slug: "", deadline: null, housingType: "coed" };

  if (draftSettings) {
    if (draftSettings.name !== undefined) base.name = draftSettings.name;
    if (draftSettings.deadline !== undefined) base.deadline = draftSettings.deadline ? new Date(draftSettings.deadline) : null;
    if (draftSettings.housingType !== undefined) base.housingType = draftSettings.housingType;
  }

  return NextResponse.json(base);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;

  try {
    const { name, deadline, housingType } = await req.json();

    const draftSettings: { name?: string; deadline?: string | null; housingType?: string } = {};
    if (name !== undefined) draftSettings.name = name;
    if (deadline !== undefined) draftSettings.deadline = deadline ? String(deadline) : null;
    if (housingType !== undefined && ["coed", "single_gender"].includes(housingType)) {
      draftSettings.housingType = housingType;
    }

    const org = await db.organization.findUnique({
      where: { id: orgId },
      select: { name: true, deadline: true, housingType: true },
    });

    const merged = {
      name: draftSettings.name ?? org?.name ?? "",
      deadline: draftSettings.deadline ?? (org?.deadline ? org.deadline.toISOString() : null),
      housingType: draftSettings.housingType ?? org?.housingType ?? "coed",
    };

    if (!isDraftAvailable()) {
      const data: { name?: string; deadline?: Date | null; housingType?: string } = {};
      if (merged.name !== undefined) data.name = merged.name;
      if (merged.deadline !== undefined) data.deadline = merged.deadline ? new Date(merged.deadline) : null;
      if (merged.housingType !== undefined) data.housingType = merged.housingType;
      await db.organization.update({ where: { id: orgId }, data });
      return NextResponse.json({
        name: merged.name,
        deadline: merged.deadline ? new Date(merged.deadline) : null,
        housingType: merged.housingType,
      });
    }

    await upsertDraft(orgId, { settings: JSON.stringify(merged) });

    return NextResponse.json({
      name: merged.name,
      deadline: merged.deadline ? new Date(merged.deadline) : null,
      housingType: merged.housingType,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
