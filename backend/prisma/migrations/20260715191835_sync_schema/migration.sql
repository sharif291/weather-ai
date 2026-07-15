/*
  Warnings:

  - You are about to drop the column `uvThreshold` on the `Farm` table. All the data in the column will be lost.
  - You are about to drop the column `windThreshold` on the `Farm` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AlertLog" ADD COLUMN     "read" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Farm" DROP COLUMN "uvThreshold",
DROP COLUMN "windThreshold",
ADD COLUMN     "country" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "timezone" TEXT;

-- CreateTable
CREATE TABLE "AlertConfig" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "windThreshold" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "rainThreshold" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT false,
    "emailAddress" TEXT,
    "notifySms" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumber" TEXT,
    "notifyDiscord" BOOLEAN NOT NULL DEFAULT false,
    "discordWebhook" TEXT,
    "notifyInApp" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AlertConfig_farmId_key" ON "AlertConfig"("farmId");

-- AddForeignKey
ALTER TABLE "AlertConfig" ADD CONSTRAINT "AlertConfig_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
