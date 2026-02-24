import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDraft, parsePendingStudents, upsertDraft, isDraftAvailable, type PendingStudentAdd } from "@/lib/draft";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;

  const [liveStudents, draft] = await Promise.all([
    db.student.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        gender: true,
        claimed: true,
        claimToken: true,
        preferredRoomSizes: true,
        createdAt: true,
      },
    }),
    getDraft(orgId),
  ]);

  const pendingAdds = draft ? parsePendingStudents(draft.pendingStudentAdds) : [];
  const liveEmails = new Set(liveStudents.map((s) => s.email.toLowerCase()));
  const pending = pendingAdds
    .filter((p) => (p.email || "").trim() && !liveEmails.has((p.email || "").trim().toLowerCase()))
    .map((p, i) => ({
      id: `pending-${i}`,
      name: (p.name || "").trim(),
      email: (p.email || "").trim().toLowerCase(),
      age: p.age != null && !Number.isNaN(Number(p.age)) ? Number(p.age) : null,
      gender: typeof p.gender === "string" ? p.gender.trim() || null : null,
      claimed: false,
      claimToken: "",
      preferredRoomSizes: null,
      createdAt: new Date().toISOString(),
      isPending: true as const,
    }));

  const list = [...liveStudents.map((s) => ({ ...s, isPending: false as const })), ...pending];

  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;

  try {
    const { name, email, age, gender } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const emailNorm = (email as string).trim().toLowerCase();
    const nameTrim = (name as string).trim();

    const [existingLive, draft] = await Promise.all([
      db.student.findFirst({ where: { email: emailNorm, organizationId: orgId } }),
      getDraft(orgId),
    ]);

    if (existingLive) {
      return NextResponse.json(
        { error: "A student with this email already exists (live)." },
        { status: 409 }
      );
    }

    const pendingAdds: PendingStudentAdd[] = draft
      ? parsePendingStudents(draft.pendingStudentAdds)
      : [];
    if (pendingAdds.some((p) => (p.email || "").trim().toLowerCase() === emailNorm)) {
      return NextResponse.json(
        { error: "A student with this email is already in your pending list." },
        { status: 409 }
      );
    }

    if (!isDraftAvailable()) {
      const student = await db.student.create({
        data: {
          organizationId: orgId,
          name: nameTrim,
          email: emailNorm,
          age: age != null ? (typeof age === "number" ? age : parseInt(String(age), 10)) : null,
          gender: typeof gender === "string" ? gender.trim() || null : null,
        },
      });
      return NextResponse.json({ ...student, isPending: false }, { status: 201 });
    }

    pendingAdds.push({
      name: nameTrim,
      email: emailNorm,
      age: age != null ? (typeof age === "number" ? age : parseInt(String(age), 10)) : null,
      gender: typeof gender === "string" ? gender.trim() || null : null,
    });

    await upsertDraft(orgId, { pendingStudentAdds: JSON.stringify(pendingAdds) });

    return NextResponse.json(
      {
        id: `pending-${pendingAdds.length - 1}`,
        name: nameTrim,
        email: emailNorm,
        age: pendingAdds[pendingAdds.length - 1].age ?? null,
        gender: pendingAdds[pendingAdds.length - 1].gender ?? null,
        claimed: false,
        isPending: true,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to add student" }, { status: 500 });
  }
}
