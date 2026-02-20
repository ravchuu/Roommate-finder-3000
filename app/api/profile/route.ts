import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = await db.student.findUnique({
    where: { id: session.user.id },
    include: {
      surveyResponse: true,
      matchWeights: true,
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: student.id,
    name: student.name,
    email: student.email,
    age: student.age,
    gender: student.gender,
    bio: student.bio,
    photo: student.photo,
    preferredRoomSize: student.preferredRoomSize,
    surveyAnswers: student.surveyResponse
      ? JSON.parse(student.surveyResponse.answers)
      : null,
    matchWeights: student.matchWeights.reduce(
      (acc, w) => ({ ...acc, [w.traitKey]: w.weight }),
      {} as Record<string, number>
    ),
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("photo") as File | null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `${session.user.id}.${ext}`;
      const uploadDir = join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(join(uploadDir, filename), buffer);

      await db.student.update({
        where: { id: session.user.id },
        data: { photo: `/uploads/${filename}` },
      });
    }

    return NextResponse.json({ success: true });
  }

  const body = await req.json();
  const { bio, matchWeights } = body;

  const updateData: Record<string, unknown> = {};
  if (bio !== undefined) updateData.bio = bio;

  if (Object.keys(updateData).length > 0) {
    await db.student.update({
      where: { id: session.user.id },
      data: updateData,
    });
  }

  if (matchWeights && typeof matchWeights === "object") {
    for (const [traitKey, weight] of Object.entries(matchWeights)) {
      await db.matchWeight.upsert({
        where: {
          studentId_traitKey: {
            studentId: session.user.id,
            traitKey,
          },
        },
        create: {
          studentId: session.user.id,
          traitKey,
          weight: weight as number,
        },
        update: {
          weight: weight as number,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}
