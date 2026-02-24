import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { applyDraftAndClear, hasDraftChanges, getDraft } from "@/lib/draft";

export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;
  const draft = await getDraft(orgId);

  if (!draft || !hasDraftChanges(draft)) {
    return NextResponse.json(
      { error: "No unpublished changes to apply." },
      { status: 400 }
    );
  }

  try {
    await applyDraftAndClear(orgId);
    return NextResponse.json({ success: true, message: "Changes are now live." });
  } catch (e) {
    console.error("Go live error:", e);
    return NextResponse.json(
      { error: "Failed to apply changes." },
      { status: 500 }
    );
  }
}
