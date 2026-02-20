import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { hashPassword } from "./hash";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "admin-login",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const org = await db.organization.findUnique({
          where: { adminEmail: email },
        });

        if (!org || org.adminPasswordHash !== hashPassword(password)) {
          return null;
        }

        return {
          id: org.id,
          email: org.adminEmail,
          name: org.name,
          role: "admin",
          organizationId: org.id,
        };
      },
    }),
    Credentials({
      id: "student-login",
      name: "Student",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        orgSlug: { label: "Organization", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        const orgSlug = credentials?.orgSlug as string;
        if (!email || !password || !orgSlug) return null;

        const org = await db.organization.findUnique({
          where: { slug: orgSlug },
        });
        if (!org) return null;

        const student = await db.student.findFirst({
          where: { email, organizationId: org.id, claimed: true },
        });

        if (
          !student ||
          !student.passwordHash ||
          student.passwordHash !== hashPassword(password)
        ) {
          return null;
        }

        return {
          id: student.id,
          email: student.email,
          name: student.name,
          role: "student",
          organizationId: org.id,
        };
      },
    }),
  ],
});
