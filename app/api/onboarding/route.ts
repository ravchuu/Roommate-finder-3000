import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = await db.student.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      age: true,
      gender: true,
      email: true,
      nickname: true,
      phone: true,
      personalEmail: true,
      preferPersonalEmail: true,
      preferredRoomSizes: true,
      onboardingComplete: true,
      surveyResponse: { select: { answers: true } },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const configs = await db.roomConfig.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { roomSize: "asc" },
  });

  const roomAvailability = await Promise.all(
    configs.map(async (config) => {
      const reservedGroups = await db.group.count({
        where: {
          reservedRoomConfigId: config.id,
          status: { in: ["reserved", "locked"] },
        },
      });
      // Beds taken/claimed: groups that reserved this config OR unreserved groups targeting this room size
      const bedsTaken = await db.groupMember.count({
        where: {
          group: {
            organizationId: session.user.organizationId,
            OR: [
              { reservedRoomConfigId: config.id },
              {
                targetRoomSize: config.roomSize,
                reservedRoomConfigId: null,
              },
            ],
          },
        },
      });
      const totalBeds = config.roomSize * config.totalRooms;
      const bedsRemaining = Math.max(0, totalBeds - bedsTaken);
      return {
        roomSize: config.roomSize,
        totalRooms: config.totalRooms,
        roomsFormed: reservedGroups,
        bedsRemaining,
        available: bedsRemaining > 0,
      };
    })
  );

  return NextResponse.json({
    student: {
      name: student.name,
      age: student.age,
      gender: student.gender,
      email: student.email,
      nickname: student.nickname,
      phone: student.phone,
      personalEmail: student.personalEmail,
      preferPersonalEmail: student.preferPersonalEmail,
      preferredRoomSizes: student.preferredRoomSizes
        ? JSON.parse(student.preferredRoomSizes)
        : [],
      onboardingComplete: student.onboardingComplete,
    },
    surveyAnswers: student.surveyResponse
      ? JSON.parse(student.surveyResponse.answers)
      : null,
    roomAvailability,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { step } = body;

  if (step === 1) {
    const { nickname, phone, personalEmail, preferPersonalEmail } = body;
    await db.student.update({
      where: { id: session.user.id },
      data: {
        nickname: nickname || null,
        phone: phone || null,
        personalEmail: personalEmail || null,
        preferPersonalEmail: !!preferPersonalEmail,
      },
    });
    return NextResponse.json({ success: true });
  }

  if (step === 2) {
    const { roomSizes } = body;
    if (!Array.isArray(roomSizes) || roomSizes.length === 0) {
      return NextResponse.json({ error: "Select at least one room size" }, { status: 400 });
    }
    const configs = await db.roomConfig.findMany({
      where: { organizationId: session.user.organizationId },
      select: { roomSize: true },
    });
    const validSizes = configs.map((c) => c.roomSize);
    const filtered = roomSizes.filter((s: number) => validSizes.includes(s));
    if (filtered.length === 0) {
      return NextResponse.json({ error: "Invalid room sizes" }, { status: 400 });
    }
    await db.student.update({
      where: { id: session.user.id },
      data: { preferredRoomSizes: JSON.stringify(filtered) },
    });
    return NextResponse.json({ success: true });
  }

  if (step === 3) {
    const { answers, bigFiveScores } = body;
    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Invalid survey data" }, { status: 400 });
    }
    const bigFive =
      bigFiveScores &&
      typeof bigFiveScores === "object" &&
      ["O", "C", "E", "A", "N"].every((k) => typeof bigFiveScores[k] === "number")
        ? bigFiveScores
        : null;

    await db.surveyResponse.upsert({
      where: { studentId: session.user.id },
      create: { studentId: session.user.id, answers: JSON.stringify(answers) },
      update: { answers: JSON.stringify(answers) },
    });
    await db.student.update({
      where: { id: session.user.id },
      data: {
        onboardingComplete: true,
        ...(bigFive ? { bigFiveScores: JSON.stringify(bigFive) } : {}),
      },
    });
    // Default match weights so compatibility works (same keys as seed)
    const TRAIT_KEYS = [
      "sleepBedtime", "sleepWake", "cleanliness", "guestFrequency", "noiseTolerance",
      "spaceUsage", "roommateRelationship", "conflictStyle", "roomSizePreference",
    ];
    for (const traitKey of TRAIT_KEYS) {
      await db.matchWeight.upsert({
        where: {
          studentId_traitKey: { studentId: session.user.id, traitKey },
        },
        create: { studentId: session.user.id, traitKey, weight: 1.0 },
        update: {},
      });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid step" }, { status: 400 });
}
