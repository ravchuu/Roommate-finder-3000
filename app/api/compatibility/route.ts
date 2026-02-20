import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeCompatibilityWithBreakdown, type BigFiveScores } from "@/lib/compatibility";
import { generateTags } from "@/lib/tags";
import type { SurveyAnswers } from "@/lib/survey-questions";

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [currentStudent, org] = await Promise.all([
      db.student.findUnique({
        where: { id: session.user.id },
        include: { surveyResponse: true, matchWeights: true },
      }),
      db.organization.findUnique({
        where: { id: session.user.organizationId },
        select: { housingType: true },
      }),
    ]);

    if (!currentStudent) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const myAnswers: SurveyAnswers = safeJsonParse(
      currentStudent.surveyResponse?.answers ?? null,
      {}
    );
    const rawBigFive = safeJsonParse<unknown>(currentStudent.bigFiveScores, null);
    const myBigFive: BigFiveScores | null =
      rawBigFive &&
      typeof rawBigFive === "object" &&
      "O" in rawBigFive &&
      "C" in rawBigFive &&
      "E" in rawBigFive &&
      "A" in rawBigFive &&
      "N" in rawBigFive
        ? (rawBigFive as BigFiveScores)
        : null;

    const myWeights = currentStudent.matchWeights.reduce(
      (acc, w) => ({ ...acc, [w.traitKey]: w.weight }),
      {} as Record<string, number>
    );

    const currentGroup = await db.groupMember.findUnique({
      where: { studentId: session.user.id },
    });

    const where: {
      organizationId: string;
      claimed: boolean;
      id: { not: string };
      gender?: string;
    } = {
      organizationId: session.user.organizationId,
      claimed: true,
      id: { not: session.user.id },
    };

    if (org?.housingType === "single_gender" && currentStudent.gender) {
      where.gender = currentStudent.gender;
    }

    const otherStudents = await db.student.findMany({
      where,
      include: { surveyResponse: true, groupMemberships: true },
    });

    const matches = otherStudents
      .map((student) => {
        const theirAnswers: SurveyAnswers = safeJsonParse(
          student.surveyResponse?.answers ?? null,
          {}
        );
        const rawTheirBigFive = safeJsonParse<unknown>(student.bigFiveScores ?? null, null);
        const theirBigFive: BigFiveScores | null =
          rawTheirBigFive &&
          typeof rawTheirBigFive === "object" &&
          "O" in rawTheirBigFive &&
          "C" in rawTheirBigFive &&
          "E" in rawTheirBigFive &&
          "A" in rawTheirBigFive &&
          "N" in rawTheirBigFive
            ? (rawTheirBigFive as BigFiveScores)
            : null;
        let preferredRoomSizes = safeJsonParse<number[]>(
          student.preferredRoomSizes,
          []
        );
        if (!Array.isArray(preferredRoomSizes)) {
          preferredRoomSizes = [];
        }

        const result = computeCompatibilityWithBreakdown(
          myAnswers,
          theirAnswers,
          myWeights,
          myBigFive,
          theirBigFive
        );

        let tags: { label: string; color: string }[] = [];
        try {
          tags = generateTags(theirAnswers);
        } catch {
          tags = [];
        }

        const inGroup = student.groupMemberships.length > 0;

        return {
          id: student.id,
          name: student.name,
          age: student.age,
          gender: student.gender,
          bio: student.bio,
          photo: student.photo,
          preferredRoomSizes: Array.isArray(preferredRoomSizes) ? preferredRoomSizes : [],
          compatibility: result.score,
          explanation: result.explanation,
          tags,
          hasSurvey: !!student.surveyResponse,
          inGroup,
        };
      })
      .sort((a, b) => b.compatibility - a.compatibility);

    return NextResponse.json({
      matches,
      myAnswers,
      hasGroup: !!currentGroup,
      // Hint for empty state: why there might be no matches
      emptyReason:
        otherStudents.length === 0
          ? org?.housingType === "single_gender" && currentStudent.gender
            ? "single_gender"
            : "no_other_students"
          : undefined,
    });
  } catch (err) {
    console.error("[compatibility] GET error:", err);
    return NextResponse.json(
      { error: "Failed to load matches", matches: [], myAnswers: {}, hasGroup: false },
      { status: 500 }
    );
  }
}
