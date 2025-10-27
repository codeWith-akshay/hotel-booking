-- CreateTable
CREATE TABLE "bulk_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "messageContent" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "totalRecipients" INTEGER NOT NULL,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "recipientsData" TEXT NOT NULL,
    "errorMessage" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bulk_messages_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "bulk_messages_adminId_idx" ON "bulk_messages"("adminId");

-- CreateIndex
CREATE INDEX "bulk_messages_status_idx" ON "bulk_messages"("status");

-- CreateIndex
CREATE INDEX "bulk_messages_channel_idx" ON "bulk_messages"("channel");

-- CreateIndex
CREATE INDEX "bulk_messages_createdAt_idx" ON "bulk_messages"("createdAt");
