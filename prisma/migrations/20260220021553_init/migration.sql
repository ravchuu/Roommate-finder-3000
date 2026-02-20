-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "adminPasswordHash" TEXT NOT NULL,
    "deadline" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "email" TEXT NOT NULL,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "claimToken" TEXT NOT NULL,
    "preferredRoomSize" INTEGER,
    "photo" TEXT,
    "bio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoomConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "roomSize" INTEGER NOT NULL,
    "totalRooms" INTEGER NOT NULL,
    CONSTRAINT "RoomConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    CONSTRAINT "SurveyResponse_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchWeight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "traitKey" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1.0,
    CONSTRAINT "MatchWeight_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoommateRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromStudentId" TEXT NOT NULL,
    "toStudentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RoommateRequest_fromStudentId_fkey" FOREIGN KEY ("fromStudentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoommateRequest_toStudentId_fkey" FOREIGN KEY ("toStudentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "roomConfigId" TEXT NOT NULL,
    "roomSize" INTEGER NOT NULL,
    "leaderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'forming',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Room_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Room_roomConfigId_fkey" FOREIGN KEY ("roomConfigId") REFERENCES "RoomConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Room_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoomMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoomMember_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Endorsement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "endorsedStudentId" TEXT NOT NULL,
    "endorsedByStudentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Endorsement_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Endorsement_endorsedStudentId_fkey" FOREIGN KEY ("endorsedStudentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Endorsement_endorsedByStudentId_fkey" FOREIGN KEY ("endorsedByStudentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_adminEmail_key" ON "Organization"("adminEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Student_claimToken_key" ON "Student"("claimToken");

-- CreateIndex
CREATE INDEX "Student_organizationId_idx" ON "Student"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_organizationId_key" ON "Student"("email", "organizationId");

-- CreateIndex
CREATE INDEX "RoomConfig_organizationId_idx" ON "RoomConfig"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomConfig_organizationId_roomSize_key" ON "RoomConfig"("organizationId", "roomSize");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_studentId_key" ON "SurveyResponse"("studentId");

-- CreateIndex
CREATE INDEX "MatchWeight_studentId_idx" ON "MatchWeight"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchWeight_studentId_traitKey_key" ON "MatchWeight"("studentId", "traitKey");

-- CreateIndex
CREATE INDEX "RoommateRequest_fromStudentId_idx" ON "RoommateRequest"("fromStudentId");

-- CreateIndex
CREATE INDEX "RoommateRequest_toStudentId_idx" ON "RoommateRequest"("toStudentId");

-- CreateIndex
CREATE INDEX "RoommateRequest_status_idx" ON "RoommateRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RoommateRequest_fromStudentId_toStudentId_key" ON "RoommateRequest"("fromStudentId", "toStudentId");

-- CreateIndex
CREATE INDEX "Room_organizationId_idx" ON "Room"("organizationId");

-- CreateIndex
CREATE INDEX "Room_roomConfigId_idx" ON "Room"("roomConfigId");

-- CreateIndex
CREATE INDEX "Room_status_idx" ON "Room"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RoomMember_studentId_key" ON "RoomMember"("studentId");

-- CreateIndex
CREATE INDEX "RoomMember_roomId_idx" ON "RoomMember"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomMember_roomId_studentId_key" ON "RoomMember"("roomId", "studentId");

-- CreateIndex
CREATE INDEX "Endorsement_roomId_idx" ON "Endorsement"("roomId");

-- CreateIndex
CREATE INDEX "Endorsement_endorsedStudentId_idx" ON "Endorsement"("endorsedStudentId");

-- CreateIndex
CREATE UNIQUE INDEX "Endorsement_roomId_endorsedStudentId_endorsedByStudentId_key" ON "Endorsement"("roomId", "endorsedStudentId", "endorsedByStudentId");
