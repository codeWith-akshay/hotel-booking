-- CreateTable
CREATE TABLE "waitlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roomTypeId" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "guests" INTEGER NOT NULL DEFAULT 1,
    "guestType" TEXT NOT NULL DEFAULT 'REGULAR',
    "deposit" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "notifiedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "waitlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "waitlist_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "waitlist_userId_idx" ON "waitlist"("userId");

-- CreateIndex
CREATE INDEX "waitlist_roomTypeId_idx" ON "waitlist"("roomTypeId");

-- CreateIndex
CREATE INDEX "waitlist_startDate_idx" ON "waitlist"("startDate");

-- CreateIndex
CREATE INDEX "waitlist_endDate_idx" ON "waitlist"("endDate");

-- CreateIndex
CREATE INDEX "waitlist_status_idx" ON "waitlist"("status");

-- CreateIndex
CREATE INDEX "waitlist_createdAt_idx" ON "waitlist"("createdAt");

-- CreateIndex
CREATE INDEX "waitlist_expiresAt_idx" ON "waitlist"("expiresAt");
