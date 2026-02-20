import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const publicPaths = ["/", "/login", "/admin/login", "/claim", "/api/auth", "/api/claim"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublic) return NextResponse.next();

  const token = req.auth;

  if (!token) {
    const loginUrl = pathname.startsWith("/admin")
      ? new URL("/admin/login", req.url)
      : new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && token.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    token.user?.role === "admin"
  ) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
