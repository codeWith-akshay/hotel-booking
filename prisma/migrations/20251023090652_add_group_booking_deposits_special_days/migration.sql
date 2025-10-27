-- CreateTable
CREATE TABLE "deposit_policies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "minRooms" INTEGER NOT NULL,
    "maxRooms" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "special_days" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "roomTypeId" TEXT,
    "ruleType" TEXT NOT NULL,
    "rateType" TEXT,
    "rateValue" REAL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "special_days_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "roomsBooked" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PROVISIONAL',
    "totalPrice" INTEGER NOT NULL,
    "depositAmount" INTEGER,
    "isDepositPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_bookings" ("createdAt", "endDate", "id", "roomTypeId", "startDate", "status", "totalPrice", "updatedAt", "userId") SELECT "createdAt", "endDate", "id", "roomTypeId", "startDate", "status", "totalPrice", "updatedAt", "userId" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");
CREATE INDEX "bookings_roomTypeId_idx" ON "bookings"("roomTypeId");
CREATE INDEX "bookings_startDate_idx" ON "bookings"("startDate");
CREATE INDEX "bookings_endDate_idx" ON "bookings"("endDate");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "bookings_createdAt_idx" ON "bookings"("createdAt");
CREATE INDEX "bookings_roomsBooked_idx" ON "bookings"("roomsBooked");
CREATE INDEX "bookings_isDepositPaid_idx" ON "bookings"("isDepositPaid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "deposit_policies_minRooms_idx" ON "deposit_policies"("minRooms");

-- CreateIndex
CREATE INDEX "deposit_policies_active_idx" ON "deposit_policies"("active");

-- CreateIndex
CREATE INDEX "special_days_date_idx" ON "special_days"("date");

-- CreateIndex
CREATE INDEX "special_days_roomTypeId_idx" ON "special_days"("roomTypeId");

-- CreateIndex
CREATE INDEX "special_days_ruleType_idx" ON "special_days"("ruleType");

-- CreateIndex
CREATE INDEX "special_days_active_idx" ON "special_days"("active");

-- CreateIndex
CREATE UNIQUE INDEX "special_days_date_roomTypeId_key" ON "special_days"("date", "roomTypeId");
