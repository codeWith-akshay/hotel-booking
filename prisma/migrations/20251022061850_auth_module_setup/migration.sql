/*
  Warnings:

  - You are about to drop the column `description` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bookings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bulk_message_jobs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bulk_message_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `invoices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `otp` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `room_inventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rooms` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `waitlist` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `permissions` on table `roles` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleId` to the `users` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_roomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."bulk_message_logs" DROP CONSTRAINT "bulk_message_logs_jobId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."profiles" DROP CONSTRAINT "profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."room_inventory" DROP CONSTRAINT "room_inventory_roomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_roles" DROP CONSTRAINT "user_roles_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_roles" DROP CONSTRAINT "user_roles_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."waitlist" DROP CONSTRAINT "waitlist_userId_fkey";

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "description",
ALTER COLUMN "permissions" SET NOT NULL,
ALTER COLUMN "permissions" SET DEFAULT '[]';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "firstName",
DROP COLUMN "isActive",
DROP COLUMN "lastName",
DROP COLUMN "password",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "roleId" TEXT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone" SET NOT NULL;

-- DropTable
DROP TABLE "public"."audit_logs";

-- DropTable
DROP TABLE "public"."bookings";

-- DropTable
DROP TABLE "public"."bulk_message_jobs";

-- DropTable
DROP TABLE "public"."bulk_message_logs";

-- DropTable
DROP TABLE "public"."invoices";

-- DropTable
DROP TABLE "public"."notifications";

-- DropTable
DROP TABLE "public"."otp";

-- DropTable
DROP TABLE "public"."payments";

-- DropTable
DROP TABLE "public"."profiles";

-- DropTable
DROP TABLE "public"."room_inventory";

-- DropTable
DROP TABLE "public"."rooms";

-- DropTable
DROP TABLE "public"."rules";

-- DropTable
DROP TABLE "public"."system_settings";

-- DropTable
DROP TABLE "public"."user_roles";

-- DropTable
DROP TABLE "public"."waitlist";

-- DropEnum
DROP TYPE "public"."BookingStatus";

-- DropEnum
DROP TYPE "public"."BulkJobStatus";

-- DropEnum
DROP TYPE "public"."MembershipType";

-- DropEnum
DROP TYPE "public"."NotificationChannel";

-- DropEnum
DROP TYPE "public"."NotificationStatus";

-- DropEnum
DROP TYPE "public"."PaymentMethod";

-- DropEnum
DROP TYPE "public"."PaymentStatus";

-- DropEnum
DROP TYPE "public"."RoomType";

-- DropEnum
DROP TYPE "public"."RuleType";

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otps_userId_idx" ON "otps"("userId");

-- CreateIndex
CREATE INDEX "otps_expiresAt_idx" ON "otps"("expiresAt");

-- CreateIndex
CREATE INDEX "roles_name_idx" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
