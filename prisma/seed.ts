import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Load DATABASE_URL and resolve to one absolute path so seed and app always use the same DB
function loadEnv() {
  const root = process.cwd();
  for (const file of [".env.local", ".env"]) {
    const envPath = join(root, file);
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const match = line.match(/^\s*([^#=]+)=(.*)$/);
        if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
      }
      break;
    }
  }
  const url = process.env.DATABASE_URL || "file:./dev.db";
  let absoluteDbPath: string;
  if (url.startsWith("file:./") || url.startsWith("file:../") || url === "file:./dev.db") {
    const rel = url.replace(/^file:/, "").replace(/^\.\//, "");
    const resolved = join(root, "prisma", rel === "dev.db" ? "dev.db" : rel);
    absoluteDbPath = resolved.replace(/\\/g, "/");
    process.env.DATABASE_URL = "file:" + absoluteDbPath;
  } else {
    absoluteDbPath = url.replace(/^file:/, "").replace(/\\/g, "/");
  }
  return absoluteDbPath;
}
const SEED_DB_PATH = loadEnv();

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

const SURVEY_PRESETS = [
  { sleepBedtime: "8-10pm", sleepWake: "5-7am", cleanliness: "5", guestFrequency: "rarely", noiseTolerance: "low", spaceUsage: "mostly-room", roommateRelationship: "friendly-independent", conflictStyle: "direct" },
  { sleepBedtime: "10-12am", sleepWake: "7-9am", cleanliness: "4", guestFrequency: "sometimes", noiseTolerance: "moderate", spaceUsage: "mix", roommateRelationship: "hang-out-sometimes", conflictStyle: "hints" },
  { sleepBedtime: "10-12am", sleepWake: "7-9am", cleanliness: "3", guestFrequency: "sometimes", noiseTolerance: "moderate", spaceUsage: "mix", roommateRelationship: "friendly-independent", conflictStyle: "let-go" },
  { sleepBedtime: "12-2am", sleepWake: "9-11am", cleanliness: "2", guestFrequency: "often", noiseTolerance: "high", spaceUsage: "mostly-common", roommateRelationship: "good-friends", conflictStyle: "direct" },
  { sleepBedtime: "12-2am", sleepWake: "9-11am", cleanliness: "3", guestFrequency: "often", noiseTolerance: "any", spaceUsage: "mostly-room", roommateRelationship: "hang-out-sometimes", conflictStyle: "avoid" },
  { sleepBedtime: "8-10pm", sleepWake: "5-7am", cleanliness: "4", guestFrequency: "rarely", noiseTolerance: "low", spaceUsage: "mostly-room", roommateRelationship: "keep-to-ourselves", conflictStyle: "hints" },
  { sleepBedtime: "10-12am", sleepWake: "7-9am", cleanliness: "5", guestFrequency: "rarely", noiseTolerance: "low", spaceUsage: "always-room", roommateRelationship: "friendly-independent", conflictStyle: "let-go" },
  { sleepBedtime: "10-12am", sleepWake: "9-11am", cleanliness: "3", guestFrequency: "sometimes", noiseTolerance: "moderate", spaceUsage: "mix", roommateRelationship: "good-friends", conflictStyle: "depends" },
  { sleepBedtime: "12-2am", sleepWake: "9-11am", cleanliness: "4", guestFrequency: "sometimes", noiseTolerance: "moderate", spaceUsage: "mostly-common", roommateRelationship: "hang-out-sometimes", conflictStyle: "direct" },
  { sleepBedtime: "8-10pm", sleepWake: "5-7am", cleanliness: "5", guestFrequency: "never", noiseTolerance: "silent", spaceUsage: "always-room", roommateRelationship: "keep-to-ourselves", conflictStyle: "avoid" },
];

// Big Five: O, C, E, A, N (0–100). Variety for realistic compatibility spread.
const BIG_FIVE_PRESETS: { O: number; C: number; E: number; A: number; N: number }[] = [
  { O: 72, C: 65, E: 55, A: 78, N: 35 },
  { O: 80, C: 50, E: 70, A: 65, N: 45 },
  { O: 60, C: 70, E: 45, A: 72, N: 40 },
  { O: 85, C: 45, E: 82, A: 60, N: 55 },
  { O: 78, C: 55, E: 65, A: 68, N: 50 },
  { O: 65, C: 78, E: 48, A: 82, N: 30 },
  { O: 58, C: 82, E: 42, A: 75, N: 38 },
  { O: 82, C: 52, E: 58, A: 70, N: 42 },
  { O: 70, C: 68, E: 72, A: 65, N: 48 },
  { O: 68, C: 72, E: 50, A: 80, N: 28 },
  { O: 75, C: 60, E: 62, A: 70, N: 45 },
  { O: 62, C: 75, E: 55, A: 76, N: 32 },
];

const TRAIT_KEYS = ["sleepBedtime", "sleepWake", "cleanliness", "guestFrequency", "noiseTolerance", "spaceUsage", "roommateRelationship", "conflictStyle", "roomSizePreference"];

// First names (mix) and last names for generating ~100 students
const FIRST_NAMES = [
  "Alex", "Brianna", "Carlos", "Diana", "Ethan", "Fatima", "Gabriel", "Hannah", "Isaac", "Julia",
  "Kevin", "Luna", "Marcus", "Nadia", "Omar", "Priya", "Ryan", "Sofia", "Tyler", "Valentina",
  "William", "Yuki", "Zara", "Daniel", "Emma", "Noah", "Olivia", "Liam", "Ava", "Mason",
  "Sophia", "James", "Isabella", "Benjamin", "Mia", "Lucas", "Charlotte", "Henry", "Amelia", "Alexander",
  "Harper", "Ethan", "Evelyn", "Sebastian", "Abigail", "Jack", "Emily", "Aiden", "Elizabeth", "Owen",
  "Sofia", "Samuel", "Avery", "Joseph", "Ella", "Levi", "Scarlett", "Mateo", "Grace", "David",
  "Chloe", "John", "Victoria", "Luke", "Riley", "Anthony", "Aria", "Isaac", "Lily", "Dylan",
  "Aurora", "Leo", "Zoey", "Lincoln", "Penelope", "Jaxon", "Layla", "Asher", "Nora", "Christopher",
  "Camila", "Josiah", "Hannah", "Andrew", "Lillian", "Theodore", "Addison", "Caleb", "Eleanor", "Nathan",
];
const LAST_NAMES = [
  "Chen", "Foster", "Ramirez", "Park", "Okafor", "Al-Hassan", "Torres", "Kim", "Nguyen", "Andersson",
  "Zhao", "Patel", "Johnson", "Kowalski", "Diallo", "Sharma", "OBrien", "Rossi", "Washington", "Cruz",
  "Chang", "Tanaka", "Ahmed", "Lee", "Martinez", "Garcia", "Smith", "Williams", "Brown", "Jones",
  "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris",
  "Martin", "Thompson", "Robinson", "Clark", "Lewis", "Walker", "Hall", "Allen", "Young", "King",
  "Wright", "Scott", "Green", "Baker", "Adams", "Nelson", "Hill", "Campbell", "Mitchell", "Roberts",
  "Turner", "Phillips", "Evans", "Parker", "Edwards", "Collins", "Stewart", "Morris", "Murphy", "Cook",
  "Rogers", "Morgan", "Peterson", "Cooper", "Reed", "Bailey", "Bell", "Gomez", "Kelly", "Howard",
  "Ward", "Cox", "Diaz", "Richardson", "Wood", "Watson", "Brooks", "Bennett", "Gray", "James",
];

function generateStudentsData(count: number): { name: string; age: number; gender: string; email: string }[] {
  const usedEmails = new Set<string>();
  const result: { name: string; age: number; gender: string; email: string }[] = [];
  let idx = 0;
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[idx % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(idx / FIRST_NAMES.length) % LAST_NAMES.length];
    idx++;
    const name = `${first} ${last}`;
    const emailBase = `${first.toLowerCase().replace(/'/g, "")}.${last.toLowerCase()}@university.edu`;
    let email = emailBase;
    let suffix = 0;
    while (usedEmails.has(email)) {
      suffix++;
      email = emailBase.replace("@", `+${suffix}@`);
    }
    usedEmails.add(email);
    result.push({
      name,
      age: 17 + (i % 5),
      gender: i % 2 === 0 ? "Male" : "Female",
      email,
    });
  }
  return result;
}

const STUDENTS_DATA = generateStudentsData(100);

const BIOS = [
  "Love hiking and early morning coffee. Looking for a chill roommate!",
  "Music lover and aspiring journalist. Neat freak but super friendly.",
  "CS major who games at night. Quiet during the day, social on weekends.",
  "Pre-med student who studies a lot. I keep things tidy and organized.",
  "Basketball player and film buff. Easy-going and respectful of space.",
  "Art student who paints late. I'm quiet but love deep conversations.",
  "Engineering major. I code, cook, and keep the space clean.",
  "Psychology student who loves board games. Early bird and tea addict.",
  "Business major. Social butterfly but respectful of quiet hours.",
  "Bookworm and yoga enthusiast. I value peace and a clean space.",
  "Physics nerd who loves sci-fi. Night owl but wear headphones.",
  "Dance major and morning person. Organized and always up for a chat.",
  "History buff and podcast addict. Chill vibes, moderate cleanliness.",
  "Nursing student. Irregular schedule but very considerate roommate.",
  "Soccer player and foodie. I cook a lot and share with roommates!",
  "Chemistry major. Studious during the week, adventurous on weekends.",
  "Music production major. I use headphones! Tidy and respectful.",
  "Theater kid and social person. Clean, organized, and love hosting small gatherings.",
  "Environmental science major. Minimalist lifestyle, early riser.",
  "Graphic design student. Creative mess but always clean common areas.",
  "Math major who loves puzzles. Quiet, organized, and low-maintenance.",
  "Language student who speaks 3 languages. Flexible schedule, very tidy.",
  "Biology major and gym regular. Morning person, neat, and friendly.",
  "Economics student. Night owl, coffee lover, and always studying.",
];

async function main() {
  console.log("Seeding database...");

  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.endorsement.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.mergeRequest.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.roommateRequest.deleteMany();
  await prisma.matchWeight.deleteMany();
  await prisma.surveyResponse.deleteMany();
  await prisma.student.deleteMany();
  await prisma.roomConfig.deleteMany();
  await prisma.organization.deleteMany();

  const org = await prisma.organization.create({
    data: {
      name: "Demo — Westfield University",
      slug: "westfield",
      adminEmail: "demo.admin@westfield.edu",
      adminPasswordHash: hashPassword("admin123"),
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`Created organization: ${org.name}`);

  const roomConfigs = await Promise.all([
    prisma.roomConfig.create({
      data: {
        organizationId: org.id,
        roomSize: 2,
        totalRooms: 25,
        reservationThresholdPercent: 0.5,
        gracePeriodHours: 24,
      },
    }),
    prisma.roomConfig.create({
      data: {
        organizationId: org.id,
        roomSize: 4,
        totalRooms: 10,
        reservationThresholdPercent: 0.5,
        gracePeriodHours: 24,
      },
    }),
    prisma.roomConfig.create({
      data: {
        organizationId: org.id,
        roomSize: 6,
        totalRooms: 3,
        reservationThresholdPercent: 0.5,
        gracePeriodHours: 24,
      },
    }),
  ]);

  console.log(`Created ${roomConfigs.length} room configurations`);

  const allSizes = [2, 4, 6];
  const sizePresets = [
    [2], [4], [6], [2, 4], [4, 6], [2, 6], [2, 4, 6], [2], [4], [2, 4], [4, 6], [2, 4, 6],
  ];
  const students: { id: string }[] = [];

  // Claim and fully set up all students so you can log in as any and see a full roster of matches
  for (let i = 0; i < STUDENTS_DATA.length; i++) {
    const data = STUDENTS_DATA[i];
    const isClaimed = true;
    const surveyPreset = SURVEY_PRESETS[i % SURVEY_PRESETS.length];
    const bigFive = BIG_FIVE_PRESETS[i % BIG_FIVE_PRESETS.length];
    const student = await prisma.student.create({
      data: {
        organizationId: org.id,
        name: data.name,
        age: data.age,
        gender: data.gender,
        email: data.email,
        claimed: isClaimed,
        passwordHash: isClaimed ? hashPassword("student123") : null,
        preferredRoomSizes: isClaimed ? JSON.stringify(sizePresets[i % sizePresets.length]) : null,
        bigFiveScores: bigFive ? JSON.stringify(bigFive) : null,
        bio: isClaimed ? BIOS[i % BIOS.length] : null,
        onboardingComplete: isClaimed,
      },
    });

    if (isClaimed) {
      await prisma.surveyResponse.create({
        data: {
          studentId: student.id,
          answers: JSON.stringify(surveyPreset),
        },
      });
      for (const traitKey of TRAIT_KEYS) {
        await prisma.matchWeight.create({
          data: {
            studentId: student.id,
            traitKey,
            weight: 1.0,
          },
        });
      }
    }

    students.push(student);
  }

  // Demo student for grading: unclaimed so evaluator can claim → onboarding → dashboard. 2 roommate requests seeded for context.
  const DEMO_CLAIM_TOKEN = "demo-claim-token";
  const onboardingDemoStudent = await prisma.student.create({
    data: {
      organizationId: org.id,
      name: "Demo Student",
      age: 19,
      gender: "Female",
      email: "demo.student@westfield.edu",
      claimed: false,
      passwordHash: null,
      claimToken: DEMO_CLAIM_TOKEN,
      preferredRoomSizes: null,
      bigFiveScores: null,
      bio: null,
      onboardingComplete: false,
    },
  });

  console.log(`Created ${students.length} students (all claimed with survey + Big Five + match weights)`);
  console.log(`Created Demo Student (unclaimed): demo.student@westfield.edu — claim token: ${DEMO_CLAIM_TOKEN}`);

  // Assign most students to groups so admin rooming page looks populated (~90 roomed, ~10 unassigned)
  const numUnassigned = Math.min(12, Math.max(8, Math.floor(students.length * 0.1)));
  const numToRoom = students.length - numUnassigned;
  const groupSizes: number[] = []; // e.g. [2,2,2,4,4,6,...]
  let remaining = numToRoom;
  while (remaining >= 6) {
    groupSizes.push(6);
    remaining -= 6;
  }
  while (remaining >= 4) {
    groupSizes.push(4);
    remaining -= 4;
  }
  while (remaining >= 2) {
    groupSizes.push(2);
    remaining -= 2;
  }
  if (remaining === 1) {
    groupSizes[groupSizes.length - 1]! += 1;
  }
  const config2 = roomConfigs.find((c) => c.roomSize === 2);
  const config4 = roomConfigs.find((c) => c.roomSize === 4);
  const config6 = roomConfigs.find((c) => c.roomSize === 6);
  let studentIdx = 0;
  for (const size of groupSizes) {
    const memberIds = students.slice(studentIdx, studentIdx + size).map((s) => s.id);
    studentIdx += size;
    if (memberIds.length === 0) continue;
    const config = size <= 2 ? config2 : size <= 4 ? config4 : config6;
    await prisma.group.create({
      data: {
        organizationId: org.id,
        targetRoomSize: size,
        leaderId: memberIds[0],
        status: "unreserved",
        reservedRoomConfigId: config?.id ?? null,
        members: {
          create: memberIds.map((studentId) => ({ studentId })),
        },
      },
    });
  }
  console.log(`Created ${groupSizes.length} groups; ${numToRoom} students roomed, ${numUnassigned} unassigned`);

  // 2 roommate requests TO the demo student (for grading: prof sees data consistency; Requests page shows sent requests)
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await prisma.roommateRequest.create({
    data: {
      fromStudentId: students[0]!.id,
      toStudentId: onboardingDemoStudent.id,
      status: "pending",
      expiresAt,
    },
  });
  await prisma.roommateRequest.create({
    data: {
      fromStudentId: students[1]!.id,
      toStudentId: onboardingDemoStudent.id,
      status: "pending",
      expiresAt,
    },
  });
  console.log("Created 2 pending roommate requests to Demo Student (from alex.chen, brianna.foster)");

  console.log("\n--- Demo credentials (for professors / evaluators) ---");
  console.log("Demo Admin: demo.admin@westfield.edu / admin123");
  console.log("Demo Student (claim first): org westfield, email demo.student@westfield.edu, claim token: " + DEMO_CLAIM_TOKEN + ", password student123");
  console.log("Other students: firstname.lastname@university.edu / student123 (org: westfield)");
  console.log("Org code: westfield");
  console.log("See DEMO.md and README for full grading flow.");
  console.log("------------------------\n");
  console.log("Database file:", SEED_DB_PATH);
  console.log("If the app says 'demo not found', put this in .env.local (same folder as package.json):");
  console.log('  DATABASE_URL="file:' + SEED_DB_PATH.replace(/\\/g, "/") + '"');
  console.log("Then restart the app (stop with Ctrl+C, run npm run dev again).\n");
  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
