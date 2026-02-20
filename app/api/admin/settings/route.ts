import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await db.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { name: true, slug: true, deadline: true },
  });

  return NextResponse.json(org);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, deadline } = await req.json();

    const org = await db.organization.update({
      where: { id: session.user.organizationId },
      data: {
        name: name || undefined,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    return NextResponse.json(org);
  } catch {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
