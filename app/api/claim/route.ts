import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { email, claimToken, password, orgSlug } = await req.json();

    if (!email || !claimToken || !password || !orgSlug) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const org = await db.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const student = await db.student.findFirst({
      where: {
        email,
        organizationId: org.id,
        claimToken,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "No matching profile found. Check your email and claim token." },
        { status: 404 }
      );
    }

    if (student.claimed) {
      return NextResponse.json(
        { error: "This profile has already been claimed." },
        { status: 409 }
      );
    }

    await db.student.update({
      where: { id: student.id },
      data: {
        claimed: true,
        passwordHash: hashPassword(password),
      },
    });

    return NextResponse.json({
      message: "Profile claimed successfully! You can now log in.",
      studentName: student.name,
    });
  } catch {
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
