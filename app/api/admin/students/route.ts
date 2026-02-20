import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const students = await db.student.findMany({
    where: { organizationId: session.user.organizationId },
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
  });

  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, age, gender } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const existing = await db.student.findFirst({
      where: { email, organizationId: session.user.organizationId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A student with this email already exists" },
        { status: 409 }
      );
    }

    const student = await db.student.create({
      data: {
        organizationId: session.user.organizationId,
        name,
        email,
        age: age ? parseInt(age) : null,
        gender: gender || null,
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
