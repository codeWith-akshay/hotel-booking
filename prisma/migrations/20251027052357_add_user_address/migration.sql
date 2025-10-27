-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "roleId" TEXT NOT NULL,
    "ircaMembershipId" TEXT,
    "address" TEXT,
    "vipStatus" TEXT NOT NULL DEFAULT 'NONE',
    "profilePicture" TEXT,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_users" ("createdAt", "email", "id", "ircaMembershipId", "name", "phone", "roleId", "updatedAt") SELECT "createdAt", "email", "id", "ircaMembershipId", "name", "phone", "roleId", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_ircaMembershipId_key" ON "users"("ircaMembershipId");
CREATE INDEX "users_phone_idx" ON "users"("phone");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_roleId_idx" ON "users"("roleId");
CREATE INDEX "users_ircaMembershipId_idx" ON "users"("ircaMembershipId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "notifications_userId_status_idx" ON "notifications"("userId", "status");
