-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'pending',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "invoiceNumber" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invoices_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_bookingId_key" ON "invoices"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_userId_idx" ON "invoices"("userId");

-- CreateIndex
CREATE INDEX "invoices_bookingId_idx" ON "invoices"("bookingId");

-- CreateIndex
CREATE INDEX "invoices_invoiceNumber_idx" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_paymentStatus_idx" ON "invoices"("paymentStatus");

-- CreateIndex
CREATE INDEX "invoices_issuedAt_idx" ON "invoices"("issuedAt");

-- CreateIndex
CREATE INDEX "invoices_createdAt_idx" ON "invoices"("createdAt");
