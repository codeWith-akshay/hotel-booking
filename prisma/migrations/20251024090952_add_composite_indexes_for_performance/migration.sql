-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME,
    "revokedAt" DATETIME,
    "createdFromIp" TEXT,
    "userAgent" TEXT
);

-- CreateTable
CREATE TABLE "otp_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "attemptType" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "attemptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "metadata" TEXT
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "changes" TEXT,
    "reason" TEXT NOT NULL,
    "metadata" TEXT,
    "adminIp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_tokenHash_idx" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_revokedAt_idx" ON "refresh_tokens"("revokedAt");

-- CreateIndex
CREATE INDEX "otp_attempts_phone_attemptedAt_idx" ON "otp_attempts"("phone", "attemptedAt");

-- CreateIndex
CREATE INDEX "otp_attempts_ip_attemptedAt_idx" ON "otp_attempts"("ip", "attemptedAt");

-- CreateIndex
CREATE INDEX "otp_attempts_attemptType_idx" ON "otp_attempts"("attemptType");

-- CreateIndex
CREATE INDEX "security_events_eventType_idx" ON "security_events"("eventType");

-- CreateIndex
CREATE INDEX "security_events_userId_idx" ON "security_events"("userId");

-- CreateIndex
CREATE INDEX "security_events_ip_idx" ON "security_events"("ip");

-- CreateIndex
CREATE INDEX "security_events_severity_idx" ON "security_events"("severity");

-- CreateIndex
CREATE INDEX "security_events_occurredAt_idx" ON "security_events"("occurredAt");

-- CreateIndex
CREATE INDEX "admin_audit_logs_adminId_idx" ON "admin_audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "admin_audit_logs_action_idx" ON "admin_audit_logs"("action");

-- CreateIndex
CREATE INDEX "admin_audit_logs_targetType_targetId_idx" ON "admin_audit_logs"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "admin_audit_logs_createdAt_idx" ON "admin_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "bookings_status_startDate_endDate_idx" ON "bookings"("status", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "bookings_userId_status_createdAt_idx" ON "bookings"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "bookings_roomTypeId_startDate_endDate_idx" ON "bookings"("roomTypeId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "bookings_startDate_endDate_roomTypeId_status_idx" ON "bookings"("startDate", "endDate", "roomTypeId", "status");

-- CreateIndex
CREATE INDEX "notifications_status_scheduledAt_idx" ON "notifications"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "notifications_userId_type_status_idx" ON "notifications"("userId", "type", "status");

-- CreateIndex
CREATE INDEX "payments_status_createdAt_idx" ON "payments"("status", "createdAt");

-- CreateIndex
CREATE INDEX "payments_userId_status_idx" ON "payments"("userId", "status");

-- CreateIndex
CREATE INDEX "room_inventory_roomTypeId_date_availableRooms_idx" ON "room_inventory"("roomTypeId", "date", "availableRooms");

-- CreateIndex
CREATE INDEX "waitlist_status_startDate_endDate_idx" ON "waitlist"("status", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "waitlist_roomTypeId_status_createdAt_idx" ON "waitlist"("roomTypeId", "status", "createdAt");
