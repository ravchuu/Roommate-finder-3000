import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDraft, parsePendingStudents, upsertDraft, isDraftAvailable, type PendingStudentAdd } from "@/lib/draft";

type BulkRow = { name: string; email: string; age?: number | null; gender?: string | null };

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;

  try {
    const { students: rows } = (await req.json()) as { students: BulkRow[] };

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Body must include a non-empty 'students' array with { name, email } per row" },
        { status: 400 }
      );
    }

    if (!isDraftAvailable()) {
      let created = 0;
      let updated = 0;
      const errors: string[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const name = typeof row?.name === "string" ? row.name.trim() : "";
        const email = typeof row?.email === "string" ? row.email.trim().toLowerCase() : "";
        if (!name || !email) {
          errors.push(`Row ${i + 1}: name and email are required`);
          continue;
        }
        const age = row.age != null ? (typeof row.age === "number" ? row.age : parseInt(String(row.age), 10)) : null;
        const gender = typeof row?.gender === "string" ? row.gender.trim() || null : null;
        const existing = await db.student.findFirst({ where: { email, organizationId: orgId } });
        if (existing) {
          await db.student.update({
            where: { id: existing.id },
            data: { name, age: Number.isNaN(age!) ? null : age, gender },
          });
          updated++;
        } else {
          await db.student.create({
            data: {
              organizationId: orgId,
              name,
              email,
              age: age != null && !Number.isNaN(age) ? age : null,
              gender,
            },
          });
          created++;
        }
      }
      return NextResponse.json({ created, updated, total: rows.length, errors: errors.length > 0 ? errors : undefined });
    }

    const [liveStudents, draft] = await Promise.all([
      db.student.findMany({ where: { organizationId: orgId }, select: { email: true } }),
      getDraft(orgId),
    ]);

    const liveEmails = new Set(liveStudents.map((s) => s.email.toLowerCase()));
    let pendingAdds: PendingStudentAdd[] = draft ? parsePendingStudents(draft.pendingStudentAdds) : [];
    const pendingEmails = new Set(pendingAdds.map((p) => (p.email || "").toLowerCase()));

    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = typeof row?.name === "string" ? row.name.trim() : "";
      const email = typeof row?.email === "string" ? row.email.trim().toLowerCase() : "";

      if (!name || !email) {
        errors.push(`Row ${i + 1}: name and email are required`);
        continue;
      }

      const age = row.age != null ? (typeof row.age === "number" ? row.age : parseInt(String(row.age), 10)) : null;
      const gender = typeof row?.gender === "string" ? row.gender.trim() || null : null;

      if (liveEmails.has(email)) continue;
      if (pendingEmails.has(email)) continue;

      pendingAdds.push({ name, email, age: Number.isNaN(age!) ? null : age, gender });
      pendingEmails.add(email);
      created++;
    }

    await upsertDraft(orgId, { pendingStudentAdds: JSON.stringify(pendingAdds) });

    return NextResponse.json({
      created,
      updated: 0,
      total: rows.length,
      errors: errors.length > 0 ? errors : undefined,
      message: "Added to pending changes. Go live to apply.",
    });
  } catch (e) {
    console.error("Bulk students error:", e);
    return NextResponse.json(
      { error: "Failed to process roster" },
      { status: 500 }
    );
  }
}
