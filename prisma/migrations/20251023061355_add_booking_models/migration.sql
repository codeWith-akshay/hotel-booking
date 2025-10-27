-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROVISIONAL',
    "totalPrice" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "booking_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guestType" TEXT NOT NULL,
    "maxDaysAdvance" INTEGER NOT NULL,
    "minDaysNotice" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_roomTypeId_idx" ON "bookings"("roomTypeId");

-- CreateIndex
CREATE INDEX "bookings_startDate_idx" ON "bookings"("startDate");

-- CreateIndex
CREATE INDEX "bookings_endDate_idx" ON "bookings"("endDate");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_createdAt_idx" ON "bookings"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "booking_rules_guestType_key" ON "booking_rules"("guestType");

-- CreateIndex
CREATE INDEX "booking_rules_guestType_idx" ON "booking_rules"("guestType");
