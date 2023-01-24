/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Base` will be added. If there are existing duplicate values, this will fail.
  - Made the column `finishedAt` on table `Building` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Building_Type" ADD VALUE 'POWER_STATION';
ALTER TYPE "Building_Type" ADD VALUE 'EXTRACTOR';

-- AlterTable
ALTER TABLE "Building" ADD COLUMN     "lastHarvest" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "finishedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Base_userId_key" ON "Base"("userId");
