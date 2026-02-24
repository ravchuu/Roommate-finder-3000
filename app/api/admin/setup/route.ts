import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/hash";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const slug = typeof body.slug === "string"
      ? body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")
      : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !slug || !email || !password) {
      return NextResponse.json(
        { error: "Organization name, code, admin email, and password are required." },
        { status: 400 }
      );
    }

    if (slug.length < 2) {
      return NextResponse.json(
        { error: "Organization code must be at least 2 characters (letters, numbers, hyphens)." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const [existingSlug, existingEmail] = await Promise.all([
      db.organization.findUnique({ where: { slug } }),
      db.organization.findUnique({ where: { adminEmail: email } }),
    ]);

    if (existingSlug) {
      return NextResponse.json(
        { error: "That organization code is already taken. Choose another." },
        { status: 409 }
      );
    }

    if (existingEmail) {
      return NextResponse.json(
        { error: "That email is already registered as an admin. Sign in instead." },
        { status: 409 }
      );
    }

    await db.organization.create({
      data: {
        name,
        slug,
        adminEmail: email,
        adminPasswordHash: hashPassword(password),
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Admin setup error:", e);
    return NextResponse.json(
      { error: "Failed to create organization." },
      { status: 500 }
    );
  }
}
