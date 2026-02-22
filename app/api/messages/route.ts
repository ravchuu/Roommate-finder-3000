import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** GET: list my DM conversations (other participant + last message preview). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myId = session.user.id;

  const memberships = await db.conversationMember.findMany({
    where: { studentId: myId },
    include: {
      conversation: {
        include: {
          members: { include: { student: { select: { id: true, name: true, photo: true } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const dmConvos = memberships
    .filter((m) => m.conversation.type === "dm")
    .map((m) => {
      const other = m.conversation.members.find((mb) => mb.studentId !== myId)?.student;
      const lastMsg = m.conversation.messages[0];
      return {
        conversationId: m.conversationId,
        otherStudent: other ? { id: other.id, name: other.name, photo: other.photo } : null,
        lastMessage: lastMsg
          ? { content: lastMsg.content, createdAt: lastMsg.createdAt, senderId: lastMsg.senderId }
          : null,
      };
    })
    .filter((c) => c.otherStudent)
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  return NextResponse.json({ conversations: dmConvos });
}

/** POST: get or create a DM with another student. Body: { otherStudentId }. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myId = session.user.id;

  // Use session org or fall back to current student's org (in case session token is stale)
  let organizationId = (session.user as { organizationId?: string }).organizationId;
  if (!organizationId) {
    const me = await db.student.findUnique({
      where: { id: myId },
      select: { organizationId: true },
    });
    if (!me) return NextResponse.json({ error: "Your account was not found" }, { status: 404 });
    organizationId = me.organizationId;
  }

  let body: { otherStudentId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const otherStudentId = body.otherStudentId;
  if (!otherStudentId || otherStudentId === myId) {
    return NextResponse.json({ error: "otherStudentId required and must differ from you" }, { status: 400 });
  }

  const other = await db.student.findFirst({
    where: { id: otherStudentId, organizationId },
    select: { id: true, name: true, photo: true },
  });
  if (!other) {
    return NextResponse.json({ error: "Student not found in your organization" }, { status: 404 });
  }

  const myMemberships = await db.conversationMember.findMany({
    where: { studentId: myId },
    include: {
      conversation: {
        include: { members: true },
      },
    },
  });

  const existing = myMemberships.find((m) => {
    const conv = m.conversation;
    if (!conv || conv.type !== "dm") return false;
    const memberIds = conv.members.map((mb) => mb.studentId);
    return memberIds.length === 2 && memberIds.includes(otherStudentId);
  });

  if (existing?.conversation) {
    return NextResponse.json({
      conversationId: existing.conversationId,
      otherStudent: { id: other.id, name: other.name, photo: other.photo },
    });
  }

  try {
    const conversation = await db.conversation.create({
      data: {
        type: "dm",
        members: {
          create: [
            { studentId: myId },
            { studentId: otherStudentId },
          ],
        },
      },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      otherStudent: { id: other.id, name: other.name, photo: other.photo },
    });
  } catch (err) {
    console.error("[messages] POST create conversation error:", err);
    return NextResponse.json(
      { error: "Failed to create conversation. Try again." },
      { status: 500 }
    );
  }
}
