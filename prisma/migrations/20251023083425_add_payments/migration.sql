-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "providerPaymentId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metadata" TEXT,
    "invoicePath" TEXT,
    "errorMessage" TEXT,
    "paidAt" DATETIME,
    "refundedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_providerPaymentId_key" ON "payments"("providerPaymentId");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_bookingId_idx" ON "payments"("bookingId");

-- CreateIndex
CREATE INDEX "payments_provider_idx" ON "payments"("provider");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt");

-- CreateIndex
CREATE INDEX "payments_paidAt_idx" ON "payments"("paidAt");
