import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addEndorsement } from "@/lib/group";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, studentId } = await req.json();
  if (!groupId || !studentId) {
    return NextResponse.json({ error: "Group ID and student ID required" }, { status: 400 });
  }

  const result = await addEndorsement(groupId, studentId, session.user.id);

  if (!result) {
    return NextResponse.json(
      { error: "Cannot endorse (group locked, full, not a member, or student already in a group)" },
      { status: 409 }
    );
  }

  return NextResponse.json(result);
}
