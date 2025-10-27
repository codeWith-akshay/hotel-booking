-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "idempotency_keys_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_key" ON "idempotency_keys"("key");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_bookingId_key" ON "idempotency_keys"("bookingId");

-- CreateIndex
CREATE INDEX "idempotency_keys_key_idx" ON "idempotency_keys"("key");

-- CreateIndex
CREATE INDEX "idempotency_keys_createdAt_idx" ON "idempotency_keys"("createdAt");
