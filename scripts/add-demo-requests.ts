/**
 * One-off script: add 2 new roommate requests TO the Demo Student
 * from two other students (Carlos Ramirez and Diana Park) so you can
 * see the "2 incoming requests" flow and the "You're now in a group" popup again.
 *
 * Run from project root: npx tsx scripts/add-demo-requests.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_STUDENT_EMAIL = "demo.student@westfield.edu";
const ORG_SLUG = "westfield";
// Two students who will send requests (different from Alex/Brianna so no unique constraint conflict)
const FROM_EMAILS = ["carlos.ramirez@university.edu", "diana.park@university.edu"];
const REQUEST_EXPIRY_HOURS = 48;

async function main() {
  const org = await prisma.organization.findUnique({
    where: { slug: ORG_SLUG },
  });
  if (!org) {
    console.error("Organization not found:", ORG_SLUG);
    process.exit(1);
  }

  const toStudent = await prisma.student.findFirst({
    where: { organizationId: org.id, email: DEMO_STUDENT_EMAIL },
  });
  if (!toStudent) {
    console.error("Demo student not found:", DEMO_STUDENT_EMAIL);
    process.exit(1);
  }

  const fromStudents = await prisma.student.findMany({
    where: {
      organizationId: org.id,
      email: { in: FROM_EMAILS },
      claimed: true,
    },
  });
  if (fromStudents.length < 2) {
    console.error(
      "Need 2 students to send from. Found:",
      fromStudents.map((s) => s.email)
    );
    process.exit(1);
  }

  const expiresAt = new Date(Date.now() + REQUEST_EXPIRY_HOURS * 60 * 60 * 1000);
  let created = 0;
  for (const from of fromStudents.slice(0, 2)) {
    const existing = await prisma.roommateRequest.findFirst({
      where: {
        fromStudentId: from.id,
        toStudentId: toStudent.id,
      },
    });
    if (existing) {
      console.log("Request already exists from", from.email, "-> skipping");
      continue;
    }
    await prisma.roommateRequest.create({
      data: {
        fromStudentId: from.id,
        toStudentId: toStudent.id,
        status: "pending",
        expiresAt,
      },
    });
    console.log("Created request from", from.name, "(", from.email, ") to Demo Student");
    created++;
  }
  console.log("\nDone. Created", created, "new request(s). Log in as Demo Student and open Requests to see them.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
