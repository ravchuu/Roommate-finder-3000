import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

const SURVEY_PRESETS = [
  {
    sleepSchedule: "10pm-6am",
    cleanliness: 5,
    guestFrequency: "rarely",
    noiseTolerance: "low",
    dailyRoutine: "morning",
    personality: "INTJ",
  },
  {
    sleepSchedule: "11pm-7am",
    cleanliness: 4,
    guestFrequency: "sometimes",
    noiseTolerance: "medium",
    dailyRoutine: "morning",
    personality: "ENFP",
  },
  {
    sleepSchedule: "12am-8am",
    cleanliness: 3,
    guestFrequency: "sometimes",
    noiseTolerance: "medium",
    dailyRoutine: "flexible",
    personality: "ISTP",
  },
  {
    sleepSchedule: "1am-9am",
    cleanliness: 2,
    guestFrequency: "often",
    noiseTolerance: "high",
    dailyRoutine: "night",
    personality: "ESFP",
  },
  {
    sleepSchedule: "2am-10am",
    cleanliness: 3,
    guestFrequency: "often",
    noiseTolerance: "high",
    dailyRoutine: "night",
    personality: "ENTP",
  },
  {
    sleepSchedule: "10pm-6am",
    cleanliness: 4,
    guestFrequency: "rarely",
    noiseTolerance: "low",
    dailyRoutine: "morning",
    personality: "ISFJ",
  },
  {
    sleepSchedule: "11pm-7am",
    cleanliness: 5,
    guestFrequency: "rarely",
    noiseTolerance: "low",
    dailyRoutine: "morning",
    personality: "ISTJ",
  },
  {
    sleepSchedule: "12am-8am",
    cleanliness: 3,
    guestFrequency: "sometimes",
    noiseTolerance: "medium",
    dailyRoutine: "flexible",
    personality: "INFP",
  },
  {
    sleepSchedule: "1am-9am",
    cleanliness: 4,
    guestFrequency: "sometimes",
    noiseTolerance: "medium",
    dailyRoutine: "night",
    personality: "ENTJ",
  },
  {
    sleepSchedule: "10pm-6am",
    cleanliness: 5,
    guestFrequency: "never",
    noiseTolerance: "low",
    dailyRoutine: "morning",
    personality: "INFJ",
  },
];

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

  for (let i = 0; i < STUDENTS_DATA.length; i++) {
    const data = STUDENTS_DATA[i];
    const isClaimed = i < 12;
    const surveyPreset = SURVEY_PRESETS[i % SURVEY_PRESETS.length];

    const isFirstUnclaimed = i === 12;
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
    }

    students.push(student);
  }

  console.log(`Created ${students.length} students (${12} claimed, ${STUDENTS_DATA.length - 12} unclaimed)`);

  console.log("\n--- Demo Credentials ---");
  console.log("Admin: admin@westfield.edu / admin123");
  console.log("Student (any claimed): student123");
  console.log("");
  console.log("--- First-time Claim Test ---");
  console.log("Org code: westfield");
  console.log(`Email: ${STUDENTS_DATA[12].email}`);
  console.log("Claim token: test-claim-token");
  console.log("------------------------\n");

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
