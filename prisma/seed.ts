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

const TRAIT_KEYS = ["sleepBedtime", "sleepWake", "cleanliness", "guestFrequency", "noiseTolerance", "spaceUsage", "roommateRelationship", "conflictStyle"];

const STUDENTS_DATA = [
  { name: "Alex Chen", age: 19, gender: "Male", email: "alex.chen@university.edu" },
  { name: "Brianna Foster", age: 20, gender: "Female", email: "brianna.f@university.edu" },
  { name: "Carlos Ramirez", age: 18, gender: "Male", email: "c.ramirez@university.edu" },
  { name: "Diana Park", age: 19, gender: "Female", email: "d.park@university.edu" },
  { name: "Ethan Okafor", age: 21, gender: "Male", email: "e.okafor@university.edu" },
  { name: "Fatima Al-Hassan", age: 19, gender: "Female", email: "f.alhassan@university.edu" },
  { name: "Gabriel Torres", age: 20, gender: "Male", email: "g.torres@university.edu" },
  { name: "Hannah Kim", age: 18, gender: "Female", email: "h.kim@university.edu" },
  { name: "Isaac Nguyen", age: 19, gender: "Male", email: "i.nguyen@university.edu" },
  { name: "Julia Andersson", age: 20, gender: "Female", email: "j.andersson@university.edu" },
  { name: "Kevin Zhao", age: 18, gender: "Male", email: "k.zhao@university.edu" },
  { name: "Luna Patel", age: 19, gender: "Female", email: "l.patel@university.edu" },
  { name: "Marcus Johnson", age: 21, gender: "Male", email: "m.johnson@university.edu" },
  { name: "Nadia Kowalski", age: 20, gender: "Female", email: "n.kowalski@university.edu" },
  { name: "Omar Diallo", age: 19, gender: "Male", email: "o.diallo@university.edu" },
  { name: "Priya Sharma", age: 18, gender: "Female", email: "p.sharma@university.edu" },
  { name: "Ryan O'Brien", age: 20, gender: "Male", email: "r.obrien@university.edu" },
  { name: "Sofia Rossi", age: 19, gender: "Female", email: "s.rossi@university.edu" },
  { name: "Tyler Washington", age: 21, gender: "Male", email: "t.washington@university.edu" },
  { name: "Valentina Cruz", age: 18, gender: "Female", email: "v.cruz@university.edu" },
  { name: "William Chang", age: 19, gender: "Male", email: "w.chang@university.edu" },
  { name: "Yuki Tanaka", age: 20, gender: "Female", email: "y.tanaka@university.edu" },
  { name: "Zara Ahmed", age: 18, gender: "Female", email: "z.ahmed@university.edu" },
  { name: "Daniel Lee", age: 19, gender: "Male", email: "d.lee@university.edu" },
];

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
      name: "Westfield University",
      slug: "westfield",
      adminEmail: "admin@westfield.edu",
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
        totalRooms: 5,
        reservationThresholdPercent: 0.5,
        gracePeriodHours: 24,
      },
    }),
    prisma.roomConfig.create({
      data: {
        organizationId: org.id,
        roomSize: 4,
        totalRooms: 3,
        reservationThresholdPercent: 0.5,
        gracePeriodHours: 24,
      },
    }),
    prisma.roomConfig.create({
      data: {
        organizationId: org.id,
        roomSize: 6,
        totalRooms: 1,
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
  const students = [];

  // Claim and fully set up all students so you can log in as any and see a full roster of matches
  const numClaimed = STUDENTS_DATA.length;
  for (let i = 0; i < STUDENTS_DATA.length; i++) {
    const data = STUDENTS_DATA[i];
    const isClaimed = true;
    const surveyPreset = SURVEY_PRESETS[i % SURVEY_PRESETS.length];
    const bigFive = BIG_FIVE_PRESETS[i % BIG_FIVE_PRESETS.length];

    const isFirstUnclaimed = false;
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
        bio: isClaimed ? BIOS[i] : null,
        onboardingComplete: isClaimed,
        ...(isFirstUnclaimed ? { claimToken: "test-claim-token" } : {}),
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

  console.log(`Created ${students.length} students (all claimed with survey + Big Five + match weights)`);

  console.log("\n--- Demo Credentials ---");
  console.log("Admin: admin@westfield.edu / admin123");
  console.log("Students (any): use password student123");
  console.log("  e.g. alex.chen@university.edu, brianna.f@university.edu, c.ramirez@university.edu, ...");
  console.log("Org code: westfield");
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
