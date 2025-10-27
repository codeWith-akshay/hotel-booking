-- AlterTable
ALTER TABLE "deposit_policies" ADD COLUMN "description" TEXT;

-- CreateIndex
CREATE INDEX "deposit_policies_maxRooms_idx" ON "deposit_policies"("maxRooms");
