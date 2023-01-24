/*
  Warnings:

  - Added the required column `userId` to the `Base` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hp` to the `Building` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Building` table without a default value. This is not possible if the table is not empty.
  - Added the required column `x` to the `Building` table without a default value. This is not possible if the table is not empty.
  - Added the required column `y` to the `Building` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Resource_Type" AS ENUM ('FOOD', 'IRON', 'ALUMNINUM', 'PLUTONIUM', 'GOLD');

-- CreateEnum
CREATE TYPE "Unit_Type" AS ENUM ('MARINE', 'COMMANDER', 'TANK');

-- CreateEnum
CREATE TYPE "Item_Type" AS ENUM ('WARP_DRIVE', 'REPAIR_KIT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Building_Type" ADD VALUE 'CAPITAL_BUILDING';
ALTER TYPE "Building_Type" ADD VALUE 'DWELLING';

-- AlterTable
ALTER TABLE "Base" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Building" ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "hp" INTEGER NOT NULL,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "type" "Building_Type" NOT NULL,
ADD COLUMN     "x" INTEGER NOT NULL,
ADD COLUMN     "y" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "type" "Unit_Type" NOT NULL,
    "amount" INTEGER NOT NULL,
    "baseId" TEXT,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "type" "Resource_Type" NOT NULL,
    "amount" INTEGER NOT NULL,
    "baseId" TEXT,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "type" "Item_Type" NOT NULL,
    "amount" INTEGER NOT NULL,
    "baseId" TEXT,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Base"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Base"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Base"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Base" ADD CONSTRAINT "Base_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
