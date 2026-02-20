import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await db.surveyResponse.findUnique({
    where: { studentId: session.user.id },
  });

  if (!response) {
    return NextResponse.json({ answers: null });
  }

  return NextResponse.json({ answers: JSON.parse(response.answers) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { answers } = await req.json();

  if (!answers || typeof answers !== "object") {
    return NextResponse.json(
      { error: "Invalid survey data" },
      { status: 400 }
    );
  }

  await db.surveyResponse.upsert({
    where: { studentId: session.user.id },
    create: {
      studentId: session.user.id,
      answers: JSON.stringify(answers),
    },
    update: {
      answers: JSON.stringify(answers),
    },
  });

  return NextResponse.json({ success: true });
}
