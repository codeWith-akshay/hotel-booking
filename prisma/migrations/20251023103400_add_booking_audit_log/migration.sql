-- CreateTable
CREATE TABLE "booking_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_audit_logs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "booking_audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "booking_audit_logs_bookingId_idx" ON "booking_audit_logs"("bookingId");

-- CreateIndex
CREATE INDEX "booking_audit_logs_adminId_idx" ON "booking_audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "booking_audit_logs_action_idx" ON "booking_audit_logs"("action");

-- CreateIndex
CREATE INDEX "booking_audit_logs_createdAt_idx" ON "booking_audit_logs"("createdAt");
