-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "subject" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledAt" DATETIME NOT NULL,
    "sentAt" DATETIME,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_bookingId_idx" ON "notifications"("bookingId");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_channel_idx" ON "notifications"("channel");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_scheduledAt_idx" ON "notifications"("scheduledAt");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");
