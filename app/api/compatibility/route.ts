import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeCompatibility } from "@/lib/compatibility";
import { generateTags } from "@/lib/tags";
import type { SurveyAnswers } from "@/lib/survey-questions";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentStudent = await db.student.findUnique({
    where: { id: session.user.id },
    include: { surveyResponse: true, matchWeights: true },
  });

  if (!currentStudent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const myAnswers: SurveyAnswers = currentStudent.surveyResponse
    ? JSON.parse(currentStudent.surveyResponse.answers)
    : {};

  const myWeights = currentStudent.matchWeights.reduce(
    (acc, w) => ({ ...acc, [w.traitKey]: w.weight }),
    {} as Record<string, number>
  );

  const currentRoom = await db.roomMember.findUnique({
    where: { studentId: session.user.id },
  });

  const otherStudents = await db.student.findMany({
    where: {
      organizationId: session.user.organizationId,
      claimed: true,
      id: { not: session.user.id },
    },
    include: { surveyResponse: true, roomMemberships: true },
  });

  const matches = otherStudents
    .map((student) => {
      const theirAnswers: SurveyAnswers = student.surveyResponse
        ? JSON.parse(student.surveyResponse.answers)
        : {};

      const compatibility = computeCompatibility(
        myAnswers,
        theirAnswers,
        myWeights
      );

      const tags = generateTags(theirAnswers);
      const inRoom = student.roomMemberships.length > 0;

      return {
        id: student.id,
        name: student.name,
        age: student.age,
        gender: student.gender,
        bio: student.bio,
        photo: student.photo,
        preferredRoomSize: student.preferredRoomSize,
        compatibility,
        tags,
        hasSurvey: !!student.surveyResponse,
        inRoom,
      };
    })
    .sort((a, b) => b.compatibility - a.compatibility);

  return NextResponse.json({
    matches,
    myAnswers,
    hasRoom: !!currentRoom,
  });
}
